import { createApp } from "./app";
import { config } from "./config/env";
import { logger } from "./config/logger";

const app = createApp();

app.listen(config.port, () => {
  logger.info(`API running on port ${config.port}`);
});
