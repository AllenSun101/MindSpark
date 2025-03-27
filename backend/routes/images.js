var express = require('express');
var router = express.Router();
var axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const GOOGLE_API_KEY = process.env.YOUTUBE_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_CSE_ID;

router.get('/get_google_images', async function(req, res) {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing search query" });

    const URL = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${SEARCH_ENGINE_ID}&searchType=image&num=2&key=${GOOGLE_API_KEY}`;

    console.log(URL);
    
    try {
        const response = await axios.get(URL);
        const images = response.data.items.map(item => ({
            title: item.title,
            url: item.link
        }));
        res.json({ images });
    } catch (error) {
        console.error("Google Image Search error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch images" });
    }
});

module.exports = router;