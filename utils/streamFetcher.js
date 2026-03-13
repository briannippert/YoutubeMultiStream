const YouTube = require('youtube-sr').default;
const fs = require('fs');
const path = require('path');

// Channel ID for Town of Salem, NH (Traffic Cameras)
const CHANNEL_ID = 'UCfaKeWDWyKNUbvH2eZ2sZUA'; 
const SEARCH_QUERY = 'Town of Salem NH';
const STREAMS_FILE = path.join(__dirname, '../data/streams.json');
const EXCLUDED_TITLES = ['Dump camera', 'Transfer Station Camera'];

async function updateStreams() {
    console.log('Fetching live streams for channel:', CHANNEL_ID);
    try {
        // Search for videos related to the channel
        // Note: limit 50 to catch all potential streams
        const videos = await YouTube.search(SEARCH_QUERY, { type: 'video', limit: 50 });
        
        // Filter for the correct channel
        const channelVideos = videos.filter(v => v.channel && v.channel.id === CHANNEL_ID);

        // Filter for live streams (heuristic: duration is 0)
        // Also check if title contains excluded strings
        const liveStreams = channelVideos.filter(v => {
            const isLive = v.duration === 0;
            const isExcluded = EXCLUDED_TITLES.some(title => 
                v.title.toLowerCase().includes(title.toLowerCase())
            );
            return isLive && !isExcluded;
        });

        console.log(`Found ${liveStreams.length} live streams after filtering.`);

        // New Salem streams from auto-fetching
        const fetchedStreams = liveStreams.map((v) => ({
            id: v.id,
            title: v.title,
            url: `https://www.youtube.com/watch?v=${v.id}`,
            autoUpdated: true
        }));

        // Load existing streams to preserve manually added ones
        let manualStreams = [];
        if (fs.existsSync(STREAMS_FILE)) {
            try {
                const existingContent = fs.readFileSync(STREAMS_FILE, 'utf8');
                const existingData = JSON.parse(existingContent);
                // Keep streams that are explicitly marked as not autoUpdated
                manualStreams = existingData.filter(s => s.autoUpdated === false);
            } catch (e) {
                console.error('Error reading existing streams file, starting fresh with manual streams:', e);
            }
        }

        const combinedStreams = [...manualStreams, ...fetchedStreams];

        console.log(`Updating streams.json with ${fetchedStreams.length} auto-updated and ${manualStreams.length} manual streams.`);
        fs.writeFileSync(STREAMS_FILE, JSON.stringify(combinedStreams, null, 2));

    } catch (error) {
        console.error('Error fetching streams:', error);
    }
}

module.exports = updateStreams;
