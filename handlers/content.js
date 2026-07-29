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
const notesRouter = require("../routes/notes.routes.js");
const sectionsRouter = require("../routes/sections.routes.js");

const syncService = require("../service/sync.service");

// Global Sync Realtime Interceptor (bypasses express router matching quirks)
app.use(async (req, res, next) => {
  const fullUrl = req.originalUrl || req.url || "";
  const isSyncStatus = fullUrl.includes("sync=status") || fullUrl.includes("sync-status");
  const isSyncEvents = fullUrl.includes("sync=events") || fullUrl.includes("sync-events");

  if (isSyncStatus) {
    const status = await syncService.getSyncStatus();
    return res.status(200).json(status);
  }
  if (isSyncEvents) {
    const userId = req.user?.userId || req.user?.id || "global_user";
    return syncService.registerSyncStream(userId, res);
  }
  next();
});

// Register Routes
app.use(authJWT);
app.use(["/api/notes", "/notes"], notesRouter);
app.use(["/api/sections", "/sections"], sectionsRouter);
app.use(notesRouter);
app.use(sectionsRouter);

registerErrorHandlers(app);

const handler = serverless(app);

module.exports = { app, handler };
