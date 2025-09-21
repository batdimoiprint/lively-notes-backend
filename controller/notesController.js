const client = require('../db/db.js');

// console.log(client)

    const myDB = client.db("livelydesktopnotes")
    const myColl = myDB.collection("notes")
// INSERT
async function insertNotes(title, body) {

    let titleInput = title;
    let bodyInput = body;

    try {
        const doc = { title: `${titleInput}`, body: `${bodyInput}` }
        const result = await myColl.insertOne(doc)
        console.log(`${result.insertedId}`);
    } catch (error) {
        console.log(error)
    } finally {

    }
}

module.exports = insertNotes