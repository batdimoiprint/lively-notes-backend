const express = require("express");
const todosController = require("../controller/todos.controller");

const router = express.Router();

/**
 * @swagger
 * /api/todos:
 *   get:
 *     tags:
 *       - Todos
 *     summary: Get all todos
 *     description: Retrieves a list of all todos from the database.
 *     responses:
 *       200:
 *         description: List of todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60d5ec49f1b2c8b1f8e4e1a2"
 *                   text:
 *                     type: string
 *                     example: "Buy groceries"
 *                   completed:
 *                     type: boolean
 *                     example: false
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get("/", todosController.listTodos);

/**
 * @swagger
 * /api/todos:
 *   post:
 *     tags:
 *       - Todos
 *     summary: Create a new todo
 *     description: Creates a new todo in the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Buy groceries"
 *     responses:
 *       201:
 *         description: Todo created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 text:
 *                   type: string
 *                 completed:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *       400:
 *         description: Text is required
 */
router.post("/", todosController.createTodo);

/**
 * @swagger
 * /api/todos:
 *   delete:
 *     tags:
 *       - Todos
 *     summary: Delete a todo
 *     description: Deletes a todo from the database by its ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "68d6720abb392b1320776431"
 *     responses:
 *       200:
 *         description: Todo deleted successfully
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Todo not found
 */
router.delete("/", todosController.deleteTodo);

/**
 * @swagger
 * /api/todos:
 *   put:
 *     tags:
 *       - Todos
 *     summary: Update a todo
 *     description: Updates an existing todo's text or completed status.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "68fdd6bd0c14eeb0772e6e0f"
 *               text:
 *                 type: string
 *                 example: "Updated todo text"
 *               completed:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Todo updated successfully
 *       400:
 *         description: Invalid ID format
 */
router.put("/", todosController.updateTodo);

module.exports = router;
