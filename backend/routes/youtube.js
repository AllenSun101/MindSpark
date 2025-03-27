var express = require('express');
var router = express.Router();
var axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

router.get('/get_links', async function(req, res, next) {
    try {
        const { query } = req.query; // Get search term from query params
        if (!query) return res.status(400).json({ error: "Query parameter is required" });

        const response = await axios.get(YOUTUBE_API_URL, {
            params: {
                key: YOUTUBE_API_KEY,
                q: query, // Search query
                part: "snippet",
                type: "video",
                maxResults: 10,
                order: "relevance",
            },
        });

        console.log(response);

        // Extract relevant video data
        const videos = response.data.items.map(video => ({
            id: video.id.videoId,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails.medium.url,
            channelTitle: video.snippet.channelTitle,
        }));

        console.log(videos);

        res.json({ videos });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;