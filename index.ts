import {
  startGame,
  startServer,
  stopServer,
  updateServer,
  writeToServer,
  writeToSteamCMD,
} from "./server";
import Dashboard from "./panel/index.html";
import { initiatieResourceUsageLoop } from "./os";
import { getDemoList, uploadDemoFiles } from "./demo";
import { z } from "zod";
import { env } from "./env";
import { convertMessageToEvent } from "simple-websockets";

const COMMON_COMMANDS = {
  PAUSE: "mp_pause_match",
  UNPAUSE: "mp_unpause_match",
  REPLAY_FROM_ROUND: "mp_backup_restore_load_file {{filename}}",
  START_MATCH: "",
  RESTART_GAME: "mp_restartgame 1",
  STOP_SERVER: "quit",
  UPDATE_SERVER: "",
  TV_STOP: "tv_stoprecord",
  START_SERVER: "",
};

export const cachedChunk = {
  server: "",
  steamcmd: ""
};

export type COMMON_COMMANDS = keyof typeof COMMON_COMMANDS;

const formatCommand = (command: string, args: Record<string, string> = {}) => {
  let currentCommand =
    command in COMMON_COMMANDS
      ? COMMON_COMMANDS[command as keyof typeof COMMON_COMMANDS]
      : command;
  for (const key of Object.keys(args)) {
    currentCommand = currentCommand.replace(`{{${key}}}`, args[key]!);
  }
  return currentCommand;
};

const serverState = {
  isOn: false,
  isPaused: false,
};

const handleCommands = (command: string, args: Record<string, string> = {}) => {
  writeToServer(formatCommand(command, args));
  switch (command) {
    case "START_MATCH":
      startGame();
      break;
    case "PAUSE":
      serverState.isPaused = true;
      break;
    case "UNPAUSE":
      serverState.isPaused = false;
      break;
    case "STOP_SERVER":
      stopServer();
      serverState.isOn = false;
      break;
    case "START_SERVER":
      startServer(server);
      serverState.isOn = true;
      break;
    case "UPDATE_SERVER":
      updateServer(server);
      break;
  }

  if (!(command in COMMON_COMMANDS)) {
    setTimeout(() => {
      writeToServer(" ");
    }, 50);
  }
};

const uploadFileInput = z.object({
  fileName: z.string(),
  playedAt: z.number()
});

const commandInput = z.object({
  command: z.string(),
  args: z.record(z.string(), z.string()).optional()
})

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const checkAuth = (req: Bun.BunRequest | Request, log = false) => {
  const auth = req.headers.get("authorization");
  if (log) console.log(req.headers.toJSON());
  if (auth !== env.ACCESS_KEY) {
    throw new AuthError("Wrong auth key");
  }
}

const server = Bun.serve({
  port: 5815,
  hostname: "0.0.0.0",
  routes: {
    "/status": (req) => {
      checkAuth(req);
      return Response.json(serverState);
    },
    "/debug": {
      GET: async () => {
        return Response.json(cachedChunk);
      },
    },
    "/demos": {
      GET: async (req) => {
        checkAuth(req);
        const files = await getDemoList();

        return Response.json(files);
      },
    },
    "/login": {
      POST: async req => {
        checkAuth(req);

        return new Response(null);
      }
    },
    "/upload": {
      POST: async (req) => {
        checkAuth(req);
        const body = uploadFileInput.parse(await req.json());
        await uploadDemoFiles(body.fileName, body.playedAt);

        return Response.json({ ok: true });
      },
    },
    "/dashboard": Dashboard,
    "/execute": {
      POST: async (req) => {
        checkAuth(req);
        const body = commandInput.parse((await req.json()));
        if (body.command) {
          handleCommands(body.command, body.args);
        }
        return new Response(null, { status: 200 });
      },
    },
  },
  error(error) {
    return new Response(`Error: ${error.message}`, {
      status: error instanceof AuthError ? 403 : 500
    })
  },
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      return;
    }
    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    message(ws, message) {
      const msg = convertMessageToEvent(message);
      if (!msg || msg.eventName !== "authorization") return;

      if (msg.values[0] !== env.ACCESS_KEY) {
        ws.close();
        return;
      }
      ws.subscribe("stdout");
      ws.subscribe("stderr");
    }
  },
});

initiatieResourceUsageLoop(server);

setInterval(() => {
  writeToServer(" ");
  writeToSteamCMD(" ");
}, 5000);

console.log(`Listening on http://${server.hostname}:${server.port}/dashboard DEVELOPMENT`, process.env.NODE_ENV !== 'production');
