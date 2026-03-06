const isDev = process.env.NODE_ENV === "development";

const accessTokenCookieMaxAge = isDev
  ? 7 * 24 * 60 * 60 * 1000 // 7 days
  : 15 * 60 * 1000;         // 15 minutes

const refreshTokenCookieMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: accessTokenCookieMaxAge,
  };
}

function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: refreshTokenCookieMaxAge,
  };
}

module.exports = {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  accessTokenCookieMaxAge,
  refreshTokenCookieMaxAge,
};
