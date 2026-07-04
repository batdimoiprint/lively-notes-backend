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
const { authJWT } = require("../middleware/jwt.config.js");

const app = createServiceApp();

// Import Routes
const calendarNotesRouter = require("../routes/calendarNotes.routes.js");
const pushRouter = require("../routes/push.routes.js");

// Register Routes
app.use("/api/calendar-notes", authJWT, calendarNotesRouter);
app.use("/api/push", authJWT, pushRouter);

registerErrorHandlers(app);

const handler = serverless(app);

module.exports = { app, handler };
