// Imports
require("dotenv").config();
const express = require("express");
const app = express();

// CORS
const cors = require("cors");
const options = require("./config/corsConfig");
app.use(cors(options));
// Ports
const port = process.env.PORT || 3000;

// Express Json
app.use(express.json());

// Notes Routes
const notesRouter = require("./routes/notesRoutes");
app.use("/api/notes", notesRouter);

// Cloudinary Images Routes
const cloudinaryRouter = require("./routes/cloudinaryRoutes");
app.use("/api/images", cloudinaryRouter);

// EntryPoint
app.get("/", (req, res) => {
  res.send("Bakit ka andito");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
