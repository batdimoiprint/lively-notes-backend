// Imports
require("dotenv").config();
const express = require("express");
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('./config/swagger.config.js');

// Define App
const app = express();

// CORS
const cors = require("cors");
const options = require("./config/cors.config.js");
app.use(cors(options));
// Ports
const port = process.env.PORT || 3000;

// Express Json
app.use(express.json());

// Backend Waker
app.get("/api/wake", (req, res) => {
  res.status(200).send();
})

// Auth Route
const authRouter = require("./routes/auth.routes.js")
app.use("/api/auth", authRouter)

// Notes Routes
const notesRouter = require("./routes/notes.routes.js");
app.use("/api/notes", notesRouter);

// Cloudinary Images Routes
const cloudinaryRouter = require("./routes/cloudinary.routes.js");
app.use("/api/images", cloudinaryRouter);

// App Settings Routes
const settingsRouter = require("./routes/settings.routes.js");
app.use("/api/settings", settingsRouter);

// TODO: Add JWT Token Generation and Protect All Routes with JWT 

// Swagger
const swaggerSpec = swaggerJsdoc(swaggerConfig.options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
