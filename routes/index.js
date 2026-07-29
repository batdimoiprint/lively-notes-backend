const { authJWT } = require("../middleware/jwt.config.js");

const registerRoutes = (app) => {
  // Wake Route
  const wakerRouter = require("./waker.routes.js");
  app.use(["/api/wake", "/wake"], wakerRouter);

  // Auth Route
  const authRouter = require("./auth.routes.js");
  app.use(["/api/auth", "/auth"], authRouter);

  // Notes Routes
  const notesRouter = require("./notes.routes.js");
  app.use(["/api/notes", "/notes"], authJWT, notesRouter);

  // Cloudinary Images Routes
  const cloudinaryRouter = require("./cloudinary.routes.js");
  app.use(["/api/images", "/images"], authJWT, cloudinaryRouter);

  // App Settings Routes
  const settingsRouter = require("./settings.routes.js");
  app.use(["/api/settings", "/settings"], settingsRouter);

  // Background Image Routes
  const backgroundImageRouter = require("./backgroundimage.routes.js");
  app.use(["/api/backgroundimage", "/backgroundimage"], backgroundImageRouter);

  // Apify Routes
  const apifyRouter = require("./apify.routes.js");
  app.use(["/api/apify", "/apify"], authJWT, apifyRouter);

  // IGPosts Routes
  const igpostRouter = require("./igpost.routes.js");
  app.use(["/api/igpost", "/igpost"], authJWT, igpostRouter);

  // Pomodoro Sound Routes
  const soundRouter = require("./sound.routes.js");
  app.use(["/api/sound", "/sound"], soundRouter);

  // Todos Routes
  const todosRouter = require("./todos.routes.js");
  app.use(["/api/todos", "/todos"], authJWT, todosRouter);

  // Sections Routes
  const sectionsRouter = require("./sections.routes.js");
  app.use(["/api/sections", "/sections"], authJWT, sectionsRouter);

  // Calendar Notes Routes
  const calendarNotesRouter = require("./calendarNotes.routes.js");
  app.use(["/api/calendar-notes", "/calendar-notes"], authJWT, calendarNotesRouter);

  // Push Notification Routes
  const pushRouter = require("./push.routes.js");
  app.use(["/api/push", "/push"], authJWT, pushRouter);

  // Sync Realtime SSE Routes
  const syncRouter = require("./sync.routes.js");
  app.use(["/api/sync", "/sync"], authJWT, syncRouter);
};

module.exports = registerRoutes;
