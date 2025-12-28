const settingsService = require("../service/settingsService");

async function getSettings(req, res, next) {
  try {
    const settings = await settingsService.getSettings();

    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
}

async function resetSettings(req, res, next) {
  try {
    const reset = await settingsService.resetSettingsPost(req.body);
    res.status(205).json(reset);
  } catch (error) {
    next(error);
  }
}

async function patchSettings(req, res, next) {
  try {
    const patch = await settingsService.patchSettings(req.body);
    // console.log(req.body);
    res.status(204).json(patch);
  } catch (error) {
    next(error);
  }
}

module.exports = { getSettings, resetSettings, patchSettings };
