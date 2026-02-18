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

// Register Routes
registerRoutes(app);

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
