import { convertEventToMessage } from "simple-websockets";
import { env } from "./env";
import os from "os";
import path from "path";
import { cachedChunk } from ".";
import { DEMO_PREFIX } from "./demo";
import type { OutputType } from "./panel/api";

const OS = os.platform() === "win32" ? "WINDOWS" : "LINUX";

const CS2_SERVER_PATH = {
  WINDOWS: path.join(env.CS2_PATH, ".\\game\\bin\\win64"),
  LINUX: path.join(env.CS2_PATH, "./game/bin/linuxsteamrt64"),
};

const CFG_PATH = path.join(env.CS2_PATH, "./game/csgo/cfg");

const server = {
  process: null as null | Bun.Subprocess<"pipe", "pipe", "pipe">,
  updateProcess: null as null | Bun.Subprocess<"pipe", "pipe", "pipe">,
  ws: null as null | Bun.Server,
};
const getTimeStamp = () => {
  const padNo = (num: number) => `${num}`.padStart(2, "0");

  const x = new Date();
  return `${x.getUTCFullYear()}-${padNo(1 + x.getUTCMonth())}-${padNo(
    x.getUTCDate()
  )}_${padNo(x.getUTCHours())}-${padNo(x.getUTCMinutes())}`;
};

export const startGame = async () => {
  const timestamp = getTimeStamp();
  const demoFilename = `${DEMO_PREFIX}${timestamp}`;
  const tempCfgContent = `
mp_warmup_end
mp_restartgame 1
tv_record_immediate 1
tv_record ${demoFilename}
`;
  const filename = `temp_cfg_${timestamp}.cfg`;
  const tempCfg = Bun.file(path.join(CFG_PATH, filename));
  await tempCfg.write(tempCfgContent);

  logToAll(`Match will be saved as ${demoFilename}.dem`);

  writeToServer(`exec ${filename}`);
};

export const logToAll = (line: string) => {
  console.log(line);
  sendLine(line);
};

export const sendLine = (line: string | string[], type: OutputType = "stdout") => {
  if (!server.ws) return;

  server.ws.publish(
    "stdout",
    convertEventToMessage(
      "commandline",
      typeof line === "string" ? [line] : line,
      type
    )
  );
};

const getWritableStream = (
  type: "stdout" | "stderr" = "stdout",
  writeChunkCallback?: (chunk: string) => void
) => {
  let lastChunk = "";
  const decoder = new TextDecoder();
  const wr = new WritableStream({
    write: (chunk) => {
      const str = decoder.decode(chunk).replaceAll("\u001B[0m", "");
      lastChunk += str;
      // ANSI RESET SIGN
      if (!str.endsWith("\n")) {
        writeToServer(" \n");
      } else {
        const lines = lastChunk.split("\n");
        sendLine(lines.filter(Boolean), type);
        lastChunk = "";
      }
      writeChunkCallback?.(lastChunk);
    },
  });

  return wr;
};

export const updateServer = (wss: Bun.Server) => {
  if (server.process || server.updateProcess) {
    logToAll("Server is running or is being updated!");
    return;
  }

  const stdoutWr = getWritableStream();
  const stderrWr = getWritableStream("stderr");

  server.updateProcess = Bun.spawn(
    [
      OS === "WINDOWS" ? "./steamcmd" : "./steamcmd.sh",
      `+force_install_dir ${env.CS2_PATH}`,
      "+login anonymous",
      "+app_update 730",
      "+quit",
    ],
    {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      cwd: env.STEAMCMD_PATH,
    }
  );
  if (!server.ws) server.ws = wss;

  server.updateProcess.stdout.pipeTo(stdoutWr);
  server.updateProcess.stderr.pipeTo(stderrWr);
  server.updateProcess.exited.then(() => {
    logToAll("Update finalised");
    server.updateProcess = null;
  });
};

export const startServer = (wss: Bun.Server) => {
  if (server.process || server.updateProcess) {
    logToAll("Server exists or is being updated!");
    return;
  }

  const stdoutWr = getWritableStream("stdout", (chunk) => {
    cachedChunk.server = chunk;
  });
  const stderrWr = getWritableStream("stderr");

  server.process = Bun.spawn(
    ["./cs2", "-dedicated", ...(env.CS2_SERVER_ARGS?.split(",") ?? [])],
    {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      cwd: CS2_SERVER_PATH[OS],
    }
  );
  if (!server.ws) server.ws = wss;

  server.process.stdout.pipeTo(stdoutWr);
  server.process.stderr.pipeTo(stderrWr);
};

export const stopServer = async () => {
  if (!server.process) {
    logToAll("No server!");
    return;
  }

  writeToServer("quit");
  await server.process.exited;

  logToAll("Server quited gracefully");

  server.process = null;
};

export const writeToServer = (text: string) => {
  server.process?.stdin.write(`${text}\n`);
  server.process?.stdin.flush();
};

export const writeToSteamCMD = (text: string) => {
  server.updateProcess?.stdin.write(`${text}\n`);
  server.updateProcess?.stdin.flush();
};
