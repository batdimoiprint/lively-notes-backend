const connectionsByUserId = new Map();
const eventHistoryByUserId = new Map();
const MAX_HISTORY = 50;

function getUserConnections(userId) {
  if (!connectionsByUserId.has(userId)) {
    connectionsByUserId.set(userId, new Set());
  }
  return connectionsByUserId.get(userId);
}

function writeSseEvent(res, eventName, data) {
  if (eventName) {
    res.write(`event: ${eventName}\n`);
  }
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function registerSyncStream(userId, res) {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-store, no-cache, no-transform, must-revalidate");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  res.write(": connected\n\n");

  const userConnections = getUserConnections(userId);
  userConnections.add(res);

  // Send initial ping
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": ping\n\n");
    }
  }, 15000);

  const cleanup = () => {
    clearInterval(heartbeat);
    userConnections.delete(res);
    if (userConnections.size === 0) {
      connectionsByUserId.delete(userId);
    }
  };

  res.on("close", cleanup);
  res.on("finish", cleanup);

  return cleanup;
}

function broadcastSyncEvent(userId, { domain, action, id }) {
  const event = {
    domain,
    action,
    id: id ? String(id) : null,
    timestamp: Date.now(),
  };

  // Record history
  if (!eventHistoryByUserId.has(userId)) {
    eventHistoryByUserId.set(userId, []);
  }
  const history = eventHistoryByUserId.get(userId);
  history.push(event);
  if (history.length > MAX_HISTORY) {
    history.shift();
  }

  const userConnections = connectionsByUserId.get(userId);
  if (!userConnections || userConnections.size === 0) {
    return false;
  }

  for (const res of userConnections) {
    if (!res.writableEnded) {
      writeSseEvent(res, "sync", event);
    }
  }

  return true;
}

module.exports = {
  registerSyncStream,
  broadcastSyncEvent,
};
