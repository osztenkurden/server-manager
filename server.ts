import type { SimpleWebSocketServer } from "simple-websockets/server";
import { Writable } from 'node:stream';
import { spawn, type ChildProcess } from "node:child_process";
const linuxPath = "./../.steam/steam/steamcmd/cs2-ds/game/bin/linuxsteamrt64/cs2";

const stdout = "pipe" as const;

const server = {
    process: null as null | Bun.Subprocess<"pipe", typeof stdout>
}

const nodeServer = {
    process: null as null | ChildProcess
}



const SERVER_SPAWN = (process.argv[2] ?? 'NODE') as "NODE" | "BUN";

export const startServer = (wss: SimpleWebSocketServer) => {
    const decoder = new TextDecoder();
    const wr = new WritableStream({
        write: (chunk, controller) => {
            const str = decoder.decode(chunk);
            // process.stdout.write(`XD, ${str}`);
            wss.send("commandline", str);
        }
    })


    if (SERVER_SPAWN === "NODE") {
        if (nodeServer.process) {
            console.warn("Server exists!");
            return;
        }
        nodeServer.process = spawn(linuxPath, ['-dedicated', '+map de_mirage'], { stdio: ['pipe', stdout, 'inherit'] });

        nodeServer.process.stdout?.pipe(process.stdout);
        nodeServer.process.stdout?.on("data", () => {
            nodeServer.process?.stdout?.push("\n");
        });

        return;
    }





    if (server.process) {
        console.warn("Server exists!");
        return;
    }

    server.process = Bun.spawn([linuxPath, '-dedicated', '+map de_mirage'], {
        // cwd: serverPath,
        stdin: "pipe",
        stdout
    });

    const reader = server.process.stdout.getReader();


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
    if (SERVER_SPAWN === "NODE") {
        if (!nodeServer.process) {
            console.warn("No server!");
            return;
        }
        const { resolve, promise } = Promise.withResolvers();
        nodeServer.process.on("exit", () => {
            resolve();
        });
        writeToServer("quit");

        await promise;

        console.log("Server quited gracefully");
        nodeServer.process = null;
        return;

    }
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
    if (SERVER_SPAWN === "NODE") {
        nodeServer.process?.stdin?.write(`${text}\n`)
        return;
    }
    server.process?.stdin.write(`${text}\n`);
}
