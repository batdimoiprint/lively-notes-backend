const jwt = require("jsonwebtoken");

function generateJWT(payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "1d",
  });
  return token;
}

function authJWT(req, res, next) {
  const cookie = req.cookies.JWT_KEY;

  if (cookie) {
    jwt.verify(cookie, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

module.exports = { authJWT, generateJWT };
