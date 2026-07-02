// ⚠️ The pomodoro sound is an embedded binary blob on the user document and is
// EXPLICITLY OUT OF SCOPE for the DynamoDB migration — these calls are
// MongoDB-only regardless of READ_SOURCE (see user.repository.js).
const userRepository = require("../repositories/user.repository.js");
const { isValidId } = require("../repositories/repository.util.js");

async function getPomodoroSound(userId) {
  if (!isValidId(userId)) {
    return { notFound: true, sound: null };
  }
  return userRepository.getPomodoroSound(userId);
}

async function upsertPomodoroSound(userId, file) {
  if (!isValidId(userId)) {
    return { notFound: true };
  }

  const sound = {
    data: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname,
    size: file.size,
    updatedAt: new Date(),
  };

  const result = await userRepository.setPomodoroSound(userId, sound);
  if (result.notFound) {
    return { notFound: true };
  }

  return { notFound: false, sound };
}

async function deletePomodoroSound(userId) {
  if (!isValidId(userId)) {
    return { notFound: true };
  }
  return userRepository.setPomodoroSound(userId, null);
}

module.exports = {
  getPomodoroSound,
  upsertPomodoroSound,
  deletePomodoroSound,
};
