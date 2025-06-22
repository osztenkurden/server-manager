import {
  startGame,
  startServer,
  stopServer,
  updateServer,
  writeToServer,
} from "./server";
import Dashboard from "./panel/index.html";
import { initiatieResourceUsageLoop } from "./os";

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

const server = Bun.serve({
  port: 5815,
  hostname: "0.0.0.0",
  routes: {
    "/status": (req) => {
      return Response.json(serverState);
    },
    "/dashboard": Dashboard,
    "/execute": {
      POST: async (req) => {
        const res = new Response("ok", { status: 200 });

        res.headers.set("Access-Control-Allow-Origin", "*");
        res.headers.set(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS"
        );
        res.headers.set("Access-Control-Allow-Headers", "Content-Type");

        const body = (await req.json()) as { command: string; args: any };
        if (body.command) {
          handleCommands(body.command, body.args);
        }
        return res;
      },
    },
  },
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      return;
    }
    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    message() {},
    open(ws) {
      ws.subscribe("stdout");
      ws.subscribe("stderr");
    },
  },
});

initiatieResourceUsageLoop(server);

console.log(`Listening on http://${server.hostname}:${server.port}/dashboard`);
