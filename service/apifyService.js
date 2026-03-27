const apify_client = require("../config/apify.client");
const cloudinary = require("../controller/cloudinary.controller");
const igPostEvents = require("../service/igpost.events");
const igUsernameService = require("../service/igusername.service");
const client = require("../db/db.js");
const myDB = client.db("livelydesktopnotes");
const ig_posts_collection = myDB.collection("ig_posts");
const userCollection = myDB.collection("user");

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

async function refreshAllUsers() {
  try {
    const users = await userCollection.find({}).toArray();
    console.log(`Starting refresh for ${users.length} users...`);

    for (const user of users) {
      const userId = user._id.toString();
      console.log(`Processing user: ${userId}`);

      try {
        const result = await igUsernameService.listIgUsernames(userId);
        
        if (result.notFound || !result.data || result.data.length === 0) {
          console.log(`No usernames configured for user: ${userId}`);
          continue;
        }

        const usernames = result.data
          .map((entry) => entry?.igUsername)
          .filter((value) => typeof value === "string" && value.trim());

        if (usernames.length === 0) {
          console.log(`No valid usernames for user: ${userId}`);
          continue;
        }

        const refreshedUsernames = [];
        let totalInsertedCount = 0;
        let totalUpdatedCount = 0;

        for (const username of usernames) {
          try {
            console.log(`Scraping username: ${username} for user: ${userId}`);
            const scrapeResult = await scrapeAndStoreUsername(username);

            if (!scrapeResult.found) {
              console.log(`Couldn't find/store posts for ${username}: ${scrapeResult.message}`);
              continue;
            }

            refreshedUsernames.push(scrapeResult.username);
            totalInsertedCount += scrapeResult.insertedCount || 0;
            totalUpdatedCount += scrapeResult.updatedCount || 0;
            
          } catch (error) {
            console.error(`Error scraping ${username} for user ${userId}:`, error.message);
          }
        }

        if (totalInsertedCount > 0 || totalUpdatedCount > 0) {
          igPostEvents.emitIgPostsUpdated(userId, {
            insertedCount: totalInsertedCount,
            updatedCount: totalUpdatedCount,
            usernames: refreshedUsernames,
          });
          console.log(`Success processing user ${userId}: inserted ${totalInsertedCount}, updated ${totalUpdatedCount} for ${refreshedUsernames.join(", ")}`);
        } else {
          console.log(`Processed user ${userId} but no new or updated posts.`);
        }

      } catch (err) {
        console.error(`Error processing user ${userId}:`, err.message);
      }
    }
    
    console.log("Finished refreshAllUsers cron execution.");
  } catch (globalErr) {
    console.error("Global error in refreshAllUsers:", globalErr.message);
  }
}

module.exports = {
  refreshAllUsers
};
