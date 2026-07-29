const client = require("../db/db.js");
const myDB = client.db("livelydesktopnotes");
const syncCollection = myDB.collection("sync_state");

const connectionsByUserId = new Map();
let memoryLastEventTimestamp = Date.now();
let memoryLastEvent = null;

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

async function broadcastSyncEvent(userId, { domain, action, id }) {
  const now = Date.now();
  const event = {
    domain,
    action,
    id: id ? String(id) : null,
    timestamp: now,
  };

  memoryLastEventTimestamp = now;
  memoryLastEvent = event;

  // Persist to MongoDB synchronously before Lambda freezes event loop
  try {
    await syncCollection.updateOne(
      { _id: "global_sync_state" },
      { $set: { lastEventTimestamp: now, lastEvent: event } },
      { upsert: true }
    );
  } catch (err) {
    console.error("Failed to persist sync state to MongoDB:", err);
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

async function getSyncStatus() {
  try {
    const doc = await syncCollection.findOne({ _id: "global_sync_state" });
    if (doc && doc.lastEventTimestamp) {
      return {
        lastEventTimestamp: Math.max(memoryLastEventTimestamp, doc.lastEventTimestamp),
        lastEvent: doc.lastEvent || memoryLastEvent,
      };
    }
  } catch (err) {
    // Fallback to in-memory status
  }
  return {
    lastEventTimestamp: memoryLastEventTimestamp,
    lastEvent: memoryLastEvent,
  };
}

module.exports = {
  registerSyncStream,
  broadcastSyncEvent,
  getSyncStatus,
};
