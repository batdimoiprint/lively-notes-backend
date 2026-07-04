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
const authRouter = require("../routes/auth.routes.js");
const soundRouter = require("../routes/sound.routes.js");

// Register Routes
app.use("/api/auth", authRouter);
app.use("/api/sound", soundRouter);

registerErrorHandlers(app);

const handler = serverless(app);

module.exports = { app, handler };
