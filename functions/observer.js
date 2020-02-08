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
async function fetchCompletedUrls({ userName }) {
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
async function insertLog({ userName, newUrls }) {
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

/*
 * 画像の解析処理をトリガーする
*/
async function run({ url, userName }) {
  await lambda.invoke({
    FunctionName: 'sasaki-rfa-logs-dev-imageCreator',
    Payload: JSON.stringify({url, userName}) // pass params
  }).promise()
}

module.exports.index = async event => {
  const userName = event.userName || 'Sa2Knight'

  // 実施済みのURL一覧を取得する
  const completedUrls = await fetchCompletedUrls({ userName })
  console.log({ completedUrls })
  console.log({ completedUrlsCount: completedUrls.count })

  // Twitterから最近のURL一覧を取得する
  const recentUrls = await fetchRecentUrls()
  console.log({ recentUrls })
  console.log({ recentUrlsCount: recentUrls.count })

  // マージして、未実行のURLを抽出する
  const  executingUrls = recentUrls.filter(url => !completedUrls.includes(url))
  console.log({ executingUrls })
  console.log({ executingUrlsCount: executingUrls.count })

  // それぞれ実行する
  await Promise.all(executingUrls.map((url) => run({ url, userName })))

  // 実行ログを更新する
  await insertLog({ newUrls: completedUrls.concat(executingUrls), userName })

  return { statusCode: 200 }
}