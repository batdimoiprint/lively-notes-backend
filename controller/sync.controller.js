const syncService = require("../service/sync.service");

function connectSyncStream(req, res, next) {
  try {
    const userId = req.user?.userId || req.user?.id || "global_user";
    syncService.registerSyncStream(userId, res);
  } catch (err) {
    next(err);
  }
}

function getSyncStatus(req, res, next) {
  try {
    const status = syncService.getSyncStatus();
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  connectSyncStream,
  getSyncStatus,
};
