import { useState, useRef, useEffect } from "react";
import {
    LogOut,
} from "lucide-react";
import { SimpleWebSocket } from "simple-websockets";

import type { ResourceUsage } from "../backend/os";
import { HOST, quickActions, secondsToTime, textToLine, type OutputType } from "./api";
import UploadFilesModal from "./upload";
import ky from "ky";
import { ActionButton } from "./button";

export function Terminal({ accessKey }: { accessKey: string }) {
    const [usage, setUsage] = useState<ResourceUsage>({
        cpuUsage: 0,
        memory: 0,
        freeMemory: 0,
        uptime: 0,
    });
    const [output, setOutput] = useState(
        ["$ Game console remote terminal initialized...", ""].map((x) =>
            textToLine(x)
        )
    );
    const [command, setCommand] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);
    const lastDistanceFromBottom = useRef(0);

    useEffect(() => {
        const socket = new SimpleWebSocket<{
            commandline: [string | string[], type: OutputType];
            resources: [ResourceUsage];
        }>(`ws://${HOST}`, { autoReconnect: true });

        socket.on("error", (err) => {
            console.log(err);
        });

        socket.on("connection", () => {
            addOutputs(["Connected to remote device", "Ready for commands"]);
            setIsConnected(true);
            socket.send("authorization", accessKey);
        });
        socket.on("disconnect", () => {
            setIsConnected(false);
        });
        socket.on("commandline", (data, type) => {
            if (typeof data === "string") addOutputs([data], type);
            else addOutputs(data, type);
        });

        socket.on("resources", (data) => {
            setUsage(data);
        });

        setIsConnected(socket._socket.readyState === 1);

        return () => {
            socket.removeAllListeners("commandline");
            socket.removeAllListeners("connection");
            socket.removeAllListeners("disconnect");
            socket.removeAllListeners("resources");
            socket._socket.close();
        };
    }, []);

    // Auto-scroll to bottom when new output is added
    useEffect(() => {
        if (outputRef.current) {
            const element = outputRef.current;

            if (lastDistanceFromBottom.current <= 250) {
                element.scrollTop = element.scrollHeight;
            }
        }
    }, [output]);

    // const addOutput = (text: string, type = 'output') => {
    //     addOutputs([text], type);
    // };

    const handleScroll = () => {
        lastDistanceFromBottom.current =
            outputRef.current!.scrollHeight -
            outputRef.current!.clientHeight -
            outputRef.current!.scrollTop;
    };

    const addOutputs = (text: string[], type: OutputType = "stdout") => {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = type === "command" ? `[${timestamp}] $ ` : `[${timestamp}] `;
        setOutput((prev) => [
            ...prev,
            ...text.map((t) => textToLine(`${prefix}${t}`, type)),
        ]);
    };
    const ignoredCommands = ["help", "clear", "status"];
    const handleCommand = (e: any) => {
        if (e.key && e.key !== "Enter") return;
        if (!command.trim()) return;

        addOutputs([command], "command");

        if (ignoredCommands.includes(command)) {
            addOutputs(["You fucking wish"]);
        } else {
            ky.post("/execute", { throwHttpErrors: false, json: { command }, headers: { authorization: accessKey } });
        }

        setCommand("");
    };

    const handleQuickAction = async (
        command: (typeof quickActions)[number]["action"]
    ) => {
        addOutputs([`Quick action: ${command}`], "command");

        try {
            ky.post("/execute", { throwHttpErrors: false, json: { command }, headers: { authorization: accessKey } })

            //   if (response.ok) {
            //     const result = await response.text();
            //     addOutput(result || `${action} executed successfully`);
            //   } else {
            //     addOutput(`Error: ${response.status} - ${response.statusText}`);
            //   }
        } catch (error) {
            addOutputs([`Network error: ${error}`]);
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-green-400 font-mono  overflow-hidden">
            {/* Main Terminal Area */}
            <div className="flex-1 flex flex-col p-4 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
                    <h1 className="text-xl font-bold text-green-300">
                        Bakerysoft Server Console
                    </h1>
                    <div className="flex items-center space-x-2">
                        <div
                            className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                                }`}
                        ></div>
                        <span className="text-sm">
                            {isConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                </div>

                {/* Output Display */}
                <div
                    ref={outputRef}
                    onScroll={handleScroll}
                    className="flex-1 whitespace-pre bg-black border-2 border-gray-700 rounded-lg p-4 overflow-auto mb-4 text-sm leading-relaxed"
                >
                    {output.map((line, index) => (
                        <div
                            key={index}
                            className={`mb-1 ${line.type === "stderr" ? "text-red-500" : ""}`}
                        >
                            {line.content}
                        </div>
                    ))}
                    <div className="inline">
                        {/*$ {command}*/}
                        <span className="animate-pulse duration-75">▋</span>
                    </div>
                </div>

                {/* Command Input */}
                <div className="flex space-x-2">
                    <span className="text-green-300 self-center">$</span>
                    <input
                        type="text"
                        value={command}
                        onChange={(e) => setCommand(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleCommand(e);
                            }
                        }}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-green-400 focus:outline-none focus:border-green-400"
                        placeholder="Enter command..."
                        autoComplete="off"
                    />
                    <button
                        onClick={handleCommand}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-semibold transition-colors"
                    >
                        Send
                    </button>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
                <h2 className="text-lg font-semibold text-green-300 mb-4 text-center">
                    Quick Actions
                </h2>
                <div className="space-y-3">
                    {quickActions.map((action) => {
                        const IconComponent = action.icon;
                        return (
                            <ActionButton color={action.color} onClick={() => handleQuickAction(action.action)} >
                                <IconComponent size={18} />
                                <span>{action.name}</span>
                            </ActionButton>
                        );
                    })}
                    <UploadFilesModal accessKey={accessKey} />
                    <ActionButton color={"bg-gray-600 hover:bg-gray-700"} onClick={() => {
                        localStorage.removeItem('access_key');
                        window.location.reload();
                    }} >
                        <LogOut size={18} />
                        <span>LOG OUT</span>
                    </ActionButton>
                </div>

                {/* Connection Status */}
                <div className="mt-8 p-3 bg-gray-900 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-300 mb-2">
                        System Status
                    </h3>
                    <div className="text-xs space-y-1">
                        <div>CPU: {(usage.cpuUsage * 100).toFixed(2)}%</div>
                        <div>
                            Memory:{" "}
                            {((usage.memory - usage.freeMemory) / 1024 ** 3).toFixed(1)}GB
                        </div>
                        <div>Uptime: {secondsToTime(usage.uptime)}</div>
                    </div>
                </div>

                {/* Quick Help */}
                <div className="mt-4 p-3 bg-gray-900 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-300 mb-2">
                        Quick Help
                    </h3>
                    <div className="text-xs space-y-1 text-gray-400">
                        <div>Type 'help' for commands</div>
                        <div>Type 'clear' to clear output</div>
                        <div>Type 'status' for system info</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
