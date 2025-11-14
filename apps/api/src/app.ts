import cors from "cors";
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
import { logger } from "./config/logger";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(
    express.json({
      limit: "1mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      }
    })
  );
  app.use(morgan("dev"));

  app.use("/health", healthRouter);
  app.use("/projects", projectsRouter);
  app.use("/wbs", wbsRouter);
  app.use("/reports", reportsRouter);
  app.use("/integrations", integrationsRouter);
  app.use("/me", meRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(err, "Unhandled error");
    return res.status(500).json({ message: "Internal server error" });
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
