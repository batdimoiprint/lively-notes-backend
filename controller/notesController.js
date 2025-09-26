const notesService = require('../service/notesService');

async function listNotes(req, res, next) {
  try {
    const notes = await notesService.getAll()
    console.log(notes)
    res.status(200).json(notes);
  } catch (err) {
    next(err);
  }
}

async function createNote(req, res, next) {
    try {
        console.log(req.body)
        const create = await notesService.create(req.body)
        res.status(201).json(create)
        
    } catch (err) {
        next(err)
    }
    
}

module.exports = {listNotes, createNote};
