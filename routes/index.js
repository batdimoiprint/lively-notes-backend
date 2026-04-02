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

  // Background Image Routes
  const backgroundImageRouter = require("./backgroundimage.routes.js");
  app.use("/api/backgroundimage", backgroundImageRouter);

  // Apify Routes
  const apifyRouter = require("./apify.routes.js");
  app.use("/api/apify", authJWT, apifyRouter);

  // IGPosts Routes
  const igpostRouter = require("./igpost.routes.js");
  app.use("/api/igpost", authJWT, igpostRouter);

  // Pomodoro Sound Routes
  const soundRouter = require("./sound.routes.js");
  app.use("/api/sound", soundRouter);

  // Todos Routes
  const todosRouter = require("./todos.routes.js");
  app.use("/api/todos", authJWT, todosRouter);


};

module.exports = registerRoutes;
