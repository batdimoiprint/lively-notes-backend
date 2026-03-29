const client = require("../db/db.js");
const { ObjectId } = require("mongodb");
const igPostEvents = require("../service/igpost.events");
const myDB = client.db("livelydesktopnotes");
const ig_posts_collection = myDB.collection("ig_posts");
const userCollection = myDB.collection("user");

async function returnOneRandomPost(req, res) {
    try {
        const userId = req.user?.userId;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const user = await userCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const usernames = Array.isArray(user.igUsernames)
            ? user.igUsernames.map((entry) => entry?.igUsername).filter(Boolean)
            : [];

        if (usernames.length === 0) {
            return res.status(404).json({ message: "No ig usernames configured" });
        }

        const data = await ig_posts_collection
            .find({ ownerUsername: { $in: usernames } })
            .toArray();

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
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const user = await userCollection.findOne({ _id: new ObjectId(userId) });
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
                const posts = await ig_posts_collection
                    .find({ ownerUsername: username })
                    .toArray();

                if (posts.length === 0) {
                    return null;
                }

                const randomPost = posts[Math.floor(Math.random() * posts.length)];
                return randomPost;
            }),
        );

        const idolPosts = postsByUsername.filter(Boolean);
        return res.status(200).json(idolPosts);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

async function getNewestIdolPosts(req, res) {
    try {
        const userId = req.user?.userId;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user" });
        }

        const user = await userCollection.findOne({ _id: new ObjectId(userId) });
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
                const posts = await ig_posts_collection
                    .find({ ownerUsername: username })
                    .sort({ _id: -1 })
                    .limit(1)
                    .toArray();

                if (posts.length === 0) {
                    return null;
                }

                return posts[0];
            }),
        );

        const newestPosts = postsByUsername.filter(Boolean);
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

        const posts = await ig_posts_collection
            .find({ ownerUsername: username })
            .toArray();

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

        if (!ObjectId.isValid(userId)) {
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


module.exports = { returnOneRandomPost, getIdolPosts, getNewestIdolPosts, getRandomPostByUsername, streamIgPostsUpdates };