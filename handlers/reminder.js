const path = require("path");
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : ".env.local";
require("dotenv").config({ path: path.resolve(__dirname, "../", envFile) });

const calendarNotesService = require("../service/calendarNotes.service.js");
const pushService = require("../service/push.service.js");

const handler = async (event, context) => {
  console.log("Reminder Worker Cron triggered at", new Date().toISOString());
  try {
    const dueReminders = await calendarNotesService.getDueReminders();
    console.log(`Found ${dueReminders.length} due reminders.`);

    for (const note of dueReminders) {
      const payload = {
        title: `📅 Reminder: ${note.title}`,
        body: note.body || "You have a calendar note reminder!",
        url: "/",
        tag: `reminder-${note._id}`,
      };

      await pushService.sendToAll(payload);
      console.log(`Sent reminder for note: ${note._id}`);

      if (note.reminderInterval && note.reminderInterval !== "once") {
        let intervalMs = 0;
        switch (note.reminderInterval) {
          case "5m":
            intervalMs = 5 * 60 * 1000;
            break;
          case "15m":
            intervalMs = 15 * 60 * 1000;
            break;
          case "30m":
            intervalMs = 30 * 60 * 1000;
            break;
          case "1h":
            intervalMs = 60 * 60 * 1000;
            break;
          case "1d":
            intervalMs = 24 * 60 * 60 * 1000;
            break;
        }

        if (intervalMs > 0) {
          const now = new Date();
          let nextReminderAt = new Date(new Date(note.reminderAt).getTime() + intervalMs);
          while (nextReminderAt <= now) {
            nextReminderAt = new Date(nextReminderAt.getTime() + intervalMs);
          }
          await calendarNotesService.updateNote({
            _id: note._id.toString(),
            reminderAt: nextReminderAt.toISOString(),
          });
          console.log(`Updated reminder interval for note: ${note._id} to ${nextReminderAt.toISOString()}`);
        } else {
          await calendarNotesService.markReminderSent(note._id);
          console.log(`Marked reminder as sent for note: ${note._id}`);
        }
      } else {
        await calendarNotesService.markReminderSent(note._id);
        console.log(`Marked reminder as sent for note: ${note._id}`);
      }
    }
  } catch (error) {
    console.error("Reminder worker execution error:", error.message);
    throw error;
  }
  return { statusCode: 200, body: "Done" };
};

module.exports = { handler };
