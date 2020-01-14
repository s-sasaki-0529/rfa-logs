const axios = require('axios')

module.exports.index = async event => {
  const TOKEN = process.env.TOKEN
  const ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${TOKEN}`
  const IMAGE_URL = event.imageUrl
  console.log({IMAGE_URL})

  const imageResponse = await axios.get(IMAGE_URL, { responseType: 'arraybuffer'})
  const imageBase64 = Buffer.from(imageResponse.data, 'binary').toString('base64') 
  
  const postData = {
    requests: [
      {
        image: {
          content: imageBase64
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1
          }
        ]
      }
    ]
  }
  
  const response = await axios.post(ENDPOINT, postData).catch((e) => { console.log(e) })
  if (response && response.data.responses[0].textAnnotations) {
    console.log('SUCCESS')
    return {
      statusCode: 200,
      result: response.data.responses[0]
    }
  } else {
    console.log('ERROR')
    console.log(JSON.stringify(response.data))
    return {
      statusCode: 500
    }
  }
};