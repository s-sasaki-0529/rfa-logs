const axios = require('axios')

module.exports.index = async event => {
  const TOKEN = process.env.TOKEN
  const ENDPOINT = `https://vision.googleapis.com/v1/images:annotate?key=${TOKEN}`
  const IMAGE_URL = event.imageUrl
  
  const postData = {
    requests: [
      {
        image: {
          source: {
            imageUri: IMAGE_URL
          }
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
  if (response) {
    console.log(response.data)
    return {
      statusCode: 200,
      result: response.data
    }
  } else {
    return {
      statusCode: 500
    }
  }
};