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

// Register Sync Realtime Routes directly at app level
const syncService = require("./service/sync.service.js");
const { authJWT } = require("./middleware/jwt.config.js");

app.get(
  [
    "/api/notes/sync-events",
    "/notes/sync-events",
    "/api/todos/sync-events",
    "/todos/sync-events",
    "/api/sections/sync-events",
    "/sections/sync-events",
    "/api/calendar-notes/sync-events",
    "/calendar-notes/sync-events",
    "/api/sync/events",
    "/sync/events",
    "/sync-events",
  ],
  authJWT,
  (req, res) => {
    const userId = req.user?.userId || req.user?.id || "global_user";
    syncService.registerSyncStream(userId, res);
  }
);

app.get(
  [
    "/api/notes/sync-status",
    "/notes/sync-status",
    "/api/todos/sync-status",
    "/todos/sync-status",
    "/api/sections/sync-status",
    "/sections/sync-status",
    "/api/calendar-notes/sync-status",
    "/calendar-notes/sync-status",
    "/api/sync/status",
    "/sync/status",
    "/sync-status",
  ],
  (req, res) => {
    res.status(200).json(syncService.getSyncStatus());
  }
);

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
  res.status(404).json({ error: 'Route not found' })
})


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


