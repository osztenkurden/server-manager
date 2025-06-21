import type { SimpleWebSocketServer } from "simple-websockets/server";
import { Writable } from 'node:stream';
import { spawn, type ChildProcess } from "node:child_process";
const linuxPath = "./../.steam/steam/steamcmd/cs2-ds/game/bin/linuxsteamrt64/cs2";

const stdout = "pipe" as const;

const server = {
    process: null as null | Bun.Subprocess<"pipe", typeof stdout>
}



// const SERVER_SPAWN = (process.argv[2] ?? 'NODE') as "NODE" | "BUN";

export const startServer = (wss: SimpleWebSocketServer) => {
    if (server.process) {
        console.warn("Server exists!");
        return;
    }

    const decoder = new TextDecoder();
    const wr = new WritableStream({
        write: (chunk, controller) => {
            const str = decoder.decode(chunk);
            // process.stdout.write(`XD, ${str}`);
            wss.send("commandline", str);
            if (!str.endsWith("\n")) {
                writeToServer("");
            }
        }
    })



    server.process = Bun.spawn([linuxPath, '-dedicated', '+map de_mirage'], {
        // cwd: serverPath,
        stdin: "pipe",
        stdout
    });

    //server.process.stdout.pipeTo(Writable.toWeb(process.stdout))
    server.process.stdout.pipeTo(wr);


}

export const stopServer = async () => {
    if (!server.process) {
        console.warn("No server!");
        return;
    }

    writeToServer("quit");
    await server.process.exited;
    console.log("Server quited gracefully");
    server.process = null;
}

export const writeToServer = (text: string) => {
    server.process?.stdin.write(`${text}\n`);
}
