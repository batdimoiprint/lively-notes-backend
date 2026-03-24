const multer = require("multer");

// Keep upload in memory so we can stream straight to Cloudinary.
const storage = multer.memoryStorage();

const allowedMimePrefixes = ["image/", "audio/"];

const uploadFileFilter = (req, file, cb) => {
  if (
    file &&
    file.mimetype &&
    allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix))
  ) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image and audio files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter: uploadFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;
