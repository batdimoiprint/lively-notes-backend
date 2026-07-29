const todosRepository = require("../repositories/todos.repository.js");
const { isValidId } = require("../repositories/repository.util.js");
const { broadcastSyncEvent } = require("./sync.service.js");

async function getAll() {
  return todosRepository.getAll();
}

async function createTodo(payload) {
  const result = await todosRepository.create({ text: payload.text });
  await broadcastSyncEvent("global_user", { domain: "todos", action: "create", id: result?._id || result?.insertedId });
  return result;
}

async function deleteTodo(id) {
  if (!isValidId(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }
  const result = await todosRepository.remove(id);
  await broadcastSyncEvent("global_user", { domain: "todos", action: "delete", id });
  return result;
}

async function updateTodo(payload) {
  if (!isValidId(payload._id)) {
    return { acknowledged: false, modified: 0 };
  }

  const updateFields = {};
  if (payload.text !== undefined) {
    updateFields.text = payload.text;
  }
  if (payload.completed !== undefined) {
    updateFields.completed = payload.completed;
  }

  const result = await todosRepository.update(payload._id, updateFields);
  await broadcastSyncEvent("global_user", { domain: "todos", action: "update", id: payload._id });
  return result;
}

module.exports = {
  getAll,
  createTodo,
  deleteTodo,
  updateTodo,
  isValidId,
};
