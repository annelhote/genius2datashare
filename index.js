const axios = require('axios')
const cheerio = require('cheerio')
const fetch = require('node-fetch')

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
fetch(url, { method: 'GET', headers, params: { text_format : 'plain,html' } })
  .then(res => res.json())
  .then(async json => {
    const albumPath = json['response']['song']['path']

    // Retrieve lyrics
    const url2 = `http://genius.com${albumPath}`
    const result = await axios.get(url2)
    const html = cheerio.load(result.data)
    const lyrics = html('div.lyrics').text()

    await client.index({
        index: 'lyrics-datashare',
        type: 'doc', // uncomment this line if you are using {es} ≤ 6
        body: {
            content: lyrics
        }
    }).catch(e => {
        console.log('ERROR')
        console.log(e)
        console.log(e.meta.body.error)
    })
    //   await client.index({
    //       index: 'game-of-thrones',
    //       type: '_doc', // uncomment this line if you are using {es} ≤ 6
    //       body: {
    //           character: 'Ned Stark',
    //           quote: 'Winter is coming.'
    //       }
    //   })
  // await client.indices.refresh({ index: 'lyrics-datashare' })
  })

