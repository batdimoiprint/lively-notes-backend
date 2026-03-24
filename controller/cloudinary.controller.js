const cloudinary = require("../config/cloudinary.config");

function randomizer(id) {
  const randomId = Math.floor(Math.random() * id.length);
  return id[randomId];
}

const getAllImages = async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      //   prefix: "momo",
      max_results: 500,
    });
    const publicIds = result.resources.map((img) => img.public_id);
    res.json(publicIds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
};

const getImagesByFolder = async (req, res) => {
  const { folderName } = req.params;
  try {
    const result = await cloudinary.api.resources_by_asset_folder(folderName, {
      type: "upload",
      max_results: 500,
      direction: "desc",
    });

    const publicIds = result.resources.map(
      (img) => img.public_id,
      // console.log(img.created_at);
    );

    console.log(randomizer(publicIds));
    res.json(randomizer(publicIds));
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: `Failed to fetch images from folder: ${folderName}` });
  }
};

const uploadScrappedPictures = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.image, {
      folder: req.folder,
    });

    console.log(result.secure_url + result.public_id);
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const uploadSinglePicture = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    res.status(400).json({ error: "Image file is required" });
    return;
  }

  try {
    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "wallpapers",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    res.status(201).json({
      public_id: uploaded.public_id,
      secure_url: uploaded.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

const getSingleImageByFolder = async (req, res) => {
  try {
    const result = await cloudinary.api.resources_by_asset_folder("wallpapers", {
      type: "upload",
      max_results: 500,
      direction: "desc",
    });

    const publicIds = result.resources.map((img) => img.public_id);
    const chosenPublicId = randomizer(publicIds);

    if (!chosenPublicId) {
      res.status(404).json({ error: "No background image found in wallpapers folder" });
      return;
    }

    const chosenImage = result.resources.find((img) => img.public_id === chosenPublicId);

    res.status(200).json({
      public_id: chosenPublicId,
      secure_url: chosenImage?.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch background image" });
  }
};

module.exports = {
  getAllImages,
  getImagesByFolder,
  uploadScrappedPictures,
  uploadSinglePicture,
  getSingleImageByFolder,
};
