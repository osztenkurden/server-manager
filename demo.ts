import path from "path";
import { env } from "./env";
import fs from "fs";

export const DEMO_PREFIX = `MATCH_`;
const DEMO_DIR = path.join(env.CS2_PATH, "./game/csgo");

export const getDemoList = async () => {
  const files = (await fs.promises.readdir(DEMO_DIR)).filter(
    (file) => file.startsWith(DEMO_PREFIX) && file.endsWith(".dem")
  );
  const filesWithDesc = await Promise.all(
    files.map(async (file) => {
      const stat = await fs.promises.stat(path.join(DEMO_DIR, file));
      return {
        file,
        updatedAt: stat.mtimeMs,
        createdAt: stat.ctimeMs,
      };
    })
  );

  return filesWithDesc;
};

export const uploadDemoFiles = async (fileName: string, playedAt: number) => {
  //   const matchTime = await getPlayedAtTimeFromFile(fileName);
  const file = Bun.file(path.join(DEMO_DIR, fileName));

  return fetch(env.DEMO_UPLOAD_API, {
    method: "POST",
    headers: {
      fileName,
      authorization: env.DEMO_UPLOAD_AUTHORIZATION,
      matchtime: `${playedAt}`,
    },
    body: file.stream(),
  });
};
