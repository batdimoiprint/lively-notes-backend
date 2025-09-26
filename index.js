require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000
const cors = require('cors')
const options = require('./config/corsConfig');

const notesRouter = require('./routes/notesRoutes');


app.use(express.json());
app.use('/api/notes', notesRouter);
app.use(cors(options))


app.get('/', (req, res) => {
    res.send('Bakit ka andito')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
