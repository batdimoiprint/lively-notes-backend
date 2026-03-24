const igUsernameService = require("../service/igusername.service");

function extractUsername(body) {
  return body?.igUsername ?? body?.username ?? body?.["ig-username"];
}

function parseAutoIncrement(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function isValidUsername(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  return /^[a-zA-Z0-9._]{1,30}$/.test(trimmed);
}

async function listIgUsernames(req, res) {
  try {
    const userId = req.user?.userId;
    const result = await igUsernameService.listIgUsernames(userId);

    if (result.notFound) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ data: result.data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function createIgUsername(req, res) {
  try {
    const userId = req.user?.userId;
    const igUsername = extractUsername(req.body);

    if (!isValidUsername(igUsername)) {
      return res.status(400).json({
        message: "igUsername is required and must match Instagram username format",
      });
    }

    const result = await igUsernameService.createIgUsername(userId, igUsername);

    if (result.notFound) {
      return res.status(404).json({ message: "User not found" });
    }

    if (result.duplicate) {
      return res.status(409).json({ message: "igUsername already exists" });
    }

    return res.status(201).json({
      message: "Success",
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function updateIgUsername(req, res) {
  try {
    const userId = req.user?.userId;
    const autoIncrement = parseAutoIncrement(req.params.autoIncrement);
    const igUsername = extractUsername(req.body);

    if (!autoIncrement) {
      return res.status(400).json({ message: "autoIncrement must be a positive integer" });
    }

    if (!isValidUsername(igUsername)) {
      return res.status(400).json({
        message: "igUsername is required and must match Instagram username format",
      });
    }

    const result = await igUsernameService.updateIgUsername(userId, autoIncrement, igUsername);

    if (result.notFound) {
      return res.status(404).json({ message: "User not found" });
    }

    if (result.itemNotFound) {
      return res.status(404).json({ message: "igUsername entry not found" });
    }

    if (result.duplicate) {
      return res.status(409).json({ message: "igUsername already exists" });
    }

    return res.status(200).json({ message: "Updated" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function deleteIgUsername(req, res) {
  try {
    const userId = req.user?.userId;
    const autoIncrement = parseAutoIncrement(req.params.autoIncrement);

    if (!autoIncrement) {
      return res.status(400).json({ message: "autoIncrement must be a positive integer" });
    }

    const result = await igUsernameService.deleteIgUsername(userId, autoIncrement);

    if (result.notFound) {
      return res.status(404).json({ message: "User not found" });
    }

    if (result.itemNotFound) {
      return res.status(404).json({ message: "igUsername entry not found" });
    }

    return res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  listIgUsernames,
  createIgUsername,
  updateIgUsername,
  deleteIgUsername,
};
