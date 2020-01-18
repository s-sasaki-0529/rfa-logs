const aws = require('aws-sdk')
const dynamoClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'})
const DYNAMO_TABLE_NAME = 'rfa-logs'

async function fetchCurrentResult({userName}) {
  const params = {
    TableName: DYNAMO_TABLE_NAME,
    Key: { userName }
  }
  const currentDoc = await dynamoClient.get(params).promise()
  if (currentDoc.hasOwnProperty('Item')) {
    return currentDoc.Item.results
  } else {
    return {}
  }
}

module.exports.index = async (event, context, callback) => {
  console.log({ event })
  const userName = event.userName || event.queryStringParameters.userName
  console.log({ userName })

  const results = await fetchCurrentResult({ userName })
  console.log({ results })

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ results })
  })
}