const client = require("../db/db.js");
const { ObjectId } = require("mongodb");
const myDB = client.db("livelydesktopnotes");
const todosCollection = myDB.collection("todos");

async function getAll() {
  const cursor = await todosCollection.find({}).sort({ createdAt: -1 });
  return cursor.toArray();
}

async function createTodo(payload) {
  const todo = {
    text: payload.text,
    completed: false,
    createdAt: new Date(),
  };
  const result = await todosCollection.insertOne(todo);
  return { _id: result.insertedId, ...todo };
}

async function deleteTodo(id) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }

  const _id = new ObjectId(id);
  const result = await todosCollection.deleteOne({ _id });
  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
  };
}

async function updateTodo(payload) {
  if (!ObjectId.isValid(payload._id)) {
    return { acknowledged: false, modified: 0 };
  }

  const id = new ObjectId(payload._id);
  const updateFields = {};
  
  if (payload.text !== undefined) {
    updateFields.text = payload.text;
  }
  if (payload.completed !== undefined) {
    updateFields.completed = payload.completed;
  }

  const result = await todosCollection.updateOne(
    { _id: id },
    { $set: updateFields }
  );
  
  return {
    acknowledged: result.acknowledged,
    modified: result.modifiedCount,
  };
}

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

module.exports = {
  getAll,
  createTodo,
  deleteTodo,
  updateTodo,
  isValidObjectId,
};
