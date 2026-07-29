const isDev = process.env.NODE_ENV === "development";

const accessTokenCookieMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days (matches JWT expiry)

const refreshTokenCookieMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: isDev ? "Lax" : "None",
    maxAge: accessTokenCookieMaxAge,
  };
}

function getRefreshTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: isDev ? "Lax" : "None",
    maxAge: refreshTokenCookieMaxAge,
  };
}

module.exports = {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  accessTokenCookieMaxAge,
  refreshTokenCookieMaxAge,
};
