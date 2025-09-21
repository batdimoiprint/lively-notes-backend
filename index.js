require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000


const insertNotes = require("./controller/notesController.js")

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/api/notes', (req, res) => {
    // const requestData = req.body
    insertNotes(req.body.title, req.body.body)
    res.send(JSON.stringify("Notes added"))
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
