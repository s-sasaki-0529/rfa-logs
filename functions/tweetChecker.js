const Twitter = require('twitter')

async function fetchImageUrls () {
  const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET
  })

  const params = { count: 200 }
  const tweets = await client.get('statuses/user_timeline', params)
  return tweets
    .filter((tweet) => tweet.text.includes('#RingFitAdventure'))
    .map((tweet) => tweet.entities.media[0].media_url_https + '?format=jpg&name=large')
}

module.exports.index = async event => {
  const urls = await fetchImageUrls()
  console.log({urls})

  return {
    statusCode: 200,
    urls
  }
}