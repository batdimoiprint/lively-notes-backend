const { authJWT } = require("../middleware/jwt.config.js");

const registerRoutes = (app) => {
  // Wake Route
  const wakerRouter = require("./waker.routes.js");
  app.use("/api/wake", wakerRouter);

  // Auth Route
  const authRouter = require("./auth.routes.js");
  app.use("/api/auth", authRouter);

  // Notes Routes
  const notesRouter = require("./notes.routes.js");
  app.use("/api/notes", authJWT, notesRouter);

  // Cloudinary Images Routes
  const cloudinaryRouter = require("./cloudinary.routes.js");
  app.use("/api/images", authJWT, cloudinaryRouter);

  // App Settings Routes
  const settingsRouter = require("./settings.routes.js");
  app.use("/api/settings", settingsRouter);

  // Apify Routes
  const apifyRouter = require("./apify.routes.js");
  app.use("/api/apify", apifyRouter);
};

module.exports = registerRoutes;
