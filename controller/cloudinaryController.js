const cloudinary = require("../config/cloudinaryConfig");

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
    });
    const publicIds = result.resources.map((img) => img.public_id);
    res.json(publicIds);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: `Failed to fetch images from folder: ${folderName}` });
  }
};

module.exports = { getAllImages, getImagesByFolder };
