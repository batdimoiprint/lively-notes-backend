
const options = {
  origin: process.env.NODE_ENV === "production"
    ? [process.env.ORIGIN]
    : ["http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
};
module.exports = options;
