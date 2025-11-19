import path from "path";
import { env } from "./env";
import fs from "fs";
import { convertEventToMessage } from "simple-websockets";

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

export const uploadDemoFiles = (
  fileName: string,
  playedAt: number,
  server: Bun.Server
) => {
  if (!env.DEMO_UPLOAD_API || !env.DEMO_UPLOAD_AUTHORIZATION) return null;
  //   const matchTime = await getPlayedAtTimeFromFile(fileName);
  const uploadId = Bun.randomUUIDv7();

  const file = Bun.file(path.join(DEMO_DIR, fileName));

  const totalBytes = file.size;
  let bytesUploaded = 0;
  const start = Date.now();

  fetch(env.DEMO_UPLOAD_API, {
    method: "POST",
    headers: {
      fileName,
      authorization: env.DEMO_UPLOAD_AUTHORIZATION,
      matchtime: `${playedAt}`,
    },
    body: file.stream().pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          controller.enqueue(chunk);
          bytesUploaded += chunk.byteLength;
          server.publish(
            "demoUploadProgress",
            convertEventToMessage("demoUploadProgress", {
              uploadId,
              bytesUploaded,
              totalBytes,
              finished: false,
            })
          );
        },
        flush(_controller) {},
      })
    ),
  }).then((response) => {
    server.publish(
      "demoUploadProgress",
      convertEventToMessage("demoUploadProgress", {
        uploadId,
        bytesUploaded,
        totalBytes,
        finished: true,
      })
    );
  });
  return uploadId;
};

export const deleteDemoFiles = async (fileName: string) => {
  //   const matchTime = await getPlayedAtTimeFromFile(fileName);
  const files = (await fs.promises.readdir(DEMO_DIR)).filter(
    (file) => file.startsWith(DEMO_PREFIX) && file.endsWith(".dem")
  );
  if (!files.includes(fileName)) {
    return false;
  }
  await Bun.file(path.join(DEMO_DIR, fileName)).delete();
  return true;
};
