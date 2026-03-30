const connectionsByUserId = new Map();

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

function registerIgPostsStream(userId, res) {
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

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": ping\n\n");
    }
  }, 25000);

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

function emitIgPostsUpdated(userId, payload = {}) {
  const userConnections = connectionsByUserId.get(userId);

  if (!userConnections || userConnections.size === 0) {
    return false;
  }

  for (const res of userConnections) {
    if (!res.writableEnded) {
      writeSseEvent(res, "ig-posts-updated", payload);
    }
  }

  return true;
}

module.exports = {
  emitIgPostsUpdated,
  registerIgPostsStream,
};