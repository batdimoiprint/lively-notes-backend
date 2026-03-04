const apify_api = require("../api/axiosInstance");
const apify_client = require("../config/apify.client");
const cloudinary = require("./cloudinary.controller");
const client = require("../db/db.js");
const myDB = client.db("livelydesktopnotes");
const ig_posts_collection = myDB.collection("ig_posts");

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

    const run = await apify_client.actor("apify/instagram-scraper").call({
      addParentData: false,
      directUrls: [`https://www.instagram.com/${username}/`],
      onlyPostsNewerThan: "1 month",
      resultsLimit: 1,
      resultsType: "posts",
      searchType: "user",
    });
    // Debug
    console.log(run)
    const { items } = await apify_client
      .dataset(run.defaultDatasetId)
      .listItems();

    const filtered = items.map((item) => ({
      postID: item.id,
      caption: item.caption,
      url: item.url,
      likesCount: item.likesCount,
      ownerUsername: item.ownerUsername,
      images: item.images,
    }));
    // Debug
    console.log(filtered)

    // Add Prefix to the folder name soon
    const postsWithCloudinary = await Promise.all(
      filtered.map(async (post) => {
        const cloudinaryPics = await Promise.all(
          post.images.map(async (imgUrl) => {
            const result = await cloudinary.uploadScrappedPictures({
              image: imgUrl,
              folder: post.ownerUsername + "-" + post.postID,
            });
            return {
              public_id: result.public_id,
              secure_url: result.secure_url,
            };
          }),
        );
        // Return a new object for MongoDB, without the original images array
        const { images, ...rest } = post;
        return { ...rest, cloudinaryPics };
      }),
    );

    console.log(postsWithCloudinary)

    // Now insert all posts at once
    await ig_posts_collection.insertMany(postsWithCloudinary);

    console.log(postsWithCloudinary);
    res.status(200).json({
      message: "Success",
      url: postsWithCloudinary.url,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
