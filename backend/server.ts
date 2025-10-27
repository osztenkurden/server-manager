import { convertMessageToEvent } from "simple-websockets";
import { env } from "./env";
import Dashboard from "./../frontend/index.html";
import { deleteDemoFiles, getDemoList, uploadDemoFiles } from "./demo";
import z from "zod";
import { handleCommands } from "./handler";

export const serverState = {
  isOn: false,
  isPaused: false,
};
export const cachedChunk = {
  server: "",
  steamcmd: "",
};
const uploadFileInput = z.object({
  fileName: z.string(),
  playedAt: z.number(),
});

const deleteFileInput = z.object({
  fileName: z.string(),
});

const commandInput = z.object({
  command: z.string(),
  args: z.record(z.string(), z.string()).optional(),
});

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const checkAuth = (req: Bun.BunRequest | Request) => {
  const auth = req.headers.get("authorization");
  if (auth !== env.ACCESS_KEY) {
    throw new AuthError("Wrong auth key");
  }
};

export const server = Bun.serve({
  port: env.PORT || 5815,
  hostname: "0.0.0.0",
  routes: {
    "/": Dashboard,
    "/login": {
      POST: async (req) => {
        checkAuth(req);

        return new Response(null);
      },
    },
    "/status": (req) => {
      checkAuth(req);
      return Response.json(serverState);
    },
    "/debug": {
      GET: async (req) => {
        checkAuth(req);
        return Response.json(cachedChunk);
      },
    },
    "/demos": {
      GET: async (req) => {
        checkAuth(req);
        const files = await getDemoList();

        return Response.json(files);
      },

      POST: async (req) => {
        checkAuth(req);
        const body = uploadFileInput.parse(await req.json());
        const uploadId = uploadDemoFiles(body.fileName, body.playedAt, server);

        return Response.json({ ok: true, uploadId });
      },

      DELETE: async (req) => {
        checkAuth(req);
        const body = deleteFileInput.parse(await req.json());
        const result = await deleteDemoFiles(body.fileName);
        if (result) {
          return Response.json({ ok: true });
        }
        return Response.error();
      },
    },
    "/execute": {
      POST: async (req) => {
        checkAuth(req);
        const body = commandInput.parse(await req.json());
        if (body.command) {
          handleCommands(body.command, body.args);
        }
        return new Response(null, { status: 200 });
      },
    },
  },
  error(error) {
    return new Response(`Error: ${error.message}`, {
      status: error instanceof AuthError ? 403 : 500,
    });
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
      ws.subscribe("demoUploadProgress");
    },
  },
});
