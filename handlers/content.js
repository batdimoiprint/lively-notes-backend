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
app.use((req, res, next) => {
  let syncParam = null;
  const h = req.headers || {};
  const egH = req.apiGateway?.event?.headers || {};
  const q = req.query || {};
  const egQ = req.apiGateway?.event?.queryStringParameters || {};
  const egMQ = req.apiGateway?.event?.multiValueQueryStringParameters || {};

  for (const k in h) {
    if (k.toLowerCase() === "x-sync" || k.toLowerCase() === "sync") syncParam = h[k];
  }
  for (const k in egH) {
    if (k.toLowerCase() === "x-sync" || k.toLowerCase() === "sync") syncParam = egH[k];
  }
  if (!syncParam) {
    for (const k in q) {
      if (k.toLowerCase() === "sync") syncParam = q[k];
    }
  }
  if (!syncParam) {
    for (const k in egQ) {
      if (k.toLowerCase() === "sync") syncParam = egQ[k];
    }
  }
  if (!syncParam) {
    for (const k in egMQ) {
      if (k.toLowerCase() === "sync") syncParam = egMQ[k]?.[0];
    }
  }

  if (syncParam === "status") {
    return res.status(200).json(syncService.getSyncStatus());
  }
  if (syncParam === "events") {
    const userId = req.user?.userId || req.user?.id || "global_user";
    return syncService.registerSyncStream(userId, res);
  }
  next();
});

// Register Routes
app.use(authJWT);
app.use(notesRouter);
app.use(sectionsRouter);

registerErrorHandlers(app);

const handler = serverless(app);

module.exports = { app, handler };
