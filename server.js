const express = require('express');
const path = require('path');
const fs = require('fs');
const updateStreams = require('./utils/streamFetcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Log startup info
console.log(`Starting YouTube Multi-Stream server on port ${PORT}...`);

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to get streams
app.get('/api/streams', (req, res) => {
    const streamsPath = path.join(__dirname, 'data', 'streams.json');
    fs.readFile(streamsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading streams.json:', err);
            return res.status(500).json({ error: 'Failed to read streams' });
        }
        try {
            const streams = JSON.parse(data);
            res.json(streams);
        } catch (parseError) {
            console.error('Error parsing streams.json:', parseError);
            res.status(500).json({ error: 'Failed to parse streams data' });
        }
    });
});

// Initial fetch and scheduled updates
updateStreams();
setInterval(updateStreams, 5 * 60 * 1000); // Update every 5 minutes

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
