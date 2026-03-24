const client = require("../db/db.js");
const { ObjectId } = require("mongodb");

const myDB = client.db("livelydesktopnotes");
const userCollection = myDB.collection("user");

function parseUserObjectId(userId) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  return new ObjectId(userId);
}

async function getUserById(userId) {
  const objectId = parseUserObjectId(userId);
  if (!objectId) {
    return null;
  }

  return userCollection.findOne({ _id: objectId });
}

function getSoundFromUser(user) {
  if (!user || !user.pomodoroSound) {
    return null;
  }

  return user.pomodoroSound;
}

async function getPomodoroSound(userId) {
  const user = await getUserById(userId);
  if (!user) {
    return { notFound: true, sound: null };
  }

  return { notFound: false, sound: getSoundFromUser(user) };
}

async function upsertPomodoroSound(userId, file) {
  const user = await getUserById(userId);
  if (!user) {
    return { notFound: true };
  }

  const sound = {
    data: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname,
    size: file.size,
    updatedAt: new Date(),
  };

  await userCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        pomodoroSound: sound,
      },
    },
  );

  return { notFound: false, sound };
}

async function deletePomodoroSound(userId) {
  const user = await getUserById(userId);
  if (!user) {
    return { notFound: true };
  }

  await userCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        pomodoroSound: null,
      },
    },
  );

  return { notFound: false };
}

module.exports = {
  getPomodoroSound,
  upsertPomodoroSound,
  deletePomodoroSound,
};