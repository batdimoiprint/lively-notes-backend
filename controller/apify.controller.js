const apify_api = require("../api/axiosInstance");
const apify_client = require("../config/apify.client");
const cloudinary = require("./cloudinary.controller");
const igPostEvents = require("../service/igpost.events");
const igUsernameService = require("../service/igusername.service");
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
    onlyPostsNewerThan: "1 day",
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

async function updateExistingPostLikesCounts(posts) {
  if (posts.length === 0) {
    return { updatedCount: 0 };
  }

  const updateResults = await Promise.all(
    posts.map((post) =>
      ig_posts_collection.updateOne(
        { url: post.url },
        { $set: { likesCount: post.likesCount } },
      ),
    ),
  );

  return {
    updatedCount: updateResults.reduce(
      (count, result) => count + (result.modifiedCount ?? 0),
      0,
    ),
  };
}

async function getExistingPostUrls(urls) {
  const uniqueUrls = Array.from(
    new Set(
      urls
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  if (uniqueUrls.length === 0) {
    return new Set();
  }

  const existingPosts = await ig_posts_collection
    .find(
      { url: { $in: uniqueUrls } },
      { projection: { url: 1, _id: 0 } },
    )
    .toArray();

  return new Set(
    existingPosts
      .map((post) => post?.url)
      .filter((value) => typeof value === "string" && value.trim()),
  );
}

function dedupePostsByUrl(posts) {
  const seenUrls = new Set();

  return posts.filter((post) => {
    const url = typeof post?.url === "string" ? post.url.trim() : "";

    if (!url || seenUrls.has(url)) {
      return false;
    }

    seenUrls.add(url);
    return true;
  });
}

async function scrapeAndStoreUsername(username) {
  const normalizedUsername = typeof username === "string" ? username.trim() : "";

  if (!normalizedUsername) {
    return {
      found: false,
      message: "username is required",
    };
  }

  const run = await runInstagramActor(normalizedUsername);
  const items = await getActorItems(run.defaultDatasetId);

  if (!Array.isArray(items) || items.length === 0) {
    return {
      found: false,
      message: "No posts were returned for this username",
      username: normalizedUsername,
    };
  }

  const filtered = mapActorItems(items);
  if (!Array.isArray(filtered) || filtered.length === 0) {
    return {
      found: false,
      message: "No valid posts to process for this username",
      username: normalizedUsername,
    };
  }

  const uniquePosts = dedupePostsByUrl(filtered);
  const existingUrls = await getExistingPostUrls(uniquePosts.map((post) => post.url));
  const duplicatePosts = uniquePosts.filter((post) => existingUrls.has(post.url));
  const newPosts = uniquePosts.filter((post) => !existingUrls.has(post.url));

  const { updatedCount } = await updateExistingPostLikesCounts(duplicatePosts);

  if (newPosts.length === 0) {
    return {
      found: true,
      username: normalizedUsername,
      insertedCount: 0,
      updatedCount,
      skippedDuplicateCount: duplicatePosts.length,
      data: [],
      message: duplicatePosts.length > 0 ? "Existing posts updated" : "No new posts to store",
    };
  }

  const postsWithCloudinary = await Promise.all(
    newPosts.map(uploadPostToCloudinary),
  );

  if (!Array.isArray(postsWithCloudinary) || postsWithCloudinary.length === 0) {
    return {
      found: false,
      message: "No posts to store after Cloudinary upload",
      username: normalizedUsername,
    };
  }

  await persistPosts(postsWithCloudinary);

  return {
    found: true,
    username: normalizedUsername,
    insertedCount: postsWithCloudinary.length,
    updatedCount,
    skippedDuplicateCount: duplicatePosts.length,
    data: postsWithCloudinary,
  };
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

    const result = await scrapeAndStoreUsername(username);

    if (!result.found) {
      return res.status(404).json({
        message: result.message,
      });
    }

    if (result.insertedCount > 0 || (result.updatedCount ?? 0) > 0) {
      igPostEvents.emitIgPostsUpdated(req.user?.userId, {
        insertedCount: result.insertedCount,
        updatedCount: result.updatedCount ?? 0,
        username: result.username,
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

    const refreshedUsernames = [];
    const skippedUsernames = [];
    let insertedCount = 0;
    let updatedCount = 0;

    for (const username of usernames) {
      try {
        const scrapeResult = await scrapeAndStoreUsername(username);

        if (!scrapeResult.found) {
          skippedUsernames.push({
            username: scrapeResult.username ?? username,
            message: scrapeResult.message,
          });
          continue;
        }

        refreshedUsernames.push(scrapeResult.username);
        insertedCount += scrapeResult.insertedCount;
        updatedCount += scrapeResult.updatedCount ?? 0;
      } catch (error) {
        skippedUsernames.push({
          username,
          message: error.message,
        });
      }
    }

    if (insertedCount > 0 || updatedCount > 0) {
      igPostEvents.emitIgPostsUpdated(userId, {
        insertedCount,
        updatedCount,
        usernames: refreshedUsernames,
      });
    }

    return res.status(200).json({
      message: "Refresh complete",
      insertedCount,
      updatedCount,
      refreshedUsernames,
      skippedUsernames,
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
