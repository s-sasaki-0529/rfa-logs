const aws = require('aws-sdk')
const lambda = new aws.Lambda()
const docClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'})

function parse (text) {
  const nameLines = []
  const resultLines = []

  text = text.split(/\n/)
  text = text.filter((line) => line)
  text = text.map((line) => line.replace('、', '').replace(' ', ''))
  text.forEach((line) => {
    const matched = line.match(/(\D*)(\d+).\((\d+).\)$/)

    // 名前列と結果列が一行にまとまってる場合、それぞれの配列に追加
    if (matched && matched[1]) {
      nameLines.push(matched[1])
    }
    // ちゃんと分割されていた場合、該当の配列に追加
    if (matched) {
      resultLines.push({
        count: Number(matched[2]),
        total: Number(matched[3])
      })
    } else {
      nameLines.push(line)
    }
  })

  const resultObject = {}
  nameLines.forEach((name, index) => { resultObject[name] = resultLines[index].total })
  return resultObject
}

async function putResultToDynamoDB({imageUrl, success, result}) {
  const params = {
    TableName: 'rfa-logs',
    Item: {
      userName: 'Sa2Knight', // TODO: 一応ここも注入できるようにしたい
      datetime: (new Date()).toISOString(),
      imageUrl,
      success,
      ...result
    }
  }
  console.log(params)
  return docClient.put(params).promise()
}

module.exports.index = async event => {
  const record = event.Records[0]
  const region = record.awsRegion
  const buketName = record.s3.bucket.name
  const objectKey = record.s3.object.key
  const imageUrl = `https://${buketName}.s3-${region}.amazonaws.com/${objectKey}`

  console.log({imageUrl})
  const lambdaResult = await lambda.invoke({
    FunctionName: 'sasaki-rfa-logs-dev-cloudVisionDispatcher',
    Payload: JSON.stringify({imageUrl})
  }).promise()

  const cloudVisionResult = JSON.parse(lambdaResult.Payload).result.textAnnotations[0].description
  console.log(cloudVisionResult)
  
  try {
    const rfaResult = parse(cloudVisionResult)
    console.log(rfaResult)
    await putResultToDynamoDB({imageUrl, success: true, result: rfaResult})
  } catch (err) {
    console.log('parseError')
    console.error(err)
    await putResultToDynamoDB({imageUrl, success: false, result: {}})
  }
}