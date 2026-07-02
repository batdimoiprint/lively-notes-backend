const userRepository = require("../repositories/user.repository.js");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/jwt.config.js");
const {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} = require("../middleware/cookie.config.js");

async function login(req, res) {
  try {
    const password = req.body;

    if (!password) {
      res.status(400).send();
    } else {
      // Single-tenant app: the one user row holds the hashed passkey.
      const user = await userRepository.getFirstUser();

      const isMatch =
        user && (await bcrypt.compare(password.code, user.code));

      if (!isMatch) {
        res.status(400).send();
      } else {
        const userId = String(user._id);
        const accessToken = generateAccessToken({ userId });
        const refreshToken = generateRefreshToken({ userId });
        res.cookie("access_token", accessToken, getAccessTokenCookieOptions());
        res.cookie("refresh_token", refreshToken, getRefreshTokenCookieOptions());

        res.status(200).json({ message: "Success" });

        if (process.env.NODE_ENV === "development") {
          console.log("Access Token:", accessToken);
          console.log("Refresh Token:", refreshToken);
        }
      }
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function register(req, res) {
  try {
    if (!req) {
      throw new Error("No Request");
    }
    const passkey = req.body.code;
    const hashedPasskey = await bcrypt.hash(passkey, 12);
    await userRepository.create({ code: hashedPasskey });

    res.status(201).send();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getMe(req, res) {
  try {
    res.status(200).json({ userId: req.user.userId });
  } catch (error) {
    res.status(403);
    throw error;
  }
}

module.exports = { register, login, getMe };
