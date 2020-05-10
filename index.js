const _ = require('lodash')
const axios = require('axios')
const cheerio = require('cheerio')
const es = require('@elastic/elasticsearch')
const moment = require('moment')

const config = require('./config.json')

const headers = { 'Authorization': `Bearer ${config.bearer}` }
const client = new es.Client({ node: 'http://localhost:9200' })
const baseUrl = 'http://api.genius.com'

// Artist id : Jean-Jacques Goldman : 47263
// Artist id : Benjamin Clementine : 263339
const ARTISTE_ID = 47263
const ARTISTE_NAME = 'Jean-Jacques Goldman'

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
        const response = await axios.get(url, { headers, params: { text_format : 'plain,html' } })
        const song = response.data.response.song
        const songPath = song.path
        const songDate = song.release_date_for_display

        // Retrieve lyrics
        const songUrl = `http://genius.com${songPath}`
        const result = await axios.get(songUrl)
        const html = cheerio.load(result.data)
        const lyrics = html('div.lyrics').text()
        console.log('I got lyrics for song : ' + songId)
        const body = {
            content: lyrics,
            contentLength: lyrics.length,
            type: 'Document',
            language: 'FRENCH',
            extractionDate: moment().format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z',
            nerTags: [],
            extractionLevel: 0,
            tags: [],
            status: 'INDEXED',
            contentType: 'text/plain',
            join: {
                name: 'Document'
            },
            metadata: {
                tika_metadata_author: ARTISTE_NAME,
                tika_metadata_author_id: ARTISTE_ID,
            }
        }
        if (songDate !== null) {
            body.metadata.tika_metadata_creation_date = moment(songDate).format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z'
        }
        await client.index({
            index: config.esIndex,
            type: 'doc',
            id: songId,
            body
        })
    } catch (error) {
        console.log('ERROR')
        console.log(error)
    }
}

getSongsFromArtistId(ARTISTE_ID)
