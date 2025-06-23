import { writeToServer, startGame, stopServer, startServer, updateServer } from "./cs2server";
import { server, serverState } from "./server";

export const COMMON_COMMANDS = {
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


export const handleCommands = (command: string, args: Record<string, string> = {}) => {
    writeToServer(formatCommand(command, args));
    if (command in COMMON_COMMANDS) {
        const _command = command as COMMON_COMMANDS;
        switch (_command) {
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
            case "REPLAY_FROM_ROUND":
            case "RESTART_GAME": // Restart the recording as well?
            case "TV_STOP":
                break;
            default:
                _command satisfies never;
        }
        return;
    }
    setTimeout(() => {
        writeToServer(" ");
    }, 50);
};