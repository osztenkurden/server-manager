import { convertEventToMessage } from "simple-websockets";
import type { SimpleWebSocketServer } from "simple-websockets/server";
const linuxPath = "./../.steam/steam/steamcmd/cs2-ds/game/bin/linuxsteamrt64/cs2";

const server = {
    process: null as null | Bun.Subprocess<"pipe", "pipe">
}


export const startServer = (wss: Bun.Server) => {
    if (server.process) {
        console.warn("Server exists!");
        return;
    }

    const decoder = new TextDecoder();
    const wr = new WritableStream({
        write: (chunk) => {
            const str = decoder.decode(chunk);
            wss.publish("stdout", convertEventToMessage("commandline", str));
            if (!str.endsWith("\n")) {
                writeToServer("");
            }
        }
    })

    server.process = Bun.spawn([linuxPath, '-dedicated', '+map de_mirage'], {
        stdin: "pipe",
        stdout: "pipe"
    });

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
