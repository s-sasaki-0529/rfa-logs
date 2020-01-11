const Jimp = require('jimp')
const AWS = require('aws-sdk')
const S3 = new AWS.S3()

const WIDTH = 321
const HEIGHT = 462
const Y = 132
const X1 = 150
const X2 = 502
const X3 = 857

async function uploadToS3(image, key) {
  const imageBuffer = await image.getBufferAsync(Jimp.MIME_JPEG)
  return S3.putObject({
    ACL: "public-read",
    Body: imageBuffer,
    Bucket: "sasaki-rfa-logs",
    ContentType: "image/jpeg",
    Key: key
  }).promise()
}

module.exports.index = async event => {
  const url = event.url || event.queryStringParameters.url
  const userName = event.userName || event.queryStringParameters.userName
  const dateTime = new Date(event.dateTime || event.queryStringParameters.dateTime)
  const dateStr = `${dateTime.getFullYear()}-${dateTime.getMonth() + 1}-${dateTime.getDate()}`
  const dirName = `${userName}/${dateStr}`

  const origin = await Jimp.read(url)
  await uploadToS3(origin, `${dirName}/origin.jpeg`)
  await uploadToS3(origin.clone().crop(X1, Y, WIDTH, HEIGHT),  `${dirName}/1.jpeg`)
  await uploadToS3(origin.clone().crop(X2, Y, WIDTH, HEIGHT),  `${dirName}/2.jpeg`)
  await uploadToS3(origin.clone().crop(X3, Y, WIDTH, HEIGHT),  `${dirName}/3.jpeg`)

  return {
    statusCode: 200,
    body: { url, userName, dateTime, dirName }
  }
};
