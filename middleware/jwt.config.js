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
      console.log(req.user.userId);
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

function refreshJWT(req, res, next) {

  if (req.user && req.user.userId) {
    const newToken = jwt.sign(
      { userId: req.user.userId },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "1d",
      },
    );

    res.cookie("JWT_KEY", newToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
 
      maxAge: 24 * 60 * 60 * 1000,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("Development Token:", newToken);
    }

    res.status(200).json({ message: "Token Refresh" });
  } else {
    res.sendStatus(401);
  }
}

function removeCookie(req, res, next) {
  if (req.user && req.user.userId) {
    res.clearCookie("JWT_KEY", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out" });
  } else {
    res.sendStatus(401);
  }
}

module.exports = { authJWT, generateJWT, refreshJWT, removeCookie };
