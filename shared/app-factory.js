const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

function createServiceApp() {
  const app = express();

  // Enable trust proxy for AWS API Gateway / CloudFront X-Forwarded-For headers
  app.set("trust proxy", 1);

  // Universal CORS for Serverless, Preflight OPTIONS, and Multi-Origin (Wallpaper Engine, Vercel, Local)
  app.use((req, res, next) => {
    // Normalize trailing slashes (e.g., /api/notes/ -> /api/notes)
    if (req.url && req.path && req.path.length > 1 && req.path.endsWith("/")) {
      const query = req.url.slice(req.path.length);
      req.url = req.path.slice(0, -1) + query;
    }

    if (!res.getHeader("Access-Control-Allow-Origin")) {
      const origin = req.headers.origin || "*";
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Sync, sync, Cookie, x-sync, authorization, content-type");
    }

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
      validate: { xForwardedForHeader: false },
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
