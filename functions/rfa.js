const aws = require('aws-sdk')
const lambda = new aws.Lambda()
const USER_NAME = 'Sa2Knight'

function parse (text) {
  const nameLines = []
  const resultLines = []
  const blackList = ['引っぱりバンザイサイドベンド']

  text = text.split(/\n/)
  text = text.filter((line) => line)
  text = text.map((line) => {
    return line
      .replace('、', '')
      .replace(' ', '')
      .replace(/(\d+)(\D)(\d+)(\D)\)$/, '$1$2($3$4)') // 171回1990回) → 171回(1990回)
      .replace(/(\D+)(\d+)(\D)(\d+)\D?/, '$1$2$3($4$3)') // 引っぱりバンザイサイドベンド1081秒117999) → 引っ張りバンザイサイドベンド1081秒(117999秒)
  })

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
  const date = new Date()
  date.setTime(date.getTime() + 1000 * 60 * 60 * 9)

  nameLines.forEach((name, index) => {
    if (!blackList.includes(name)) {
      resultObject[name] = {
        value: resultLines[index].total,
        updatedAt: date.toISOString(),
      }
    }
  })
  return resultObject
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

  const cloudVisionResult = JSON.parse(lambdaResult.Payload)
  if (cloudVisionResult.statusCode != 200) {
    console.error('CloudVisionDispatcherError')
    return
  }

  const description = cloudVisionResult.result.textAnnotations[0].description
  console.log({description})
  
  let rfaResult
  try {
    rfaResult = parse(description)
    console.log({rfaResult})
  } catch (err) {
    console.error(err)
    return null
  }

  await lambda.invoke({
    FunctionName: 'sasaki-rfa-logs-dev-db',
    Payload: JSON.stringify({userName: USER_NAME, imageUrl, results: rfaResult})
  }).promise()
}