import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  RotateCcw,
  Download,
  Flag,
  X,
  Pause,
  Monitor,
} from "lucide-react";
import { SimpleWebSocket } from "simple-websockets";

import type { COMMON_COMMANDS } from "./../index";
import type { ResourceUsage } from "../os";

const secondsToTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds - 3600 * hours) / 60);
  const secs = seconds - 3600 * hours - 60 * minutes;

  let text = "";

  if (hours) text += `${hours}h `;
  if (minutes) text += `${minutes}m `;
  text += `${secs}s`;

  return text;
};

// const HOST = "172.30.0.244:5815"; //window.location.host;
const HOST = window.location.host;

const socket = new SimpleWebSocket<{
  commandline: [string | string[]];
  resources: [ResourceUsage];
}>(`ws://${HOST}`);

socket.on("error", (err) => {
  console.log(err);
});

export function App() {
  const [usage, setUsage] = useState<ResourceUsage>({
    cpuUsage: 0,
    memory: 0,
    freeMemory: 0,
    uptime: 0,
  });
  const [output, setOutput] = useState([
    "$ Game console remote terminal initialized...",
    "",
  ]);
  const [command, setCommand] = useState("");
  const [isConnected, setIsConnected] = useState(
    socket._socket.readyState === 1
  );
  const outputRef = useRef<HTMLDivElement>(null);
  const lastDistanceFromBottom = useRef(0);

  useEffect(() => {
    socket.on("connection", () => {
      addOutputs(["Connected to remote device"]);
      // '$ Connected to remote device',
      // '$ Ready for commands',')
      setIsConnected(true);
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    socket.on("commandline", (data) => {
      if (typeof data === "string") addOutputs([data]);
      else addOutputs(data);
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

  const addOutputs = (text: string[], type = "output") => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === "command" ? `[${timestamp}] $ ` : `[${timestamp}] `;
    setOutput((prev) => [...prev, ...text.map((t) => `${prefix}${t}`)]);
  };
  const ignoredCommands = ["help", "clear", "status"];
  const handleCommand = (e: any) => {
    if (e.key && e.key !== "Enter") return;
    if (!command.trim()) return;

    addOutputs([command], "command");

    if (ignoredCommands.includes(command)) {
      addOutputs(["You fucking wish"]);
    } else {
      fetch(`http://${HOST}/execute`, {
        method: "POST",
        body: JSON.stringify({ command }),
        headers: { "Content-Type": "application/json" },
      });
    }

    setCommand("");
  };

  const handleQuickAction = async (
    action: (typeof quickActions)[number]["action"]
  ) => {
    addOutputs([`Quick action: ${action}`], "command");

    try {
      const response = await fetch(`http://${HOST}/execute`, {
        method: "POST",
        body: JSON.stringify({ command: action }),
        headers: { "Content-Type": "application/json" },
      });

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

  const quickActions = [
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
      action: "STOP_SERVER",
      icon: RotateCcw,
      color: "bg-yellow-600 hover:bg-yellow-700",
    },
    {
      name: "PAUSE",
      action: "STOP_SERVER",
      icon: Pause,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      name: "UNPAUSE",
      action: "STOP_SERVER",
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
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
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
            <div key={index} className="mb-1">
              {line}
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
            onKeyPress={(e) => {
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
              <button
                key={action.name}
                onClick={() => handleQuickAction(action.action)}
                className={`w-full ${action.color} text-white py-3 px-4 rounded-lg flex items-center cursor-pointer justify-center space-x-2 transition-colors font-semibold`}
              >
                <IconComponent size={18} />
                <span>{action.name}</span>
              </button>
            );
          })}
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
