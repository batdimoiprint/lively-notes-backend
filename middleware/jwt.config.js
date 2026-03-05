const jwt = require("jsonwebtoken");
let accessTokenExpiry = "15m";
let accessTokenCookieMaxAge = 15 * 60 * 1000;
let refreshTokenCookieMaxAge = 7 * 24 * 60 * 60 * 1000;

if (process.env.NODE_ENV === "development") {
  accessTokenExpiry = "7d";
  accessTokenCookieMaxAge = 7 * 24 * 60 * 60 * 1000;
}

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: accessTokenExpiry,
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
}

async function authJWT(req, res, next) {
  const access_token = req.cookies.access_token;
  if (!access_token)
    return res.status(403).json({ message: "No Access Token" });
  try {
    const user = await jwt.verify(
      access_token,
      process.env.ACCESS_TOKEN_SECRET,
    );

    req.user = user;
    // console.log(req.user.userId);
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token" });
  }
}

async function refreshJWT(req, res) {
  const refresh_token = req.cookies.refresh_token;

  if (!refresh_token) {
    return res.status(401).json({ message: "No Refresh Token" });
  }

  try {
    const user = await jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN_SECRET,
    );
    // Refresh Access Token
    const newAccessToken = generateAccessToken({ userId: user.userId });
    res.cookie("access_token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: accessTokenCookieMaxAge,
    });
    console.log("New Access Token " + newAccessToken);
    // Refresh Refresh Token
    const newRefreshToken = generateRefreshToken({ userId: user.userId });
    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: refreshTokenCookieMaxAge,
    });
    console.log("New Access Token " + newRefreshToken);
    res.status(200).json({ message: "Token Refreshed" });
  } catch (error) {
    res.status(403).json({ message: "Invalid Refresh Token" });
  }
}

function removeCookie(req, res, next) {
  if (req.user && req.user.userId) {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    res.status(200).json({ message: "Logged out" });
  } else {
    res.sendStatus(401);
  }
}

function getTokenMaxAges() {
  return {
    accessTokenCookieMaxAge,
    refreshTokenCookieMaxAge,
  };
}

module.exports = {
  authJWT,
  refreshJWT,
  removeCookie,
  generateAccessToken,
  generateRefreshToken,
  getTokenMaxAges,
};
