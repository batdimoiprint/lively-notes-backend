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
  if (req.url && req.url.includes("sync")) {
    return res.status(200).json({
      debug: true,
      url: req.url,
      originalUrl: req.originalUrl,
      query: req.query,
      headers: req.headers,
      apiGateway: req.apiGateway ? {
        path: req.apiGateway.event?.path,
        queryStringParameters: req.apiGateway.event?.queryStringParameters,
        rawQueryString: req.apiGateway.event?.rawQueryString
      } : null
    });
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
