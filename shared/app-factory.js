const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

function createServiceApp() {
  const app = express();

  // Bulletproof Universal CORS for Serverless, Preflight OPTIONS, and Multi-Origin (Wallpaper Engine, Vercel, Local)
  app.use((req, res, next) => {
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Sync, sync, Cookie, x-sync");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  if (process.env.NODE_ENV !== "development") {
    const limiter = rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 200,
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

  app.use(cookieParser());

  return app;
}

function registerErrorHandlers(app) {
  // Error Handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error"
    });
  });

  // 404 Handler
  app.use((req, res) => {
    const origin = req.headers.origin || "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.status(404).json({
      error: "Route not found",
      reqPath: req.path,
      reqUrl: req.url,
      reqOriginalUrl: req.originalUrl
    });
  });
}

module.exports = { createServiceApp, registerErrorHandlers };
