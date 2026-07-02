const todosRepository = require("../repositories/todos.repository.js");
const { isValidId } = require("../repositories/repository.util.js");

async function getAll() {
  return todosRepository.getAll();
}

async function createTodo(payload) {
  return todosRepository.create({ text: payload.text });
}

async function deleteTodo(id) {
  if (!isValidId(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }
  return todosRepository.remove(id);
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

  return todosRepository.update(payload._id, updateFields);
}

module.exports = {
  getAll,
  createTodo,
  deleteTodo,
  updateTodo,
  isValidId,
};
