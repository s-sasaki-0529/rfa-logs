const aws = require('aws-sdk')
const lambda = new aws.Lambda()
const dynamoClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'})

/*
 * Twitterから直近の画像URL一覧を取得する
*/
async function fetchRecentUrls() {
  const result = await lambda.invoke({
    FunctionName: 'sasaki-rfa-logs-dev-tweetChecker',
  }).promise()
  return JSON.parse(result.Payload).urls
}

/*
 * 実行ログの一覧をDynamoから取得し、実行した元画像URLの一覧を戻す
*/
async function fetchLogs({userName}) {
  const params = {
    TableName: 'rfa-log-results',
    Key: { userName }
  }
  const currentDoc = await dynamoClient.get(params).promise()
  if (currentDoc.hasOwnProperty('Item')) {
    return currentDoc.Item.urls
  } else {
    return {}
  }
}

/*
 * 実行ログを挿入する
*/
async function insertLog({userName, url}) {
  const newUrls = await fetchLogs( { userName })
  newUrls.push(url)

  const newDoc = await dynamoClient.update({
    TableName: 'rfa-log-results',
    Key: { userName },
    UpdateExpression: 'set urls = :u',
    ExpressionAttributeValues: {
      ':u': newUrls
    },
    ReturnValues: 'UPDATED_NEW'
  }).promise()
  return newDoc
}

module.exports.index = async event => {
  const { url, userName } = event

  const result = await lambda.invoke({
    FunctionName: 'sasaki-rfa-logs-dev-imageCreator',
    Payload: JSON.stringify({url, userName}) // pass params
  }).promise()

  await insertLog({ userName, url })

  return {
    statusCode: 200
  }
}