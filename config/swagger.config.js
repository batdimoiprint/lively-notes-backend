const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My Express API",
      version: "1.0.0",
      description: "A simple Express Library API",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "JWT_KEY"
        },
      },
    },
    security: [{cookieAuth: [] }],
  },

  // Change './routes/*.js' to match your file structure.
  apis: ["./routes/*.js", "./app.js"],
};

module.exports = { options };
