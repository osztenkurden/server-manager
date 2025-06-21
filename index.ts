import { startServer, stopServer, writeToServer } from './server';
import Dashboard from './panel/index.html';

const COMMON_COMMANDS = {
    "PAUSE": "mp_pause_match",
    "UNPAUSE": "mp_unpause_match",
    "REPLAY_FROM_ROUND": "mp_backup_restore_load_file {{filename}}",
    "START_MATCH": "TODO",
    "RESTART_GAME": "mp_restartgame 1",
    "STOP_SERVER": "quit",
    "TV_STOP": "tv_stoprecord"
};

const formatCommand = (command: string, args: Record<string, string> = {}) => {
    let currentCommand = command in COMMON_COMMANDS ? COMMON_COMMANDS[command as keyof typeof COMMON_COMMANDS] : command;
    for (const key of Object.keys(args)) {
        currentCommand = currentCommand.replace(`{{${key}}}`, args[key]!);
    }
    return currentCommand;
}

const serverState = {
    isOn: false,
    isPaused: false,
}

const handleCommands = (command: string, args: Record<string, string> = {}) => {

    writeToServer(formatCommand(command, args))
    switch (command) {
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
    }
}


const server = Bun.serve({
    port: 5815,
    routes: {
        "/status": (req) => {
            return Response.json(serverState);
        },
        "/dashboard": Dashboard,
        "/execute": {
            POST: async req => {
                const body = await req.json() as { command: string, args: any };
                if (body.command) {
                    handleCommands(body.command, body.args);
                }
                return new Response("ok", { status: 200 });
            }
        }
    },
    fetch(req, server) {
        const success = server.upgrade(req);
        if (success) {
            return;
        }
        return new Response("Not Found", { status: 404 });
    },
    websocket: {
        message() {
        },
        open(ws) {
            ws.subscribe("stdout");
        },
    },
});

console.log(`Listening on ${server.hostname}:${server.port}`);