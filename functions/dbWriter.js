const aws = require("aws-sdk");
const dynamoClient = new aws.DynamoDB.DocumentClient({
  region: "ap-northeast-1",
});

function originUrl(url) {
  return url.substr(0, url.lastIndexOf("/")) + "/origin.jpeg";
}

function mergeResults({ currentResults, newResults }) {
  const mergedResults = {};

  Object.keys(currentResults).forEach((key) => {
    if (!newResults[key]) return;
    if (newResults[key].value >= currentResults[key].value) {
      console.log("現在の記録より小さな値を検出");
      console.log({ key, result: newResults[key].value });
      return;
    }
    if (newResults[key].value - currentResults[key].value > 300) {
      console.log("現在の記録よりも極端に大きな値を検出");
      console.log({ key, result: newResults[key].value });
      return;
    }
    console.log(`更新成功: ${newResults[key]}`);
    mergedResults[key] = newResults[key];
  });

  return mergedResults;
}

async function fetchCurrentResult({ userName }) {
  const params = {
    TableName: "rfa-logs",
    Key: { userName },
  };
  const currentDoc = await dynamoClient.get(params).promise();
  if (currentDoc.hasOwnProperty("Item")) {
    return currentDoc.Item.results;
  } else {
    return {};
  }
}

async function updateResult({ userName, imageUrl, results }) {
  const currentResults = await fetchCurrentResult({ userName });
  const mergedResults = mergeResults({ currentResults, newResults: results });
  console.log({ mergedResults });

  const newDoc = await dynamoClient
    .update({
      TableName: "rfa-logs",
      Key: { userName },
      UpdateExpression: "set results = :r",
      ExpressionAttributeValues: {
        ":r": {
          ...currentResults,
          ...mergedResults,
        },
      },
      ReturnValues: "UPDATED_NEW",
    })
    .promise();
  return newDoc;
}

module.exports.index = async (event) => {
  const { userName, imageUrl, results } = event;
  console.log({ results });

  await updateResult({ userName, imageUrl, results });
};
