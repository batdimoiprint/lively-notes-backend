const path = require("path");
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : ".env.local";
require("dotenv").config({ path: path.resolve(__dirname, "../", envFile) });

const serverless = require("serverless-http");
const { createServiceApp, registerErrorHandlers } = require("../shared/app-factory.js");

const app = createServiceApp();

// Import Routes
const settingsRouter = require("../routes/settings.routes.js");
const backgroundImageRouter = require("../routes/backgroundimage.routes.js");
const wakerRouter = require("../routes/waker.routes.js");

// Register Routes
app.use("/api/settings", settingsRouter);
app.use("/api/backgroundimage", backgroundImageRouter);
app.use("/api/wake", wakerRouter);

registerErrorHandlers(app);

const handler = serverless(app);

module.exports = { app, handler };
