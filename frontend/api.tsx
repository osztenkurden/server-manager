import {
    Play,
    RotateCcw,
    Download,
    Flag,
    X,
    Pause,
    Monitor,
} from "lucide-react";
import { COMMON_COMMANDS } from "../shared";


//UTILS



export const secondsToTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - 3600 * hours) / 60);
    const secs = seconds - 3600 * hours - 60 * minutes;

    let text = "";

    if (hours) text += `${hours}h `;
    if (minutes) text += `${minutes}m `;
    text += `${secs}s`;

    return text;
};

export type OutputType = "stdout" | "stderr" | "command";

export const textToLine = (text: string, type: OutputType = "stdout") => ({
    content: text,
    type,
});

type QuickAction = {
    name: string;
    action: COMMON_COMMANDS,
    icon: any;
    color: string;
    label?: string
}

const _quickActions: { [K in COMMON_COMMANDS]?: Omit<QuickAction, "action"> } = {
    START_SERVER: {
        name: "START SERVER",
        icon: Play,
        color: "bg-green-600 hover:bg-green-700",
    },
    STOP_SERVER: {
        name: "STOP SERVER",
        icon: X,
        color: "bg-red-600 hover:bg-red-700",
    },
    UPDATE_SERVER: {
        name: "UPDATE SERVER",
        icon: Download,
        color: "bg-teal-600 hover:bg-teal-700",
    },
    RESTART_GAME: {
        name: "RESTART GAME",
        icon: RotateCcw,
        color: "bg-yellow-600 hover:bg-yellow-700",
    },
    PAUSE: {
        name: "PAUSE",
        icon: Pause,
        color: "bg-blue-600 hover:bg-blue-700",
    },
    UNPAUSE: {
        name: "UNPAUSE",
        icon: Play,
        color: "bg-purple-600 hover:bg-purple-700",
    },
    TV_STOP: {
        name: "TV STOP",
        icon: Monitor,
        color: "bg-pink-600 hover:bg-pink-700",
    },
    START_MATCH: {
        name: "START MATCH",
        icon: Flag,
        color: "bg-indigo-600 hover:bg-indigo-700",
        label: "mp_restartgame 1\nmp_warmup_end 1\ntv_record X.dem \n"
    }
}

export const quickActions = Object.entries(_quickActions).reduce((prev, curr) => [...prev, { ...curr[1], action: curr[0] as COMMON_COMMANDS, label: curr[1].label ?? COMMON_COMMANDS[curr[0] as COMMON_COMMANDS] }], [] as QuickAction[]);