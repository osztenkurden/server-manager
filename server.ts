import { convertEventToMessage } from "simple-websockets";
const linuxPath = "./../.steam/steam/steamcmd/cs2-ds/game/bin/linuxsteamrt64/cs2";

const server = {
    process: null as null | Bun.Subprocess<"pipe", "pipe">,
    ws: null as null | Bun.Server
}


export const startServer = (wss: Bun.Server) => {
    if (server.process) {
        console.warn("Server exists!");
        return;
    }
    let lastChunk = '';
    const decoder = new TextDecoder();
    const wr = new WritableStream({
        write: (chunk) => {
            const str = decoder.decode(chunk);
            lastChunk += str;


            if (!str.endsWith("\n")) {
                writeToServer("");
            } else {

                const lines = lastChunk.split("\n");
                wss.publish("stdout", convertEventToMessage("commandline", lines.filter(Boolean)));

            }
        }
    })

    server.process = Bun.spawn([linuxPath, '-dedicated', '+map de_mirage'], {
        stdin: "pipe",
        stdout: "pipe"
    });
    if (!server.ws) server.ws = wss;

    server.process.stdout.pipeTo(wr);
}

export const stopServer = async () => {
    if (!server.process) {
        console.warn("No server!");
        return;
    }

    writeToServer("quit");
    await server.process.exited;

    server.ws?.publish("stdout", convertEventToMessage("commandline", "Server quited gracefully\n"));

    console.log("Server quited gracefully");
    server.process = null;
}

export const writeToServer = (text: string) => {
    server.process?.stdin.write(`${text}\n`);
}
