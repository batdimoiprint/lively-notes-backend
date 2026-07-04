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
const { refreshAllUsers } = require("../service/apifyService.js");

const app = createServiceApp();

// Import Routes
const igpostRouter = require("../routes/igpost.routes.js");
const apifyRouter = require("../routes/apify.routes.js");
const cloudinaryRouter = require("../routes/cloudinary.routes.js");

// Register Routes
app.use("/api/igpost", authJWT, igpostRouter);
app.use("/api/apify", authJWT, apifyRouter);
app.use("/api/images", authJWT, cloudinaryRouter);

registerErrorHandlers(app);

const serverlessHandler = serverless(app);

const handler = async (event, context) => {
  // EventBridge cron trigger for Instagram refresh
  if (event && event.source === "aws.events") {
    console.log("Instagram Refresh Cron triggered at", new Date().toISOString());
    await refreshAllUsers();
    return { statusCode: 200 };
  }

  return serverlessHandler(event, context);
};

module.exports = { app, handler };
