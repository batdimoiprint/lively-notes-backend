const connectionsByUserId = new Map();
const eventHistory = [];
const MAX_HISTORY = 50;
let lastEventTimestamp = Date.now();
let lastEvent = null;

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

  // Send periodic ping heartbeat every 15s to prevent cloud idle timeouts
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
  const now = Date.now();
  const event = {
    domain,
    action,
    id: id ? String(id) : null,
    timestamp: now,
  };

  lastEventTimestamp = now;
  lastEvent = event;

  // Record history
  eventHistory.push(event);
  if (eventHistory.length > MAX_HISTORY) {
    eventHistory.shift();
  }

  let broadcastedCount = 0;
  for (const [, userConnections] of connectionsByUserId.entries()) {
    for (const res of userConnections) {
      if (!res.writableEnded) {
        writeSseEvent(res, "sync", event);
        broadcastedCount++;
      }
    }
  }

  return broadcastedCount > 0;
}

function getSyncStatus() {
  return {
    lastEventTimestamp,
    lastEvent,
  };
}

module.exports = {
  registerSyncStream,
  broadcastSyncEvent,
  getSyncStatus,
};
