const client = require("../db/db.js");
const {
  ScanCommand,
  QueryCommand,
  UpdateCommand,
  BatchGetCommand,
  BatchWriteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLES } = require("../db/dynamo.js");
const {
  readsFromDynamo,
  newId,
  toMongoId,
  bestEffortDynamo,
  fromDynamoItem,
  fromDynamoItems,
  toIso,
  chunk,
} = require("./repository.util.js");

const myDB = client.db("livelydesktopnotes");
const igPostsCollection = myDB.collection("ig_posts");

// DynamoDB PK is the post url (the natural dedup key); the shared document id
// is carried in the "id" attribute. createdAt is a new explicit field that
// replaces the old sort({_id: -1})-as-latest trick, so it MUST be set on every
// insert or the item is invisible to the owner-createdAt-index GSI.

async function queryByUsername(username, { newestOnly = false } = {}) {
  const { Items } = await docClient.send(
    new QueryCommand({
      TableName: TABLES.igPosts,
      IndexName: "owner-createdAt-index",
      KeyConditionExpression: "#owner = :owner",
      ExpressionAttributeNames: { "#owner": "ownerUsername" },
      ExpressionAttributeValues: { ":owner": username },
      ...(newestOnly ? { ScanIndexForward: false, Limit: 1 } : {}),
    })
  );
  return fromDynamoItems(Items);
}

async function getByUsername(username) {
  if (readsFromDynamo()) {
    return queryByUsername(username);
  }
  return igPostsCollection.find({ ownerUsername: username }).toArray();
}

async function getByUsernames(usernames) {
  if (readsFromDynamo()) {
    const results = await Promise.all(
      usernames.map((username) => queryByUsername(username))
    );
    return results.flat();
  }
  return igPostsCollection
    .find({ ownerUsername: { $in: usernames } })
    .toArray();
}

async function getNewestByUsername(username) {
  if (readsFromDynamo()) {
    const posts = await queryByUsername(username, { newestOnly: true });
    return posts[0] || null;
  }
  const posts = await igPostsCollection
    .find({ ownerUsername: username })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();
  return posts[0] || null;
}

async function getById(id) {
  if (readsFromDynamo()) {
    // The table is keyed by url, not id; a filtered scan is fine at this
    // table's size (rare call, small dataset).
    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: TABLES.igPosts,
        FilterExpression: "#id = :id",
        ExpressionAttributeNames: { "#id": "id" },
        ExpressionAttributeValues: { ":id": String(id) },
      })
    );
    return fromDynamoItem((Items || [])[0]);
  }
  return igPostsCollection.findOne({ _id: toMongoId(id) });
}

async function getExistingUrls(urls) {
  const uniqueUrls = Array.from(
    new Set(
      urls
        .filter((value) => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
  if (uniqueUrls.length === 0) {
    return new Set();
  }

  if (readsFromDynamo()) {
    const found = new Set();
    for (const batch of chunk(uniqueUrls, 100)) {
      const { Responses } = await docClient.send(
        new BatchGetCommand({
          RequestItems: {
            [TABLES.igPosts]: {
              Keys: batch.map((url) => ({ url })),
              ProjectionExpression: "#u",
              ExpressionAttributeNames: { "#u": "url" },
            },
          },
        })
      );
      for (const item of Responses?.[TABLES.igPosts] || []) {
        if (typeof item.url === "string" && item.url.trim()) {
          found.add(item.url);
        }
      }
    }
    return found;
  }

  const existingPosts = await igPostsCollection
    .find({ url: { $in: uniqueUrls } }, { projection: { url: 1, _id: 0 } })
    .toArray();
  return new Set(
    existingPosts
      .map((post) => post?.url)
      .filter((value) => typeof value === "string" && value.trim())
  );
}

async function insertPosts(posts) {
  if (posts.length === 0) {
    return { insertedCount: 0 };
  }

  const now = new Date();
  const docs = posts.map((post) => ({ _id: newId(), createdAt: now, ...post }));
  await igPostsCollection.insertMany(docs);

  await bestEffortDynamo("igPosts.insertPosts", async () => {
    const items = docs.map(({ _id, createdAt, ...rest }) => ({
      id: _id,
      createdAt: toIso(createdAt),
      ...rest,
    }));
    for (const batch of chunk(items, 25)) {
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLES.igPosts]: batch.map((Item) => ({ PutRequest: { Item } })),
          },
        })
      );
    }
  });

  return { insertedCount: docs.length };
}

async function updateLikesCounts(posts) {
  if (posts.length === 0) {
    return { updatedCount: 0 };
  }

  const updateResults = await Promise.all(
    posts.map((post) =>
      igPostsCollection.updateOne(
        { url: post.url },
        { $set: { likesCount: post.likesCount } }
      )
    )
  );

  await bestEffortDynamo("igPosts.updateLikesCounts", () =>
    Promise.all(
      posts.map((post) =>
        docClient
          .send(
            new UpdateCommand({
              TableName: TABLES.igPosts,
              Key: { url: post.url },
              UpdateExpression: "SET likesCount = :likes",
              ConditionExpression: "attribute_exists(#u)",
              ExpressionAttributeNames: { "#u": "url" },
              ExpressionAttributeValues: { ":likes": post.likesCount },
            })
          )
          .catch((err) => {
            console.error(
              `[dynamo-write-failed] igPosts.updateLikesCounts(${post.url}):`,
              err.message
            );
          })
      )
    )
  );

  return {
    updatedCount: updateResults.reduce(
      (count, result) => count + (result.modifiedCount ?? 0),
      0
    ),
  };
}

module.exports = {
  getByUsername,
  getByUsernames,
  getNewestByUsername,
  getById,
  getExistingUrls,
  insertPosts,
  updateLikesCounts,
};
