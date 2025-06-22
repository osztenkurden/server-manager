import { z } from "zod";

const envSchema = z.object({
  CS2_PATH: z.string(),
  STEAMCMD_PATH: z.string(),
  CS2_SERVER_ARGS: z.string().optional(),
});

const env = envSchema.parse(process.env);

export { env };
