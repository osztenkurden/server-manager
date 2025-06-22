import _os from "node:os";
import { convertEventToMessage } from "simple-websockets";

const getCPUInfo = () => {
  const cpus = _os.cpus();

  let user = 0;
  let nice = 0;
  let sys = 0;
  let idle = 0;
  let irq = 0;

  for (const cpu in cpus) {
    if (!cpus.hasOwnProperty(cpu)) continue;
    user += cpus[cpu]!.times.user;
    nice += cpus[cpu]!.times.nice;
    sys += cpus[cpu]!.times.sys;
    irq += cpus[cpu]!.times.irq;
    idle += cpus[cpu]!.times.idle;
  }

  const total = user + nice + sys + idle + irq;

  return {
    idle: idle,
    total: total,
  };
};

const getResourceUsage = async () => {
  const stats1 = getCPUInfo();
  const startIdle = stats1.idle;
  const startTotal = stats1.total;

  await Bun.sleep(1000);

  const stats2 = getCPUInfo();
  const endIdle = stats2.idle;
  const endTotal = stats2.total;

  const idle = endIdle - startIdle;
  const total = endTotal - startTotal;
  const perc = idle / total;

  return {
    cpuUsage: 1 - perc,
    uptime: Math.floor(_os.uptime()),
    memory: _os.totalmem(),
    freeMemory: _os.freemem(),
  };
};

export type ResourceUsage = Awaited<ReturnType<typeof getResourceUsage>>;

export const initiatieResourceUsageLoop = async (server: Bun.Server) => {
  const result = await getResourceUsage();

  server.publish("stdout", convertEventToMessage("resources", result));

  setTimeout(() => {
    initiatieResourceUsageLoop(server);
  }, 1000);
};
