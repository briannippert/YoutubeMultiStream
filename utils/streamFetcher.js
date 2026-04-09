const fs = require('fs');
const path = require('path');

const CHANNEL_HANDLES = [
    '@TownofSalem-NH',
    '@TownofSalem-NH-2',
];
const STREAMS_FILE = path.join(__dirname, '../data/streams.json');
const EXCLUDED_TITLES = ['Dump camera', 'Transfer Station Camera'];

async function fetchStreamsForChannel(handle) {
    console.log(`Fetching live streams for channel: ${handle}`);
    const url = `https://www.youtube.com/${handle}/streams`;
    const res = await fetch(url, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' }
    });
    const html = await res.text();

    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (!match) throw new Error(`Could not find ytInitialData for ${handle}`);

    const data = JSON.parse(match[1]);
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
    const liveTab = tabs.find(t => t?.tabRenderer?.title === 'Live');
    const items = liveTab?.tabRenderer?.content?.richGridRenderer?.contents ?? [];

    const streams = [];
    for (const item of items) {
        const video = item?.richItemRenderer?.content?.videoRenderer;
        if (!video?.videoId) continue;

        const title = video?.title?.runs?.[0]?.text ?? '';
        const isExcluded = EXCLUDED_TITLES.some(t =>
            title.toLowerCase().includes(t.toLowerCase())
        );
        if (isExcluded) continue;

        streams.push({
            id: video.videoId,
            title,
            url: `https://www.youtube.com/watch?v=${video.videoId}`,
            autoUpdated: true
        });
    }

    console.log(`Found ${streams.length} live streams for ${handle}.`);
    return streams;
}

async function updateStreams() {
    try {
        const results = await Promise.all(CHANNEL_HANDLES.map(fetchStreamsForChannel));

        // Deduplicate by video ID across channels
        const seen = new Set();
        const fetchedStreams = results.flat().filter(s => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
        });

        // Load existing streams to preserve manually added ones
        let manualStreams = [];
        if (fs.existsSync(STREAMS_FILE)) {
            try {
                const existingContent = fs.readFileSync(STREAMS_FILE, 'utf8');
                const existingData = JSON.parse(existingContent);
                manualStreams = existingData.filter(s => s.autoUpdated === false);
            } catch (e) {
                console.error('Error reading existing streams file, starting fresh:', e);
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
