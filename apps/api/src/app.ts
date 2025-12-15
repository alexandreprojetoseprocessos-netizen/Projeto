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
import { templatesRouter } from "./routes/templates";
import { organizationsRouter } from "./routes/organizations";
import { logger } from "./config/logger";
import { subscriptionsRouter } from "./routes/subscriptions";
import teamRouter from "./routes/team";
import { serviceCatalogRouter } from "./routes/serviceCatalog";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed = config.frontendUrl
          ? origin === config.frontendUrl
          : /localhost:5173$|127\.0\.0\.1:5173$/.test(origin);
        if (allowed) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    })
  );
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
  app.use("/templates", templatesRouter);
  app.use("/me", meRouter);
  app.use("/organizations", organizationsRouter);
  app.use("/subscriptions", subscriptionsRouter);
  app.use("/organizations", teamRouter);
  app.use("/service-catalog", serviceCatalogRouter);

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
