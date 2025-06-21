import express from 'express';
import http from 'http';
import { SimpleWebSocketServer } from 'simple-websockets/server';
import { startServer, stopServer, writeToServer } from './server';

const COMMON_COMMANDS = {
    "PAUSE": "mp_pause_match",
    "UNPAUSE": "mp_unpause_match",
    "REPLAY_FROM_ROUND": "mp_backup_restore_load_file {{filename}}",
    "START_MATCH": "TODO",
    "RESTART_GAME": "mp_restartgame 1",
    "STOP_SERVER": "quit",
    "TV_STOP": "tv_stoprecord"
};

const sideEffects: { [K in keyof typeof COMMON_COMMANDS]?: () => void } = {
    "STOP_SERVER": () => {

    }
}

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


const app = express();
app.use(express.json());


const server = http.createServer(app);
const wss = new SimpleWebSocketServer({ server });


app.route("/")
    .get((req, res) => { res.json(serverState) });

app.route("/execute")
    .post((req, res) => {
        if (!req.body.command) {
            res.sendStatus(200);
            return;
        }
        writeToServer(formatCommand(req.body.command, req.body.args))
        switch (req.body.command) {
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
                startServer(wss);
                serverState.isOn = true;
                break;
        }
        res.sendStatus(200);
    })

server.listen(6815, () => { console.log("\n\n\n\nLISTENINTG\n\n\n\n") });

