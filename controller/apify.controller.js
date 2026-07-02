const apify_api = require("../api/axiosInstance");
const apify_client = require("../config/apify.client");
const cloudinary = require("./cloudinary.controller");
const igPostEvents = require("../service/igpost.events");
const igUsernameService = require("../service/igusername.service");
const apifyService = require("../service/apifyService");

async function getScrappedPictures(req, res) {
  // TODO:  add validation for date ranges of fetch so no same content will be uploaded
  // Each scrapping is every monday
  try {
    const apify = await apify_api.get(
      `/datasets/h9ofgfAhb0tFXKlzt/items?token=${process.env.APIFY_PAT}`,
    );
    const sanaImageArray = apify.data[0]["images"];
    sanaImageArray.forEach(async (element) => {
      const imagesData = {
        image: element,
        folder: "Sana",
      };
      await cloudinary.uploadScrappedPictures(imagesData);
    });

    const momoImageArray = apify.data[1]["images"];
    momoImageArray.forEach(async (element) => {
      const imagesData = {
        image: element,
        folder: "Momo",
      };
      await cloudinary.uploadScrappedPictures(imagesData);
    });

    const lizImageArray = apify.data[2]["images"];
    lizImageArray.forEach(async (element) => {
      const imagesData = {
        image: element,
        folder: "Liz",
      };
      await cloudinary.uploadScrappedPictures(imagesData);
    });

    res.status(200).json({ message: "Images Stored All to sana only for now" });
  } catch (error) {
    res.status(500).json({ error });
    throw error;
  }
}

async function getActorInfo(req, res) {
  try {
    const actor = await apify_client.actor("apify/instagram-scraper").get();
    res.status(200).json(actor);
    console.log(actor); // Get actor metadata
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

async function runActor(req, res) {
  try {
    const username = req.body.username;

    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({
        message: "username is required",
      });
    }

    const result = await apifyService.scrapeAndStoreUsernames([username]);

    if (!result.found) {
      return res.status(404).json({
        message: result.message,
      });
    }

    if (result.insertedCount > 0 || (result.updatedCount ?? 0) > 0) {
      igPostEvents.emitIgPostsUpdated(req.user?.userId, {
        insertedCount: result.insertedCount,
        updatedCount: result.updatedCount ?? 0,
        username: result.usernames[0],
      });
    }

    return res.status(200).json({
      message: result.message ?? "Success",
      insertedCount: result.insertedCount,
      updatedCount: result.updatedCount ?? 0,
      skippedDuplicateCount: result.skippedDuplicateCount ?? 0,
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function refreshActors(req, res) {
  try {
    const userId = req.user?.userId;
    const result = await igUsernameService.listIgUsernames(userId);

    if (result.notFound) {
      return res.status(404).json({ message: "User not found" });
    }

    const usernames = Array.isArray(result.data)
      ? result.data
          .map((entry) => entry?.igUsername)
          .filter((value) => typeof value === "string" && value.trim())
      : [];

    if (usernames.length === 0) {
      return res.status(404).json({ message: "No ig usernames configured" });
    }

    const scrapeResult = await apifyService.scrapeAndStoreUsernames(usernames);

    if (!scrapeResult.found) {
      return res.status(200).json({
        message: scrapeResult.message || "Failed to scrub any new posts",
        skippedUsernames: usernames,
      });
    }

    if (scrapeResult.insertedCount > 0 || (scrapeResult.updatedCount ?? 0) > 0) {
      igPostEvents.emitIgPostsUpdated(userId, {
        insertedCount: scrapeResult.insertedCount,
        updatedCount: scrapeResult.updatedCount ?? 0,
        usernames: scrapeResult.usernames,
      });
    }

    return res.status(200).json({
      message: "Refresh complete",
      insertedCount: scrapeResult.insertedCount,
      updatedCount: scrapeResult.updatedCount ?? 0,
      refreshedUsernames: scrapeResult.usernames,
      skippedDuplicateCount: scrapeResult.skippedDuplicateCount ?? 0,
      skippedUsernames: [],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function getDataset(req, res) {
  try {
    const { items } = await apify_client.dataset(req.body.runID).listItems();
    // console.log(items);
    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json(error);
    console.log(error);
    throw error;
  }
}

module.exports = { getScrappedPictures, getActorInfo, getDataset, runActor, refreshActors };
