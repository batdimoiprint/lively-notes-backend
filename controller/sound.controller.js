const soundService = require("../service/sound.service");

function isAudioFile(file) {
  if (!file || !file.mimetype) {
    return false;
  }

  return file.mimetype.startsWith("audio/");
}

function sendSoundResponse(res, sound) {
  const soundBuffer = Buffer.isBuffer(sound.data)
    ? sound.data
    : Buffer.from(sound.data?.buffer || sound.data || []);

  res.setHeader("Content-Type", sound.mimeType || "application/octet-stream");
  res.setHeader("Content-Length", sound.size || soundBuffer.length);
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.status(200).send(soundBuffer);
}

async function getPomodoroSound(req, res) {
  try {
    const userId = req.user?.userId;
    const result = await soundService.getPomodoroSound(userId);

    if (result.notFound) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!result.sound) {
      return res.status(404).json({ message: "No pomodoro sound uploaded" });
    }

    return sendSoundResponse(res, result.sound);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function upsertPomodoroSound(req, res) {
  try {
    const userId = req.user?.userId;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "Sound file is required" });
    }

    if (!isAudioFile(req.file)) {
      return res.status(400).json({ message: "Only audio files are allowed" });
    }

    const result = await soundService.upsertPomodoroSound(userId, req.file);

    if (result.notFound) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Pomodoro sound saved",
      sound: {
        fileName: result.sound.fileName,
        mimeType: result.sound.mimeType,
        size: result.sound.size,
        updatedAt: result.sound.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function deletePomodoroSound(req, res) {
  try {
    const userId = req.user?.userId;
    const result = await soundService.deletePomodoroSound(userId);

    if (result.notFound) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Pomodoro sound deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getPomodoroSound,
  upsertPomodoroSound,
  deletePomodoroSound,
};