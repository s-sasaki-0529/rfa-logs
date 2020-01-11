const aws = require('aws-sdk')
const lambda = new aws.Lambda()

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
  nameLines.forEach((name, index) => { resultLines[index].name = name })
  return resultLines
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
  console.log({cloudVisionResult})
  
  try {
    const rfaResult = parse(cloudVisionResult)
    console.log({rfaResult})
  } catch (err) {
    console.log('parseError')
    console.err(err)
  }
}