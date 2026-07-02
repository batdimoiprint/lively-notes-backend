const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Table names come from env (set in .env.local and on the Lambda);
// the fallbacks match the tables provisioned in ap-southeast-1.
const TABLES = {
  notes: process.env.DDB_TABLE_NOTES || "lively-notes-notes",
  sections: process.env.DDB_TABLE_SECTIONS || "lively-notes-sections",
  todos: process.env.DDB_TABLE_TODOS || "lively-notes-todos",
  calendarNotes: process.env.DDB_TABLE_CALENDAR_NOTES || "lively-notes-calendar-notes",
  settings: process.env.DDB_TABLE_SETTINGS || "lively-notes-settings",
  pushSubscriptions: process.env.DDB_TABLE_PUSH_SUBSCRIPTIONS || "lively-notes-push-subscriptions",
  igPosts: process.env.DDB_TABLE_IG_POSTS || "lively-notes-ig-posts",
  user: process.env.DDB_TABLE_USER || "lively-notes-user",
};

module.exports = { docClient, TABLES };
