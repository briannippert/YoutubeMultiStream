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

        const streamsData = liveStreams.map((v, index) => ({
            id: v.id,
            title: v.title,
            url: `https://www.youtube.com/watch?v=${v.id}`
        }));

        if (streamsData.length > 0) {
             console.log(`Updating streams.json with ${streamsData.length} streams.`);
             fs.writeFileSync(STREAMS_FILE, JSON.stringify(streamsData, null, 2));
        } else {
            console.log('No live streams found. Updating with empty list.');
            fs.writeFileSync(STREAMS_FILE, JSON.stringify([], null, 2));
        }

    } catch (error) {
        console.error('Error fetching streams:', error);
    }
}

module.exports = updateStreams;
