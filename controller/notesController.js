const notesService = require("../service/notesService");

/**
 * Handles the request to list all notes.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
async function listNotes(req, res, next) {
  try {
    const notes = await notesService.getAll();
    // console.log(notes)
    res.status(200).json(notes);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles the request to create a new note.
 * @param {import('express').Request} req - The Express request object. The request body should contain the note to be created.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
async function createNote(req, res, next) {
  try {
    // console.log(req.body)
    const create = await notesService.createNote(req.body);
    res.status(201).json(create);
  } catch (err) {
    next(err);
  }
}

/**
 * Handles the request to delete a note.
 * @param {import('express').Request} req - The Express request object. The request body should contain the `_id` of the note to be deleted.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
async function deleteNote(req, res, next) {
  try {
    const resourceId = req.body._id;
    
    if (!notesService.isValidObjectId(resourceId)) {
      return res.status(400).json({error: 'Invalid Format'})
    }

    const remove = await notesService.deleteNote(resourceId);

    if (remove.deletedCount === 0) {
      return res.status(404).json({error: 'Note not found'});
    }

    res.status(200).json(remove);
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotes, createNote, deleteNote };
