import { SimpleWebSocket } from "simple-websockets";

const socket = new SimpleWebSocket("ws://172.30.0.244:5815");
socket.on("connection", () => {
    console.log("CONNECTED")
})
socket.on("commandline", data => {
    process.stdout.write(data);
})