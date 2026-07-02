/**
 * Dual-write reconciliation check: runs every repository read function twice —
 * once with READ_SOURCE=mongo, once with READ_SOURCE=dynamo — and diffs the
 * normalized results. This exercises the real read code paths, including the
 * GSIs that have no direct Mongo equivalent (sections.noteCount counter,
 * month-date-index, pending-reminders-index, owner-createdAt-index).
 *
 * Also runs a temporary calendar-note lifecycle (create with a due reminder →
 * month query → due query → markReminderSent → delete) to verify the sparse
 * pending-reminders index end to end; the temp note is cleaned up.
 *
 * Usage: node scripts/reconcile-dynamo.js
 */
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : ".env.local";
require("dotenv").config({ path: envFile, quiet: true });

const mongoClient = require("../db/db.js");
const notesRepo = require("../repositories/notes.repository.js");
const sectionsRepo = require("../repositories/sections.repository.js");
const todosRepo = require("../repositories/todos.repository.js");
const calendarRepo = require("../repositories/calendarNotes.repository.js");
const settingsRepo = require("../repositories/settings.repository.js");
const pushRepo = require("../repositories/pushSubscriptions.repository.js");
const igPostsRepo = require("../repositories/igPosts.repository.js");
const userRepo = require("../repositories/user.repository.js");

let failures = 0;

function toIso(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function createdAtOf(doc) {
  if (doc.createdAt) return toIso(doc.createdAt);
  if (doc._id && typeof doc._id.getTimestamp === "function") {
    return doc._id.getTimestamp().toISOString();
  }
  return new Date(0).toISOString();
}

// Normalize a doc from either store down to the fields the app actually
// reads, with the same defaults the backfill applied, so Mongo docs and
// DynamoDB items compare equal when they carry the same data.
const normalizers = {
  notes: (d) => ({
    _id: String(d._id),
    title: d.title,
    body: d.body,
    sectionId: d.sectionId || "default",
    order: d.order ?? -1,
    createdAt: createdAtOf(d),
  }),
  sections: (d) => ({
    _id: String(d._id),
    title: d.title,
    order: d.order ?? 0,
  }),
  sectionsWithCounts: (d) => ({
    _id: String(d._id),
    title: d.title,
    order: d.order ?? 0,
    noteCount: d.noteCount ?? 0,
  }),
  todos: (d) => ({
    _id: String(d._id),
    text: d.text,
    completed: !!d.completed,
    createdAt: createdAtOf(d),
  }),
  calendarNotes: (d) => ({
    _id: String(d._id),
    title: d.title,
    body: d.body,
    date: d.date,
    reminderAt: toIso(d.reminderAt),
    reminderInterval: d.reminderInterval || "once",
    reminderSent: !!d.reminderSent,
    isWholeDay: !!d.isWholeDay,
  }),
  settings: (d) => {
    const { _id, ...rest } = d;
    return rest;
  },
  pushSubscriptions: (d) => ({
    endpoint: d.endpoint,
    keys: d.keys,
  }),
  igPosts: (d) => ({
    _id: String(d._id),
    url: d.url,
    ownerUsername: d.ownerUsername ?? undefined,
    likesCount: d.likesCount ?? null,
    caption: d.caption ?? null,
  }),
  user: (d) => ({
    _id: String(d._id),
    code: d.code,
    igUsernames: d.igUsernames || [],
  }),
};

function sortById(list) {
  return [...list].sort((a, b) =>
    String(a._id ?? a.endpoint ?? "").localeCompare(String(b._id ?? b.endpoint ?? ""))
  );
}

async function underSource(source, fn) {
  const previous = process.env.READ_SOURCE;
  process.env.READ_SOURCE = source;
  try {
    return await fn();
  } finally {
    process.env.READ_SOURCE = previous;
  }
}

function report(label, ok, detail = "") {
  if (ok) {
    console.log(`  OK   ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// JSON.stringify with recursively sorted object keys, so attribute order
// (which differs between the two stores) never causes a false mismatch.
function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

async function compareRead(label, readFn, normalize, { sorted = true } = {}) {
  const mongoResult = await underSource("mongo", readFn);
  const dynamoResult = await underSource("dynamo", readFn);

  const norm = (result) => {
    const list = Array.isArray(result) ? result : result ? [result] : [];
    const normalized = list.map(normalize);
    return sorted ? sortById(normalized) : normalized;
  };

  const a = stableStringify(norm(mongoResult));
  const b = stableStringify(norm(dynamoResult));
  report(label, a === b, a === b ? "" : `\n    mongo:  ${a}\n    dynamo: ${b}`);
}

async function lifecycleCheck() {
  console.log("\nTemp calendar-note lifecycle (pending-reminders-index):");
  const today = new Date().toISOString().slice(0, 10);
  const created = await calendarRepo.create({
    title: "[reconcile] temp reminder",
    body: "temporary — created by scripts/reconcile-dynamo.js",
    date: today,
    reminderAt: new Date(Date.now() - 60 * 1000), // already due
    reminderInterval: "once",
    reminderSent: false,
    isWholeDay: false,
    createdAt: new Date(),
  });
  const id = String(created._id);

  try {
    const [year, month] = [today.slice(0, 4), today.slice(5, 7)];
    await compareRead(
      `getByMonth(${year}, ${Number(month)}) sees temp note (month-date-index)`,
      () => calendarRepo.getByMonth(Number(year), Number(month)),
      normalizers.calendarNotes
    );

    const dueDynamo = await underSource("dynamo", () =>
      calendarRepo.getDueReminders()
    );
    report(
      "getDueReminders (dynamo) returns the due temp note",
      dueDynamo.some((n) => String(n._id) === id)
    );
    await compareRead(
      "getDueReminders parity",
      () => calendarRepo.getDueReminders(),
      normalizers.calendarNotes
    );

    await calendarRepo.markReminderSent(id);
    const dueAfter = await underSource("dynamo", () =>
      calendarRepo.getDueReminders()
    );
    report(
      "markReminderSent removes note from pending index",
      !dueAfter.some((n) => String(n._id) === id)
    );
  } finally {
    await calendarRepo.remove(id);
  }
  const goneDynamo = await underSource("dynamo", () => calendarRepo.getAll());
  report(
    "temp note cleaned up from both stores",
    !goneDynamo.some((n) => String(n._id) === id)
  );
}

(async () => {
  console.log(`Reconciling Mongo vs DynamoDB reads using ${envFile}\n`);
  console.log("Read-path parity:");

  await compareRead("notes.getAll", () => notesRepo.getAll(), normalizers.notes);
  await compareRead(
    "sections.getAll",
    () => sectionsRepo.getAll(),
    normalizers.sections
  );
  await compareRead(
    "sections.getAllWithNoteCounts (noteCount counter vs $lookup)",
    () => sectionsRepo.getAllWithNoteCounts(),
    normalizers.sectionsWithCounts
  );

  const sections = await underSource("mongo", () => sectionsRepo.getAll());
  for (const section of sections) {
    await compareRead(
      `notes.getBySection(${section._id}) (sectionId-order-index)`,
      () => notesRepo.getBySection(String(section._id)),
      normalizers.notes
    );
  }

  await compareRead("todos.getAll", () => todosRepo.getAll(), normalizers.todos);
  await compareRead(
    "calendarNotes.getAll",
    () => calendarRepo.getAll(),
    normalizers.calendarNotes
  );
  await compareRead(
    "settings.getSettings",
    () => settingsRepo.getSettings(),
    normalizers.settings
  );
  await compareRead(
    "pushSubscriptions.getAll",
    () => pushRepo.getAll(),
    normalizers.pushSubscriptions
  );
  await compareRead(
    "user.getFirstUser",
    () => userRepo.getFirstUser(),
    normalizers.user
  );

  const user = await underSource("mongo", () => userRepo.getFirstUser());
  const usernames = (user?.igUsernames || [])
    .map((entry) => entry?.igUsername)
    .filter(Boolean);
  for (const username of usernames) {
    await compareRead(
      `igPosts.getByUsername(${username}) (owner-createdAt-index)`,
      () => igPostsRepo.getByUsername(username),
      normalizers.igPosts
    );
    await compareRead(
      `igPosts.getNewestByUsername(${username})`,
      () => igPostsRepo.getNewestByUsername(username),
      normalizers.igPosts,
      { sorted: false }
    );
  }

  await lifecycleCheck();

  await mongoClient.close();
  console.log(
    failures === 0
      ? "\nAll reconciliation checks passed."
      : `\n${failures} check(s) FAILED.`
  );
  process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
  console.error("Reconcile failed:", err);
  process.exit(1);
});
