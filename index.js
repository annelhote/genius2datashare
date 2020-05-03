const axios = require('axios')
const cheerio = require('cheerio')

// var url ='http://api.genius.com/artists/47263';
const headers = { 'Authorization': 'Bearer wBSsHGD8VuHpJZdO5YAHvLq0oxG9x9oUdnmhNFqvONO7VrfCHzfOodIFpLx795ZX' }
// Goldman artist id : 47263
// fetch(url, { method: 'GET', headers, params: { text_format : 'plain,html' } })
//   .then((res) => {
//     // console.log(res)
//     return res.json()
//   })
//   .then((json) => {
//     console.log(json);
//     // Do something with the returned data.
//   });

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

// Retrieve song lyrics
// Song id : Là bas : 240015
const url ='http://api.genius.com/songs/240015';
axios.get(url, { headers, params: { text_format : 'plain,html' } })
  .then(async json => {
    const albumPath = json.data.response.song.path

    // Retrieve lyrics
    const url2 = `http://genius.com${albumPath}`
    const result = await axios.get(url2)
    const html = cheerio.load(result.data)
    const lyrics = html('div.lyrics').text()

    await client.index({
        index: 'lyrics-datashare',
        type: 'doc',
        body: {
            content: lyrics
        }
    }).catch(() => {})
  }).catch(() => {})

