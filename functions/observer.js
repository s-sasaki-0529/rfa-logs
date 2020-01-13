const aws = require('aws-sdk')
const lambda = new aws.Lambda()

module.exports.index = async event => {
  // TODO: Twitterをチェックするlambda経由で最新の画像情報を取得する
  const { url, dateTime, userName } = event

  const result = await lambda.invoke({
    FunctionName: 'sasaki-rfa-logs-dev-imageCreator',
    Payload: JSON.stringify({url, userName}) // pass params
  }).promise()

  return {
    statusCode: 200
  }
}