const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const corsOptions = require("../config/cors.config.js");

function createServiceApp() {
  const app = express();
  app.use(helmet());

  if (process.env.NODE_ENV !== "development") {
    const limiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests. Try again later." }
    });
    app.use(limiter);
  }

  app.use(express.json({ limit: "10kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());

  return app;
}

function registerErrorHandlers(app) {
  // Error Handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error"
    });
  });

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
}

module.exports = { createServiceApp, registerErrorHandlers };
