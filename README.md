# Lively Notes Backend

This is the Express.js backend for the Lively Desktop Notes application. It provides a simple API for creating, retrieving, and deleting notes, with data stored in a MongoDB database.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later recommended)
- [pnpm](https://pnpm.io/installation) (or npm/yarn)
- [MongoDB](https://www.mongodb.com/try/download/community) instance (local or cloud)

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd lively-notes-backend
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
    (or `npm install` / `yarn install`)

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    The `.env.example` file contains the following:
    ```
    MONGODB_URI=""
    ```
    Open your new `.env` file and add your MongoDB connection string. For example:
    ```
    MONGODB_URI="mongodb://username:password@host:port/database_name"
    ```

## Usage

### Development

To run the server in development mode with hot-reloading:

```bash
pnpm run dev
```

### Production

To run the server in production mode:

```bash
pnpm start
```

The server will start on the port specified in your `.env` file, or on port 3000 by default.

## API Endpoints

All endpoints are prefixed with `/api/notes`.

### `GET /api/notes`

Retrieves a list of all notes.

-   **Success Response (200):**
    ```json
    [
      {
        "_id": "60c72b2f9b1d8c001f8e4d2a",
        "title": "My First Note",
        "content": "This is a test note."
      }
    ]
    ```

### `POST /api/notes`

Creates a new note.

-   **Request Body:**
    ```json
    {
      "title": "New Note Title",
      "content": "Content of the new note."
    }
    ```

-   **Success Response (201):**
    Returns the created note object, including the new `_id`.
    ```json
    {
      "_id": "60c72b3a9b1d8c001f8e4d2b",
      "title": "New Note Title",
      "content": "Content of the new note."
    }
    ```

### `DELETE /api/notes`

Deletes a note by its ID.

> **Note:** This endpoint expects the `_id` of the note to be sent in the request body, which is a non-standard implementation for a `DELETE` request.

-   **Request Body:**
    ```json
    {
      "_id": "60c72b3a9b1d8c001f8e4d2b"
    }
    ```

-   **Success Response (200):**
    ```json
    {
      "acknowledged": true,
      "deletedCount": 1
    }
    ```
-   **Error Response (400):** If the `_id` format is invalid.
-   **Error Response (404):** If no note with the given `_id` is found.