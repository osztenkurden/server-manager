import {
  writeToServer,
  writeToSteamCMD,
} from "./backend/cs2server";
import { initiatieResourceUsageLoop } from "./backend/os";
import { server } from "./backend/server";


initiatieResourceUsageLoop(server);

setInterval(() => {
  writeToServer(" ");
  writeToSteamCMD(" ");
}, 5000);

console.log(`Listening on http://${server.hostname}:${server.port}/ in mode`, process.env.NODE_ENV);
