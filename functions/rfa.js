const aws = require('aws-sdk')
const lambda = new aws.Lambda()

module.exports.index = async event => {
  const record = event.Records[0]
  const region = record.awsRegion
  const buketName = record.s3.bucket.name
  const objectKey = record.s3.object.key
  const imageUrl = `https://${buketName}.s3-${region}.amazonaws.com/${objectKey}`

  const result = await lambda.invoke({
    FunctionName: 'sasaki-rfa-logs-dev-cloudVisionDispatcher',
    Payload: JSON.stringify({imageUrl})
  }).promise()

  return {
    statusCode: 200
  }
}