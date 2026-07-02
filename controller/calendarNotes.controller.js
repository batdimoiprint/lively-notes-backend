const calendarNotesService = require("../service/calendarNotes.service.js");

async function listNotes(req, res, next) {
  try {
    const notes = await calendarNotesService.getAll();
    res.status(200).json(notes);
  } catch (err) {
    next(err);
  }
}

async function getByMonth(req, res, next) {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: "Invalid year or month" });
    }

    const notes = await calendarNotesService.getByMonth(year, month);
    res.status(200).json(notes);
  } catch (err) {
    next(err);
  }
}

async function createNote(req, res, next) {
  try {
    const { title, body, date, reminderAt, reminderInterval, isWholeDay } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!date || !calendarNotesService.isValidDateString(date)) {
      return res.status(400).json({ error: "Valid date (YYYY-MM-DD) is required" });
    }

    // Validate reminderAt if provided
    if (reminderAt) {
      const reminderDate = new Date(reminderAt);
      if (isNaN(reminderDate.getTime())) {
        return res.status(400).json({ error: "Invalid reminderAt datetime" });
      }
    }

    // Validate reminderInterval if provided
    const allowedIntervals = ["once", "5m", "15m", "30m", "1h", "1d"];
    if (reminderInterval && !allowedIntervals.includes(reminderInterval)) {
      return res.status(400).json({ error: "Invalid reminderInterval" });
    }

    const note = await calendarNotesService.createNote({
      title: title.trim(),
      body: body ? body.trim() : "",
      date,
      reminderAt: reminderAt || null,
      reminderInterval: reminderInterval || "once",
      isWholeDay: !!isWholeDay,
    });

    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

async function updateNote(req, res, next) {
  try {
    const { _id, title, body, date, reminderAt, reminderInterval, isWholeDay } = req.body;

    if (!_id || !calendarNotesService.isValidId(_id)) {
      return res.status(400).json({ error: "Valid _id is required" });
    }

    if (date !== undefined && !calendarNotesService.isValidDateString(date)) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (reminderAt !== undefined && reminderAt !== null) {
      const reminderDate = new Date(reminderAt);
      if (isNaN(reminderDate.getTime())) {
        return res.status(400).json({ error: "Invalid reminderAt datetime" });
      }
    }

    // Validate reminderInterval if provided
    const allowedIntervals = ["once", "5m", "15m", "30m", "1h", "1d"];
    if (reminderInterval !== undefined && reminderInterval !== null) {
      if (!allowedIntervals.includes(reminderInterval)) {
        return res.status(400).json({ error: "Invalid reminderInterval" });
      }
    }

    const result = await calendarNotesService.updateNote({
      _id,
      title,
      body,
      date,
      reminderAt,
      reminderInterval,
      isWholeDay,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteNote(req, res, next) {
  try {
    const { _id } = req.body;

    if (!_id || !calendarNotesService.isValidId(_id)) {
      return res.status(400).json({ error: "Valid _id is required" });
    }

    const result = await calendarNotesService.deleteNote(_id);

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Calendar note not found" });
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotes, getByMonth, createNote, updateNote, deleteNote };
