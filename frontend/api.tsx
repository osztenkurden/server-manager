import {
    Play,
    RotateCcw,
    Download,
    Flag,
    X,
    Pause,
    Monitor,
} from "lucide-react";
import type { COMMON_COMMANDS } from "../backend/handler";

export const HOST = window.location.host;


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


export const quickActions = [
    {
        name: "START SERVER",
        action: "START_SERVER",
        icon: Play,
        color: "bg-green-600 hover:bg-green-700",
    },
    {
        name: "STOP SERVER",
        action: "STOP_SERVER",
        icon: X,
        color: "bg-red-600 hover:bg-red-700",
    },
    {
        name: "UPDATE SERVER",
        icon: Download,
        action: "UPDATE_SERVER",
        color: "bg-teal-600 hover:bg-teal-700",
    },
    {
        name: "RESTART GAME",
        action: "RESTART_GAME",
        icon: RotateCcw,
        color: "bg-yellow-600 hover:bg-yellow-700",
    },
    {
        name: "PAUSE",
        action: "PAUSE",
        icon: Pause,
        color: "bg-blue-600 hover:bg-blue-700",
    },
    {
        name: "UNPAUSE",
        action: "UNPAUSE",
        icon: Play,
        color: "bg-purple-600 hover:bg-purple-700",
    },
    {
        name: "TV STOP",
        action: "TV_STOP",
        icon: Monitor,
        color: "bg-pink-600 hover:bg-pink-700",
    },
    {
        name: "START MATCH",
        action: "START_MATCH",
        icon: Flag,
        color: "bg-indigo-600 hover:bg-indigo-700",
    },
] as const satisfies {
    name: string;
    action: COMMON_COMMANDS;
    icon: any;
    color: string;
}[];