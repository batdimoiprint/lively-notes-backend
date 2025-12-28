const options = {
  origin: [
    "http://127.0.0.1:5173",
    process.env.ORIGIN,
    "http://localhost:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
module.exports = options;
