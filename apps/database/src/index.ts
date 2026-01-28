import path from "node:path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

const rootEnvPath = path.resolve(__dirname, "../../../.env");
dotenv.config({ path: rootEnvPath });
dotenv.config();

export const prisma = new PrismaClient();
