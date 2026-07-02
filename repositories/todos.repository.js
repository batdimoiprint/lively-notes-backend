const client = require("../db/db.js");
const {
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLES } = require("../db/dynamo.js");
const {
  readsFromDynamo,
  newId,
  toMongoId,
  bestEffortDynamo,
  fromDynamoItems,
  toIso,
} = require("./repository.util.js");

const myDB = client.db("livelydesktopnotes");
const todosCollection = myDB.collection("todos");

async function getAll() {
  if (readsFromDynamo()) {
    const { Items } = await docClient.send(
      new ScanCommand({ TableName: TABLES.todos })
    );
    // createdAt is an ISO string in DynamoDB, so string compare sorts correctly.
    return fromDynamoItems(Items).sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );
  }
  const cursor = todosCollection.find({}).sort({ createdAt: -1 });
  return cursor.toArray();
}

async function create(payload) {
  const _id = newId();
  const todo = {
    text: payload.text,
    completed: false,
    createdAt: new Date(),
  };
  await todosCollection.insertOne({ _id, ...todo });

  await bestEffortDynamo("todos.create", () =>
    docClient.send(
      new PutCommand({
        TableName: TABLES.todos,
        Item: { id: _id, ...todo, createdAt: toIso(todo.createdAt) },
      })
    )
  );

  return { _id, ...todo };
}

async function remove(id) {
  const result = await todosCollection.deleteOne({ _id: toMongoId(id) });

  if (result.deletedCount > 0) {
    await bestEffortDynamo("todos.remove", () =>
      docClient.send(
        new DeleteCommand({ TableName: TABLES.todos, Key: { id } })
      )
    );
  }

  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
  };
}

async function update(id, fields) {
  const result = await todosCollection.updateOne(
    { _id: toMongoId(id) },
    { $set: fields }
  );

  await bestEffortDynamo("todos.update", async () => {
    const names = {};
    const values = {};
    const sets = [];
    Object.entries(fields).forEach(([key, value], i) => {
      names[`#f${i}`] = key;
      values[`:v${i}`] = value;
      sets.push(`#f${i} = :v${i}`);
    });
    if (sets.length === 0) return;

    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.todos,
        Key: { id },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  });

  return {
    acknowledged: result.acknowledged,
    modified: result.modifiedCount,
  };
}

module.exports = {
  getAll,
  create,
  remove,
  update,
};
