const aws = require('aws-sdk')
const docClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'})
const DYNAMO_TABLE_NAME = 'rfa-logs'

async function putResultToDynamoDB({userName, imageUrl, results}) {
  const params = {
    TableName: DYNAMO_TABLE_NAME,
    Key: { userName },
    Item: {
      userName,
      results: {
        updatedAt: (new Date()).toISOString(),
        lastImageUrl: imageUrl,
        ...results,
      }
    }
  }
  console.log(params)
  return docClient.put(params).promise()
}

module.exports.index = async event => {
  const { userName, imageUrl, results } = event
  await putResultToDynamoDB({userName, imageUrl, results})
}