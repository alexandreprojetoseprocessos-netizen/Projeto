import { createApp } from "./app";
import { config } from "./config/env";
import { logger } from "./config/logger";

const app = createApp();

app.listen(config.port, "0.0.0.0", () => {
  logger.info(
    {
      env: config.env,
      port: config.port,
      frontendUrl: config.frontendUrl ?? null
    },
    "API running"
  );
});
