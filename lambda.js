const serverless = require("serverless-http");
const app = require("./server.js");

const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  // EventBridge cron trigger
  if (event.source === "aws.events") {
    console.log("Cron triggered at", new Date().toISOString());
    // call your logic here directly
    // example: await getSettings()
    return { statusCode: 200, body: "Cron ran successfully" };
  }

  // API Gateway trigger — unchanged
  return serverlessHandler(event, context);
};