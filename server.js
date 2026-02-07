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
const { authJWT } = require("./middleware/jwt.config.js");

// Define App
const app = express();

// CORS
const cors = require("cors");
const options = require("./config/cors.config.js");
app.use(cors(options));

// Cookies Parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Express Json
app.use(express.json());

// Wake Route
const wakerRouter = require("./routes/waker.routes.js");
app.use("/api/wake", wakerRouter);

// Auth Route
const authRouter = require("./routes/auth.routes.js");
app.use("/api/auth", authRouter);

// Notes Routes
const notesRouter = require("./routes/notes.routes.js");
app.use("/api/notes", authJWT, notesRouter);

// Cloudinary Images Routes
const cloudinaryRouter = require("./routes/cloudinary.routes.js");
app.use("/api/images", authJWT, cloudinaryRouter);

// App Settings Routes
const settingsRouter = require("./routes/settings.routes.js");
app.use("/api/settings", authJWT, settingsRouter);

// Swagger
const swaggerSpec = swaggerJsdoc(swaggerConfig.options);
if (process.env.NODE_ENV === "development") {
  app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Ports
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
