import { z } from "zod";

const envSchema = z.object({
  CS2_PATH: z.string(),
  STEAMCMD_PATH: z.string(),
  CS2_SERVER_ARGS: z.string().optional(),
  DEMO_UPLOAD_AUTHORIZATION: z.string(),
  ACCESS_KEY: z.string(),
  DEMO_UPLOAD_API: z.string(),
});

const env = envSchema.parse(process.env);

export { env };
