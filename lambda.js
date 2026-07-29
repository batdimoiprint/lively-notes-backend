const serverless = require("serverless-http");
const app = require("./server.js");
const { refreshAllUsers } = require("./service/apifyService.js");

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  // EventBridge cron trigger
  if (event.source === "aws.events") {
    console.log("Cron triggered at", new Date().toISOString());
    await refreshAllUsers();
    return { statusCode: 200 };
  }

  // API Gateway trigger — unchanged
  return serverlessHandler(event, context);
};