// Single home for the Instagram scrape-and-store pipeline. The Express
// controller (controller/apify.controller.js) and the EventBridge cron
// (lambda.js → refreshAllUsers) both call scrapeAndStoreUsernames — the logic
// used to be duplicated across both files.
const apify_client = require("../config/apify.client");
const cloudinary = require("../controller/cloudinary.controller");
const igPostEvents = require("./igpost.events");
const igUsernameService = require("./igusername.service");
const igPostsRepository = require("../repositories/igPosts.repository.js");
const userRepository = require("../repositories/user.repository.js");

const APIFY_ACTOR_ID = "apify/instagram-scraper";

function buildInstagramProfileUrl(username) {
  return `https://www.instagram.com/${username}/`;
}

async function runInstagramActor(usernames, options = {}) {
  const urls = usernames.map(buildInstagramProfileUrl);

  return apify_client.actor(APIFY_ACTOR_ID).call({
    addParentData: false,
    directUrls: urls,
    onlyPostsNewerThan: options.onlyPostsNewerThan ?? "1 week",
    ...(options.resultsLimit ? { resultsLimit: options.resultsLimit } : {}),
    resultsType: "posts",
    searchType: "user",
  });
}

async function getActorItems(datasetId) {
  const { items = [] } = await apify_client.dataset(datasetId).listItems();
  return items;
}

function mapActorItems(items) {
  return items
    .filter(
      (item) =>
        item &&
        !item.message && // drop error objects like { message: "ERR_CONNECT_FAIL ..." }
        item.id &&
        item.url &&
        item.ownerUsername,
    )
    .map((item) => ({
      postID: item.id,
      caption: item.caption,
      url: item.url,
      likesCount: item.likesCount,
      ownerUsername: item.ownerUsername,
      images: Array.isArray(item.images) ? item.images : [],
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

async function scrapeAndStoreUsernames(usernames, options = {}) {
  const normalizedUsernames = (Array.isArray(usernames) ? usernames : [usernames])
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());

  if (normalizedUsernames.length === 0) {
    return {
      found: false,
      message: "At least one valid username is required",
    };
  }

  const usernameSet = new Set(normalizedUsernames.map((u) => u.toLowerCase()));

  const run = await runInstagramActor(normalizedUsernames, options);
  const items = await getActorItems(run.defaultDatasetId);

  if (!Array.isArray(items) || items.length === 0) {
    return {
      found: false,
      message: "No posts were returned for these usernames",
      usernames: normalizedUsernames,
    };
  }

  const filtered = mapActorItems(items).filter((post) => {
    const owner = typeof post.ownerUsername === "string" ? post.ownerUsername.trim() : "";
    return owner && usernameSet.has(owner.toLowerCase());
  });
  if (!Array.isArray(filtered) || filtered.length === 0) {
    return {
      found: false,
      message: "No valid posts to process for these usernames",
      usernames: normalizedUsernames,
    };
  }

  const uniquePosts = dedupePostsByUrl(filtered);
  const existingUrls = await igPostsRepository.getExistingUrls(
    uniquePosts.map((post) => post.url),
  );
  const duplicatePosts = uniquePosts.filter((post) => existingUrls.has(post.url));
  const newPosts = uniquePosts.filter((post) => !existingUrls.has(post.url));

  const { updatedCount } = await igPostsRepository.updateLikesCounts(duplicatePosts);

  if (newPosts.length === 0) {
    return {
      found: true,
      usernames: normalizedUsernames,
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
      usernames: normalizedUsernames,
    };
  }

  await igPostsRepository.insertPosts(postsWithCloudinary);

  return {
    found: true,
    usernames: normalizedUsernames,
    insertedCount: postsWithCloudinary.length,
    updatedCount,
    skippedDuplicateCount: duplicatePosts.length,
    data: postsWithCloudinary,
  };
}

async function refreshAllUsers() {
  try {
    const users = await userRepository.getAllUsers();
    console.log(`Starting refresh for ${users.length} users...`);

    for (const user of users) {
      const userId = String(user._id);
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
            // The cron runs daily, so scrape one username at a time with a
            // tight window (same knobs the old cron-only implementation used).
            const scrapeResult = await scrapeAndStoreUsernames([username], {
              onlyPostsNewerThan: "1 day",
              resultsLimit: 1,
            });

            if (!scrapeResult.found) {
              console.log(`Couldn't find/store posts for ${username}: ${scrapeResult.message}`);
              continue;
            }

            refreshedUsernames.push(...scrapeResult.usernames);
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
  scrapeAndStoreUsernames,
  refreshAllUsers,
};
