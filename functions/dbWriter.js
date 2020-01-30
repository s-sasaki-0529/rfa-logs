const aws = require('aws-sdk')
const dynamoClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'})
const DYNAMO_TABLE_NAME = 'rfa-logs'

function mergeResults({currentResults, newResults}) {
  const mergedResults = {}

  Object.keys(currentResults).forEach((key) => {
    if (newResults[key] && newResults[key].value > currentResults[key].value) {
      console.log(`更新: ${newResults[key]}`)
      mergedResults[key] = newResults[key]
    } else {
      mergedResults[key] = currentResults[key]
    }
  })

  return mergedResults
}

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

async function updateResult({userName, imageUrl, results}) {
  const currentResults = await fetchCurrentResult({ userName })
  const newDoc = await dynamoClient.update({
    TableName: DYNAMO_TABLE_NAME,
    Key: { userName },
    UpdateExpression: 'set results = :r, meta = :m',
    ExpressionAttributeValues: {
      ':m': {
        updatedAt: results[Object.keys(results)[0]].updatedAt,
        lastImageUrl: imageUrl
      },
      ':r': mergeResults({ currentResults, newResults: results})
    },
    ReturnValues: 'UPDATED_NEW'
  }).promise()

  console.log({newDoc})
  return newDoc
}

module.exports.index = async event => {
  const { userName, imageUrl, results } = event
  console.log({results})

  await updateResult({ userName, imageUrl, results })
}