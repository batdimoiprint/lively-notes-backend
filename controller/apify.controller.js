const apify_api = require("../api/axiosInstance");
const apify_client = require("../config/apify.client");
const cloudinary = require("./cloudinary.controller");
const igPostEvents = require("../service/igpost.events");
const client = require("../db/db.js");
const myDB = client.db("livelydesktopnotes");
const ig_posts_collection = myDB.collection("ig_posts");

const APIFY_ACTOR_ID = "apify/instagram-scraper";

function buildInstagramProfileUrl(username) {
  return `https://www.instagram.com/${username}/`;
}

async function runInstagramActor(username) {
  return apify_client.actor(APIFY_ACTOR_ID).call({
    addParentData: false,
    directUrls: [buildInstagramProfileUrl(username)],
    onlyPostsNewerThan: "1 week",
    resultsLimit: 1,
    resultsType: "posts",
    searchType: "user",
  });
}

async function getActorItems(datasetId) {
  const { items = [] } = await apify_client.dataset(datasetId).listItems();
  return items;
}

function mapActorItems(items) {
  return items.map((item) => ({
    postID: item.id,
    caption: item.caption,
    url: item.url,
    likesCount: item.likesCount,
    ownerUsername: item.ownerUsername,
    images: item.images ?? [],
  }));
}

async function uploadPostToCloudinary(post) {
  const cloudinaryPics = await Promise.all(
    post.images.map(async (imgUrl) => {
      const result = await cloudinary.uploadScrappedPictures({
        image: imgUrl,
        folder: `${post.ownerUsername}-${post.postID}`,
      });

      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    }),
  );

  const { images, ...rest } = post;
  return { ...rest, cloudinaryPics };
}

async function persistPosts(posts) {
  if (posts.length === 0) {
    return { insertedCount: 0 };
  }

  return ig_posts_collection.insertMany(posts);
}

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
    res.status(500).json(actor);
    console.log(error);
    throw error;
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

    const run = await runInstagramActor(username.trim());
    const items = await getActorItems(run.defaultDatasetId);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(404).json({
        message: "No posts were returned for this username",
      });
    }

    // Only proceed if items is non-empty
    const filtered = mapActorItems(items);
    if (!Array.isArray(filtered) || filtered.length === 0) {
      return res.status(404).json({
        message: "No valid posts to process for this username",
      });
    }

    const postsWithCloudinary = await Promise.all(
      filtered.map(uploadPostToCloudinary),
    );

    if (!Array.isArray(postsWithCloudinary) || postsWithCloudinary.length === 0) {
      return res.status(404).json({
        message: "No posts to store after Cloudinary upload",
      });
    }

    await persistPosts(postsWithCloudinary);

    igPostEvents.emitIgPostsUpdated(req.user?.userId, {
      insertedCount: postsWithCloudinary.length,
      username,
    });

    return res.status(200).json({
      message: "Success",
      insertedCount: postsWithCloudinary.length,
      data: postsWithCloudinary,
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

module.exports = { getScrappedPictures, getActorInfo, getDataset, runActor };
