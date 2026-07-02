const igPostEvents = require("../service/igpost.events");
const igPostsRepository = require("../repositories/igPosts.repository.js");
const userRepository = require("../repositories/user.repository.js");
const { isValidId } = require("../repositories/repository.util.js");
const axios = require("axios");
const JSZip = require("jszip");

async function returnOneRandomPost(req, res) {
    try {
        const userId = req.user?.userId;
        if (!isValidId(userId)) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const user = await userRepository.getById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const usernames = Array.isArray(user.igUsernames)
            ? user.igUsernames.map((entry) => entry?.igUsername).filter(Boolean)
            : [];

        if (usernames.length === 0) {
            return res.status(404).json({ message: "No ig usernames configured" });
        }

        const data = await igPostsRepository.getByUsernames(usernames);

        if (data.length === 0) {
            return res.status(404).json({ message: "No posts found for saved ig usernames" });
        }

        const randomPost = data[Math.floor(Math.random() * data.length)];
        return res.status(200).json(randomPost);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

async function getIdolPosts(req, res) {
    try {
        const userId = req.user?.userId;
        if (!isValidId(userId)) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const user = await userRepository.getById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const usernames = Array.isArray(user.igUsernames)
            ? user.igUsernames.map((entry) => entry?.igUsername).filter(Boolean)
            : [];

        if (usernames.length === 0) {
            return res.status(200).json([]);
        }

        const postsByUsername = await Promise.all(
            usernames.map(async (username) => {
                const posts = await igPostsRepository.getByUsername(username);

                if (posts.length === 0) {
                    return null;
                }

                const randomPost = posts[Math.floor(Math.random() * posts.length)];
                return randomPost;
            }),
        );

        const idolPosts = postsByUsername.filter(Boolean);
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        return res.status(200).json(idolPosts);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

async function getNewestIdolPosts(req, res) {
    try {
        const userId = req.user?.userId;
        if (!isValidId(userId)) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const user = await userRepository.getById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const usernames = Array.isArray(user.igUsernames)
            ? user.igUsernames.map((entry) => entry?.igUsername).filter(Boolean)
            : [];

        if (usernames.length === 0) {
            return res.status(200).json([]);
        }

        const postsByUsername = await Promise.all(
            usernames.map((username) =>
                igPostsRepository.getNewestByUsername(username),
            ),
        );

        const newestPosts = postsByUsername.filter(Boolean);
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        return res.status(200).json(newestPosts);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

async function getRandomPostByUsername(req, res) {
    try {
        const username = req.params.username;
        if (!username) {
            return res.status(400).json({ message: "Username required" });
        }

        const posts = await igPostsRepository.getByUsername(username);

        if (posts.length === 0) {
            return res.status(404).json({ message: "No posts found for this username" });
        }

        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        return res.status(200).json(randomPost);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

async function streamIgPostsUpdates(req, res) {
    try {
        const userId = req.user?.userId;

        if (!isValidId(userId)) {
            return res.status(400).json({ message: "Invalid user" });
        }

        igPostEvents.registerIgPostsStream(userId, res);

        req.on("close", () => {
            if (!res.writableEnded) {
                res.end();
            }
        });

        return undefined;
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}


async function downloadImages(req, res) {
    try {
        const userId = req.user?.userId;
        if (!isValidId(userId)) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const { publicIds, postId } = req.body;
        if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
            return res.status(400).json({ message: "No images provided" });
        }

        // Get post info for filename
        const post = await igPostsRepository.getById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const username = post.ownerUsername || "unknown";

        // If single image, download directly
        if (publicIds.length === 1) {
            try {
                const cloudinaryUrl = `https://res.cloudinary.com/${process.env.VITE_CLOUDINARY}/image/upload/${publicIds[0]}.jpg`;
                const response = await axios.get(cloudinaryUrl, { responseType: "arraybuffer" });

                res.setHeader("Content-Type", "image/jpeg");
                res.setHeader("Content-Disposition", `attachment; filename="${username}-image.jpg"`);
                return res.send(response.data);
            } catch (error) {
                return res.status(500).json({ message: "Failed to download image", error: error.message });
            }
        }

        // Multiple images - create ZIP
        const zip = new JSZip();

        for (let i = 0; i < publicIds.length; i++) {
            try {
                const cloudinaryUrl = `https://res.cloudinary.com/${process.env.VITE_CLOUDINARY}/image/upload/${publicIds[i]}.jpg`;
                const response = await axios.get(cloudinaryUrl, { responseType: "arraybuffer" });
                zip.file(`${username}-${i + 1}.jpg`, response.data);
            } catch (error) {
                console.error(`Failed to download image ${i + 1}:`, error.message);
            }
        }

        const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", `attachment; filename="${username}-images.zip"`);
        return res.send(zipBuffer);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = { returnOneRandomPost, getIdolPosts, getNewestIdolPosts, getRandomPostByUsername, streamIgPostsUpdates, downloadImages };
