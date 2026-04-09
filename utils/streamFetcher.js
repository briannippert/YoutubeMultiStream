const YouTube = require('youtube-sr').default;
const fs = require('fs');
const path = require('path');

const CHANNELS = [
    { id: 'UCfaKeWDWyKNUbvH2eZ2sZUA', searchQuery: 'Town of Salem NH' },
    { id: 'UChEInYY5RkERO9szf5eb3AQ', searchQuery: 'Town of Salem NH 2' },
];
const STREAMS_FILE = path.join(__dirname, '../data/streams.json');
const EXCLUDED_TITLES = ['Dump camera', 'Transfer Station Camera'];

async function fetchStreamsForChannel(channelId, searchQuery) {
    console.log('Fetching live streams for channel:', channelId);
    const videos = await YouTube.search(searchQuery, { type: 'video', limit: 50 });

    const channelVideos = videos.filter(v => v.channel && v.channel.id === channelId);

    const liveStreams = channelVideos.filter(v => {
        const isLive = v.duration === 0;
        const isExcluded = EXCLUDED_TITLES.some(title =>
            v.title.toLowerCase().includes(title.toLowerCase())
        );
        return isLive && !isExcluded;
    });

    console.log(`Found ${liveStreams.length} live streams for channel ${channelId}.`);
    return liveStreams.map(v => ({
        id: v.id,
        title: v.title,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        autoUpdated: true
    }));
}

async function updateStreams() {
    try {
        const results = await Promise.all(
            CHANNELS.map(ch => fetchStreamsForChannel(ch.id, ch.searchQuery))
        );
        const fetchedStreams = results.flat();

        // Load existing streams to preserve manually added ones
        let manualStreams = [];
        if (fs.existsSync(STREAMS_FILE)) {
            try {
                const existingContent = fs.readFileSync(STREAMS_FILE, 'utf8');
                const existingData = JSON.parse(existingContent);
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
