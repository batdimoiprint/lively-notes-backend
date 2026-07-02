/**
 * One-off (but idempotent, re-runnable) backfill of historical MongoDB data
 * into the DynamoDB tables. Safe to re-run: every write is a Put keyed by the
 * shared id, so re-running just overwrites items with fresh Mongo state —
 * which also makes this the reconciliation tool for dual-write drift.
 *
 * Id convention: historical records use their Mongo ObjectId hex string as
 * the DynamoDB id (String(_id)); records created after the dual-write code
 * shipped already share a UUID across both stores. MongoDB is never modified.
 *
 * ⚠️ user.pomodoroSound (embedded binary blob) is intentionally NOT copied —
 * it stays MongoDB-only until it gets a separate resolution.
 *
 * Usage: node scripts/migrate-to-dynamo.js [--dry-run]
 */
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : ".env.local";
require("dotenv").config({ path: envFile, quiet: true });

const mongoClient = require("../db/db.js");
const { BatchWriteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLES } = require("../db/dynamo.js");

const DRY_RUN = process.argv.includes("--dry-run");
const myDB = mongoClient.db("livelydesktopnotes");

function toIso(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

// Historical docs may predate createdAt; the ObjectId embeds the insertion
// timestamp, which is exactly what sort({_id:-1})-as-latest relied on.
function createdAtOf(doc) {
  if (doc.createdAt) return toIso(doc.createdAt);
  if (doc._id && typeof doc._id.getTimestamp === "function") {
    return doc._id.getTimestamp().toISOString();
  }
  return new Date(0).toISOString();
}

async function batchPut(tableName, items) {
  if (DRY_RUN) {
    console.log(`  [dry-run] would write ${items.length} items to ${tableName}`);
    return;
  }
  for (let i = 0; i < items.length; i += 25) {
    let requests = items
      .slice(i, i + 25)
      .map((Item) => ({ PutRequest: { Item } }));

    while (requests.length > 0) {
      const { UnprocessedItems } = await docClient.send(
        new BatchWriteCommand({ RequestItems: { [tableName]: requests } })
      );
      requests = UnprocessedItems?.[tableName] || [];
      if (requests.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
}

async function migrateNotes() {
  const docs = await myDB.collection("notes").find({}).toArray();
  const items = docs.map((doc) => ({
    id: String(doc._id),
    title: doc.title,
    body: doc.body,
    sectionId: doc.sectionId || "default",
    // order is the GSI sort key; docs missing it would be invisible to
    // getBySection, so mirror the "new notes sort first" convention.
    order: doc.order ?? -1,
    createdAt: createdAtOf(doc),
  }));
  await batchPut(TABLES.notes, items);
  return { collection: "notes", table: TABLES.notes, count: items.length };
}

async function migrateSections() {
  const docs = await myDB.collection("sections").find({}).toArray();
  // noteCount is a maintained counter in DynamoDB; seed it from the
  // authoritative Mongo note counts at backfill time.
  const counts = await myDB
    .collection("notes")
    .aggregate([{ $group: { _id: "$sectionId", n: { $sum: 1 } } }])
    .toArray();
  const countBySection = new Map(counts.map((row) => [row._id, row.n]));

  const items = docs.map((doc) => ({
    id: String(doc._id),
    title: doc.title,
    order: doc.order ?? 0,
    createdAt: createdAtOf(doc),
    noteCount: countBySection.get(String(doc._id)) || 0,
  }));
  await batchPut(TABLES.sections, items);
  return { collection: "sections", table: TABLES.sections, count: items.length };
}

async function migrateTodos() {
  const docs = await myDB.collection("todos").find({}).toArray();
  const items = docs.map((doc) => ({
    id: String(doc._id),
    text: doc.text,
    completed: !!doc.completed,
    createdAt: createdAtOf(doc),
  }));
  await batchPut(TABLES.todos, items);
  return { collection: "todos", table: TABLES.todos, count: items.length };
}

async function migrateCalendarNotes() {
  const docs = await myDB.collection("calendarNotes").find({}).toArray();
  const items = docs.map((doc) => {
    const createdAt = createdAtOf(doc);
    const item = {
      id: String(doc._id),
      title: doc.title,
      body: doc.body,
      date: doc.date,
      reminderAt: toIso(doc.reminderAt),
      reminderInterval: doc.reminderInterval || "once",
      reminderSent: !!doc.reminderSent,
      isWholeDay: !!doc.isWholeDay,
      createdAt,
      monthKey: String(doc.date).slice(0, 7),
      dateCreatedAt: `${doc.date}#${createdAt}`,
    };
    if (doc.reminderAt && !doc.reminderSent) {
      item.pendingPk = "PENDING";
      item.pendingReminderAt = toIso(doc.reminderAt);
    }
    return item;
  });
  await batchPut(TABLES.calendarNotes, items);
  return {
    collection: "calendarNotes",
    table: TABLES.calendarNotes,
    count: items.length,
  };
}

async function migrateSettings() {
  const docs = await myDB.collection("settings").find({}).toArray();
  const items = docs.slice(0, 1).map((doc) => {
    const { _id, ...rest } = doc;
    return { id: "SETTINGS", ...rest };
  });
  if (docs.length > 1) {
    console.warn(
      `  settings has ${docs.length} docs; only the first maps to the single SETTINGS item`
    );
  }
  await batchPut(TABLES.settings, items);
  return { collection: "settings", table: TABLES.settings, count: items.length };
}

async function migratePushSubscriptions() {
  const docs = await myDB.collection("pushSubscriptions").find({}).toArray();
  const items = docs
    .filter((doc) => typeof doc.endpoint === "string" && doc.endpoint)
    .map((doc) => {
      const { _id, updatedAt, ...rest } = doc;
      return { ...rest, updatedAt: toIso(updatedAt) || createdAtOf(doc) };
    });
  await batchPut(TABLES.pushSubscriptions, items);
  return {
    collection: "pushSubscriptions",
    table: TABLES.pushSubscriptions,
    count: items.length,
  };
}

async function migrateIgPosts() {
  const docs = await myDB.collection("ig_posts").find({}).toArray();
  // url is the DynamoDB PK; drop docs without one and dedupe (newest wins,
  // matching the app's update-by-url behavior).
  const byUrl = new Map();
  let skipped = 0;
  for (const doc of docs) {
    const url = typeof doc.url === "string" ? doc.url.trim() : "";
    if (!url) {
      skipped += 1;
      continue;
    }
    byUrl.set(url, doc);
  }
  if (skipped > 0) {
    console.warn(`  ig_posts: skipped ${skipped} docs without a url`);
  }
  if (byUrl.size !== docs.length - skipped) {
    console.warn(
      `  ig_posts: deduped ${docs.length - skipped - byUrl.size} duplicate urls`
    );
  }

  const items = Array.from(byUrl.values()).map((doc) => {
    const { _id, createdAt, ...rest } = doc;
    const item = {
      ...rest,
      url: doc.url.trim(),
      id: String(_id),
      createdAt: createdAtOf(doc),
    };
    // ownerUsername is the GSI partition key; null isn't a legal key value.
    // Omitting it keeps the item out of the index — same visibility as a
    // Mongo find({ownerUsername: <name>}) that never matches null.
    if (typeof item.ownerUsername !== "string" || !item.ownerUsername.trim()) {
      delete item.ownerUsername;
    }
    return item;
  });
  await batchPut(TABLES.igPosts, items);
  return { collection: "ig_posts", table: TABLES.igPosts, count: items.length };
}

async function migrateUsers() {
  const docs = await myDB.collection("user").find({}).toArray();
  const items = docs.map((doc) => ({
    id: String(doc._id),
    code: doc.code,
    igUsernames: doc.igUsernames || [],
    // pomodoroSound deliberately omitted (MongoDB-only, out of scope).
  }));
  await batchPut(TABLES.user, items);
  return { collection: "user", table: TABLES.user, count: items.length };
}

async function tableCount(tableName) {
  let count = 0;
  let ExclusiveStartKey;
  do {
    const page = await docClient.send(
      new ScanCommand({ TableName: tableName, Select: "COUNT", ExclusiveStartKey })
    );
    count += page.Count;
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return count;
}

(async () => {
  console.log(
    `Backfill Mongo -> DynamoDB${DRY_RUN ? " (dry run)" : ""} using ${envFile}`
  );

  const results = [];
  results.push(await migrateNotes());
  results.push(await migrateSections());
  results.push(await migrateTodos());
  results.push(await migrateCalendarNotes());
  results.push(await migrateSettings());
  results.push(await migratePushSubscriptions());
  results.push(await migrateIgPosts());
  results.push(await migrateUsers());

  console.log("\nCounts (Mongo -> written -> Dynamo table):");
  let mismatches = 0;
  for (const { collection, table, count } of results) {
    const mongoCount = await myDB.collection(collection).countDocuments();
    const dynamoCount = DRY_RUN ? "(dry run)" : await tableCount(table);
    const ok = DRY_RUN || dynamoCount >= count;
    if (!ok) mismatches += 1;
    console.log(
      `  ${collection}: ${mongoCount} -> ${count} -> ${dynamoCount} ${ok ? "OK" : "MISMATCH"}`
    );
  }

  await mongoClient.close();
  if (mismatches > 0) {
    console.error(`\n${mismatches} table(s) mismatched`);
    process.exit(1);
  }
  console.log("\nBackfill complete.");
})().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
