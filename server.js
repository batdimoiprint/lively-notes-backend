// Imports
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : ".env.local";
require("dotenv").config({ path: envFile });
const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerConfig = require("./config/swagger.config.js");
const registerRoutes = require("./routes/index.js");
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');


// Define App
const app = express();

// Global Sync Realtime Interceptor (bypasses Express router matching & Lambda stage quirks)
const syncService = require("./service/sync.service.js");
app.use(
  ["/api/notes", "/notes", "/api/todos", "/todos", "/api/sections", "/sections", "/"],
  (req, res, next) => {
    let syncH = null;
    if (req.headers) {
      for (const k of Object.keys(req.headers)) {
        if (k.toLowerCase() === "x-sync" || k.toLowerCase() === "sync") {
          syncH = req.headers[k];
          break;
        }
      }
    }
    if (!syncH && req.apiGateway?.event?.headers) {
      for (const k of Object.keys(req.apiGateway.event.headers)) {
        if (k.toLowerCase() === "x-sync" || k.toLowerCase() === "sync") {
          syncH = req.apiGateway.event.headers[k];
          break;
        }
      }
    }

    if (syncH === "status" || req.query?.sync === "status") {
      return res.status(200).json(syncService.getSyncStatus());
    }
    if (syncH === "events" || req.query?.sync === "events") {
      const userId = req.user?.userId || req.user?.id || "global_user";
      return syncService.registerSyncStream(userId, res);
    }
    next();
  }
);

// Helmet
app.use(helmet())

// Rate Limiter
if (process.env.NODE_ENV !== "development") {
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    standardHeaders: true,    
    legacyHeaders: false,
    message: { error: 'Too many requests. Try again later.' }
  })
  app.use(limiter)
}

// Body Size Limit
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Morgan Logger
if (process.env.NODE_ENV == "development") {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}


// CORS
const cors = require("cors");
const options = require("./config/cors.config.js");
app.use(cors(options));

// Cookies Parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Express Json
app.use(express.json());

const { authJWT } = require("./middleware/jwt.config.js");

app.get("/sync-status", (req, res) => {
  res.status(200).json(syncService.getSyncStatus());
});
app.get("/notes/sync-status", (req, res) => {
  res.status(200).json(syncService.getSyncStatus());
});
app.get("/api/notes/sync-status", (req, res) => {
  res.status(200).json(syncService.getSyncStatus());
});
app.get("/todos/sync-status", (req, res) => {
  res.status(200).json(syncService.getSyncStatus());
});
app.get("/api/todos/sync-status", (req, res) => {
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
app.get("/todos/sync-events", authJWT, (req, res) => {
  const userId = req.user?.userId || req.user?.id || "global_user";
  syncService.registerSyncStream(userId, res);
});
app.get("/api/todos/sync-events", authJWT, (req, res) => {
  const userId = req.user?.userId || req.user?.id || "global_user";
  syncService.registerSyncStream(userId, res);
});

// Register Routes
registerRoutes(app);

// Swagger
const swaggerSpec = swaggerJsdoc(swaggerConfig.options);
if (process.env.NODE_ENV === "development") {
  app.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      requestInterceptor: (request) => {
        request.credentials = "include";
        return request;
      },
    }),
  );
}

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
})

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    reqPath: req.path,
    reqUrl: req.url,
    reqOriginalUrl: req.originalUrl
  });
});


// Ports
const port = process.env.PORT || 3000;

if (require.main === module) {
  // Start the reminder scheduler for push notifications
  const { startScheduler } = require("./service/reminderScheduler.js");
  startScheduler();

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}

module.exports = app;


