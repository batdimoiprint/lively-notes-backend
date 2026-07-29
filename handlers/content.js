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

// Register Sync Routes at app level before authJWT router
app.get("/sync-status", (req, res) => {
  res.status(200).json(syncService.getSyncStatus());
});
app.get("/notes/sync-status", (req, res) => {
  res.status(200).json(syncService.getSyncStatus());
});
app.get("/api/notes/sync-status", (req, res) => {
  res.status(200).json(syncService.getSyncStatus());
});

app.get("/sync-events", authJWT, (req, res) => {
  const userId = req.user?.userId || req.user?.id || "global_user";
  syncService.registerSyncStream(userId, res);
});
app.get("/notes/sync-events", authJWT, (req, res) => {
  const userId = req.user?.userId || req.user?.id || "global_user";
  syncService.registerSyncStream(userId, res);
});
app.get("/api/notes/sync-events", authJWT, (req, res) => {
  const userId = req.user?.userId || req.user?.id || "global_user";
  syncService.registerSyncStream(userId, res);
});

// Register Routes
app.use(["/api/notes", "/notes"], authJWT, notesRouter);
app.use(["/api/sections", "/sections"], authJWT, sectionsRouter);

registerErrorHandlers(app);

const handler = serverless(app);

module.exports = { app, handler };
