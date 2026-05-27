const calendarNotesService = require("./calendarNotes.service.js");
const pushService = require("./push.service.js");

let schedulerInterval = null;

function startScheduler(intervalMs = 60000) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  schedulerInterval = setInterval(async () => {
    try {
      const dueReminders = await calendarNotesService.getDueReminders();

      for (const note of dueReminders) {
        const payload = {
          title: `📅 Reminder: ${note.title}`,
          body: note.body || "You have a calendar note reminder!",
          url: "/",
          tag: `reminder-${note._id}`,
        };

        await pushService.sendToAll(payload);

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
          } else {
            await calendarNotesService.markReminderSent(note._id);
          }
        } else {
          await calendarNotesService.markReminderSent(note._id);
        }
      }
    } catch (error) {
      // Log but don't crash the scheduler
      console.error("Reminder scheduler error:", error.message);
    }
  }, intervalMs);

  console.log(`Reminder scheduler started (every ${intervalMs / 1000}s)`);
}

function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Reminder scheduler stopped");
  }
}

module.exports = { startScheduler, stopScheduler };
