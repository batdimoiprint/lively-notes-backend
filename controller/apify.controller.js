const apify_api = require("../api/axiosInstance");
const cloudinary = require("./cloudinary.controller");

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

module.exports = { getScrappedPictures };
