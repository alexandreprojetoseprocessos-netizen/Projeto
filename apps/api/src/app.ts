import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env";
import { healthRouter } from "./routes/health";
import { projectsRouter } from "./routes/projects";
import { wbsRouter } from "./routes/wbs";
import { reportsRouter } from "./routes/reports";
import { integrationsRouter } from "./routes/integrations";
import { meRouter } from "./routes/me";
import { templatesRouter } from "./routes/templates";
import { organizationsRouter } from "./routes/organizations";
import { logger } from "./config/logger";
import { subscriptionsRouter } from "./routes/subscriptions";
import { authRouter } from "./routes/auth";
import { invitesRouter } from "./routes/invites";
import { billingRouter } from "./routes/billing";
import { paymentsRouter } from "./routes/payments";
import { webhooksRouter } from "./routes/webhooks";
import teamRouter from "./routes/team";
import { serviceCatalogRouter } from "./routes/serviceCatalog";

export const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet());
  const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, "").toLowerCase();
  const allowedOrigins = new Set(
    [
      process.env.FRONTEND_URL,
      config.frontendUrl,
      "http://localhost:5173",
      "http://localhost:3000",
      "https://app.meugp.com.br"
    ]
      .filter((origin): origin is string => Boolean(origin))
      .map(normalizeOrigin)
  );
  const vercelPreviewRegex = /^https:\/\/.*\.vercel\.app$/i;
  const meugpRegex = /^https:\/\/([a-z0-9-]+\.)*meugp\.com\.br$/i;
  const isOriginAllowed = (origin?: string | null) => {
    if (!origin) return true;
    const normalized = normalizeOrigin(origin);
    return allowedOrigins.has(normalized) || vercelPreviewRegex.test(origin) || meugpRegex.test(origin);
  };

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type", "X-Organization-Id"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(
    express.json({
      limit: "10mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      }
    })
  );
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(morgan("dev"));

  app.use("/health", healthRouter);
  app.use("/auth", authRouter);
  app.use("/projects", projectsRouter);
  app.use("/wbs", wbsRouter);
  app.use("/reports", reportsRouter);
  app.use("/integrations", integrationsRouter);
  app.use("/templates", templatesRouter);
  app.use("/me", meRouter);
  app.use("/organizations", organizationsRouter);
  app.use("/subscriptions", subscriptionsRouter);
  app.use("/billing", billingRouter);
  app.use("/payments", paymentsRouter);
  app.use("/webhooks", webhooksRouter);
  app.use("/", invitesRouter);
  app.use("/organizations", teamRouter);
  app.use("/service-catalog", serviceCatalogRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const statusCode =
      (err as any)?.status ??
      (err as any)?.statusCode ??
      500;
    logger.error({ err, status: statusCode, stack: err.stack }, "Unhandled error");
    return res.status(statusCode).json({ message: "Internal server error" });
  });

  app.get("/", (_req, res) => {
    res.json({
      name: "Gestão de Projetos API",
      version: "0.1.0",
      environment: config.env
    });
  });

  return app;
};
