const client = require("../db/db.js");
const myDB = client.db("livelydesktopnotes");
const userCollection = myDB.collection("user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function login(req, res) {
  try {
    const password = await req.body;

    if (!password) {
      res.status(400).send();
    } else {
      const hashedPassword = await userCollection.find().toArray();

      const isMatch = await bcrypt.compare(
        password.code,
        hashedPassword[0].code,
      );

      if (!isMatch) {
        res.status(400).send();
      } else {
        const user = hashedPassword[0]._id.toString();
        const token = jwt.sign({ userId: user }, process.env.JWT_SECRET, {
          algorithm: "HS256",
          expiresIn: "1d"
        });
        
        res.status(200).json({ message: "Success", jwt: token });
      }
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function register(req, res) {
  try {
    if (!req) {
      throw new Error("No Request");
    }
    const passkey = await req.body.code;
    const hashedPasskey = await bcrypt.hash(passkey, 12);
    console.log(hashedPasskey);
    await userCollection.insertOne({ code: hashedPasskey });

    res.status(201).send();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

module.exports = { register, login };
