const settingsRepository = require("../repositories/settings.repository.js");

async function getSettings() {
  try {
    return await settingsRepository.getSettings();
  } catch (error) {
    throw new Error(error);
  }
}

async function resetSettingsPost(payload) {
  try {
    return await settingsRepository.resetSettings(payload);
  } catch (error) {
    throw new Error(error);
  }
}

async function patchSettings(payload) {
  try {
    return await settingsRepository.patchSettings(payload);
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  getSettings,
  resetSettingsPost,
  patchSettings,
};
