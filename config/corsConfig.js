const options = {
  origin: ["http://localhost:5500", process.env.ORIGIN],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
module.exports = options;
