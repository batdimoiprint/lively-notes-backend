const client = require("../db/db.js");
const myDB = client.db("livelydesktopnotes");
const ig_posts_collection = myDB.collection("ig_posts");


async function returnOneRandomPost(req,res) {
    try {
        const data = await ig_posts_collection.find({}).toArray();
        const randomPost = data[Math.floor(Math.random() * data.length)];
        res.status(200).json(randomPost);
    } catch (error) {
        console.log(error)
        throw error
    }
}


module.exports = { returnOneRandomPost };