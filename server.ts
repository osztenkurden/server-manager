import type { SimpleWebSocketServer } from "simple-websockets/server";
import { Writable } from 'node:stream';
const linuxPath = "./../.steam/steam/steamcmd/cs2-ds/game/bin/linuxsteamrt64/cs2";

const server = {
    process: null as null | Bun.Subprocess<"pipe", "pipe">
}

export const startServer = (wss: SimpleWebSocketServer) => {
    if (server.process) {
        console.warn("Server exists!");
        return;
    }

    server.process = Bun.spawn([linuxPath, '-dedicated', '+map de_mirage'], {
        // cwd: serverPath,
        stdin: "pipe",
        stdout: "pipe"
    });
    const reader = server.process.stdout.getReader();

    const decoder = new TextDecoder();
    const wr = new WritableStream({
        write: (chunk, controller) => {
            const str = decoder.decode(chunk);
            // process.stdout.write(`XD, ${str}`);
            wss.send("commandline", str);
        }
    })


    reader.read().then(function processOutput({ done, value }): Promise<void> {
        if (done) {
            wss.send("commandline", "STREAM END");
            console.log("STREAM END");
            return Promise.resolve();
        }
        const str = decoder.decode(value);
        wss.send("commandline", str);
        return reader.read().then(processOutput);

    });


    //server.process.stdout.pipeTo(Writable.toWeb(process.stdout))
    // server.process.stdout.pipeTo(wr);


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
