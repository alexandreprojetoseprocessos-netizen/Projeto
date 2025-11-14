import { type NextFunction, type Response } from "express";
import { createClient, type User } from "@supabase/supabase-js";
import { config } from "../config/env";
import { logger } from "../config/logger";
import type { RequestWithUser } from "../types/http";

const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey);

const mapSupabaseUser = (user: User | null) => {
  if (!user) {
    throw new Error("Supabase session inválida");
  }

  return {
    id: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.full_name as string | undefined) ?? user.email
  };
};

export const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  if (!supabaseAdmin) {
    logger.error("Supabase service role key is not configured");
    return res.status(500).json({ message: "Supabase auth not configured" });
  }

  const token = authorization.replace("Bearer", "").trim();
  if (!token) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error) {
      logger.warn({ err: error }, "Supabase auth validation failed");
      return res.status(401).json({ message: "Invalid Supabase session" });
    }

    req.user = mapSupabaseUser(data.user);
    return next();
  } catch (authError) {
    logger.error({ err: authError }, "Unexpected Supabase auth error");
    return res.status(401).json({ message: "Unable to validate session" });
  }
};
