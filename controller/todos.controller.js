const todosService = require("../service/todos.service");

async function listTodos(req, res, next) {
  try {
    const todos = await todosService.getAll();
    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
}

async function createTodo(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }
    const todo = await todosService.createTodo({ text: text.trim() });
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}

async function deleteTodo(req, res, next) {
  try {
    const resourceId = req.body._id;

    if (!todosService.isValidObjectId(resourceId)) {
      return res.status(400).json({ error: "Invalid Format" });
    }

    const remove = await todosService.deleteTodo(resourceId);

    if (remove.deletedCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.status(200).json(remove);
  } catch (err) {
    next(err);
  }
}

async function updateTodo(req, res, next) {
  try {
    const resourceId = req.body._id;

    if (!todosService.isValidObjectId(resourceId)) {
      return res.status(400).json({ error: "Invalid Format" });
    }

    const update = await todosService.updateTodo(req.body);
    res.status(200).json(update);
  } catch (error) {
    next(error);
  }
}

module.exports = { listTodos, createTodo, deleteTodo, updateTodo };
