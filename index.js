const _ = require('lodash')
const axios = require('axios')
const cheerio = require('cheerio')
const es = require('@elastic/elasticsearch')

const headers = { 'Authorization': 'Bearer wBSsHGD8VuHpJZdO5YAHvLq0oxG9x9oUdnmhNFqvONO7VrfCHzfOodIFpLx795ZX' }
const client = new es.Client({ node: 'http://localhost:9200' })
const baseUrl = 'http://api.genius.com'

async function getSongsFromArtistId (artistId) {
    const artist_url = `${baseUrl}/artists/${artistId}/songs`
    let page = 1
    while (page !== null) {
        try {
            const params = { per_page: 50, page }
            const res = await axios.get(artist_url, { headers, params })
            console.log('scapping page : ' + page)
            _.map(res.data.response.songs, async song => await getLyricsFromSongId(song.id))
            page = res.data.response.next_page
        } catch (error) {
            console.log('ERROR')
            console.log(error)
        }
    }
}

// Retrieve song lyrics
async function getLyricsFromSongId (songId) {
    console.log('getLyricsFromSongId : ' + songId)
    const url = `${baseUrl}/songs/${songId}`;
    try {
        const res = await axios.get(url, { headers, params: { text_format : 'plain,html' } })
        const songPath = res.data.response.song.path
        console.log('songPath : ' + songPath)

        // Retrieve lyrics
        const songUrl = `http://genius.com${songPath}`
        try {
            const result = await axios.get(songUrl)
            const html = cheerio.load(result.data)
            const lyrics = html('div.lyrics').text()
            console.log('I got lyrics for song : ' + songId)
            await client.index({
                index: 'lyrics-datashare',
                type: 'doc',
                body: {
                    content: lyrics
                }
            })
        } catch (error) {
            console.log('ERROR 3')
            console.log(error)
        }
    } catch (error) {
        console.log('ERROR 2')
        console.log(error)
    }
}

// Song id : Là bas : 240015
// getLyricsFromSongId(240015)
// Artist id : Goldman : 47263
// Artist id : Benjamin Clementine : 263339
getSongsFromArtistId(47263)

