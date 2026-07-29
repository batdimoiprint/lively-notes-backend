const options = {
  origin: (origin, callback) => {
    // Reflect exact request origin to comply with withCredentials: true
    callback(null, origin || "*");
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Sync", "sync", "Cookie", "x-sync"]
};

module.exports = options;
