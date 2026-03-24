const client = require("../db/db.js");
const { ObjectId } = require("mongodb");

const myDB = client.db("livelydesktopnotes");
const userCollection = myDB.collection("user");

function normalizeUsername(value) {
  return value.trim().toLowerCase();
}

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

function getIgUsernamesFromUser(user) {
  if (!user || !Array.isArray(user.igUsernames)) {
    return [];
  }

  return user.igUsernames;
}

async function listIgUsernames(userId) {
  const user = await getUserById(userId);
  if (!user) {
    return { notFound: true, data: [] };
  }

  return { notFound: false, data: getIgUsernamesFromUser(user) };
}

async function createIgUsername(userId, igUsername) {
  const user = await getUserById(userId);
  if (!user) {
    return { notFound: true };
  }

  const currentItems = getIgUsernamesFromUser(user);
  const normalized = normalizeUsername(igUsername);

  const duplicate = currentItems.some((item) => item?.igUsername === normalized);
  if (duplicate) {
    return { duplicate: true };
  }

  const maxAutoIncrement = currentItems.reduce((acc, item) => {
    const value = Number(item?.autoIncrement ?? 0);
    return Number.isFinite(value) ? Math.max(acc, value) : acc;
  }, 0);

  const created = {
    autoIncrement: maxAutoIncrement + 1,
    igUsername: normalized,
  };

  const updated = [...currentItems, created];

  await userCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        igUsernames: updated,
      },
    },
  );

  return { duplicate: false, notFound: false, data: created };
}

async function updateIgUsername(userId, autoIncrement, igUsername) {
  const user = await getUserById(userId);
  if (!user) {
    return { notFound: true };
  }

  const currentItems = getIgUsernamesFromUser(user);
  const normalized = normalizeUsername(igUsername);

  const duplicate = currentItems.some(
    (item) => item?.autoIncrement !== autoIncrement && item?.igUsername === normalized,
  );

  if (duplicate) {
    return { duplicate: true };
  }

  let updatedOne = false;
  const updated = currentItems.map((item) => {
    if (item?.autoIncrement !== autoIncrement) {
      return item;
    }

    updatedOne = true;
    return {
      ...item,
      igUsername: normalized,
    };
  });

  if (!updatedOne) {
    return { itemNotFound: true };
  }

  await userCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        igUsernames: updated,
      },
    },
  );

  return { duplicate: false, notFound: false, itemNotFound: false };
}

async function deleteIgUsername(userId, autoIncrement) {
  const user = await getUserById(userId);
  if (!user) {
    return { notFound: true };
  }

  const currentItems = getIgUsernamesFromUser(user);
  const updated = currentItems.filter((item) => item?.autoIncrement !== autoIncrement);

  if (updated.length === currentItems.length) {
    return { itemNotFound: true };
  }

  await userCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        igUsernames: updated,
      },
    },
  );

  return { notFound: false, itemNotFound: false };
}

module.exports = {
  listIgUsernames,
  createIgUsername,
  updateIgUsername,
  deleteIgUsername,
};
