const jwt = require("jsonwebtoken");

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}

function authJWT(req, res, next) {
  const cookie = req.cookies.access_token;

  if (cookie) {
    jwt.verify(cookie, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      // console.log(req.user.userId);
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
    res.clearCookie("ACCESS_TOKEN_SECRET", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out" });
  } else {
    res.sendStatus(401);
  }
}

module.exports = {
  authJWT,
  refreshJWT,
  removeCookie,
  generateAccessToken,
  generateRefreshToken,
};
