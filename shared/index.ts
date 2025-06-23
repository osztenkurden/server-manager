
export const COMMON_COMMANDS = {
    START_SERVER: "",
    STOP_SERVER: "quit",
    UPDATE_SERVER: "",
    RESTART_GAME: "mp_restartgame 1",
    PAUSE: "mp_pause_match",
    UNPAUSE: "mp_unpause_match",
    TV_STOP: "tv_stoprecord",
    START_MATCH: "",
    REPLAY_FROM_ROUND: "mp_backup_restore_load_file {{filename}}",
};

export type COMMON_COMMANDS = keyof typeof COMMON_COMMANDS;