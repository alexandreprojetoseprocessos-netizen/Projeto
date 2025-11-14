import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

const rootEnvPath = path.resolve(__dirname, "../../../../.env");
dotenv.config({ path: rootEnvPath });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.string().default("4000"),
  SUPABASE_URL: z.string(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_DB_HOST: z.string(),
  SUPABASE_DB_PORT: z.string().default("5432"),
  SUPABASE_DB_NAME: z.string(),
  SUPABASE_DB_USER: z.string(),
  SUPABASE_DB_PASSWORD: z.string(),
  JWT_SECRET: z.string(),
  WEBHOOK_SECRET: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: Number(parsed.data.API_PORT),
  supabase: {
    url: parsed.data.SUPABASE_URL,
    anonKey: parsed.data.SUPABASE_ANON_KEY,
    serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    db: {
      host: parsed.data.SUPABASE_DB_HOST,
      port: Number(parsed.data.SUPABASE_DB_PORT),
      name: parsed.data.SUPABASE_DB_NAME,
      user: parsed.data.SUPABASE_DB_USER,
      password: parsed.data.SUPABASE_DB_PASSWORD
    }
  },
  jwtSecret: parsed.data.JWT_SECRET,
  webhookSecret: parsed.data.WEBHOOK_SECRET,
  github: {
    appId: parsed.data.GITHUB_APP_ID,
    clientId: parsed.data.GITHUB_CLIENT_ID,
    clientSecret: parsed.data.GITHUB_CLIENT_SECRET,
    webhookSecret: parsed.data.GITHUB_WEBHOOK_SECRET
  },
  integrations: {
    slackWebhookUrl: parsed.data.SLACK_WEBHOOK_URL
  }
};
