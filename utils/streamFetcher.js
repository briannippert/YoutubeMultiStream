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
    
    const MAX_RETRIES = 3;
    const BASE_DELAY = 1000; // 1 second
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const res = await fetch(url, {
                headers: { 'Accept-Language': 'en-US,en;q=0.9' }
            });
            const html = await res.text();

            // Check if YouTube's page structure has changed
            const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
            if (!match) {
                const error = new Error(`Could not find ytInitialData for ${handle}`);
                error.code = 'STRUCTURE_CHANGED';
                throw error;
            }

            const data = JSON.parse(match[1]);
            const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
            const liveTab = tabs.find(t => t?.tabRenderer?.title === 'Live');
            
            if (!liveTab) {
                console.warn(`⚠️  WARNING: Could not find 'Live' tab for ${handle}. YouTube's structure may have changed.`);
            }
            
            const items = liveTab?.tabRenderer?.content?.richGridRenderer?.contents ?? [];

            const streams = [];
            for (const item of items) {
                const video = item?.richItemRenderer?.content?.videoRenderer;
                if (!video?.videoId) continue;

                // Only include currently live streams (style === 'LIVE' in thumbnail overlay)
                const overlays = video?.thumbnailOverlays ?? [];
                const isLive = overlays.some(o =>
                    o?.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE'
                );
                if (!isLive) continue;

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
            
        } catch (error) {
            const isLastAttempt = attempt === MAX_RETRIES;
            const delay = BASE_DELAY * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
            
            if (error.code === 'STRUCTURE_CHANGED') {
                console.error(`⚠️  STRUCTURE ERROR (${handle}): ${error.message}`);
                console.error(`   This usually means YouTube's page structure has changed.`);
                console.error(`   Run 'node test_channels.js' to diagnose and update the scraper.`);
                if (!isLastAttempt) {
                    console.log(`   Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error(`   ❌ Giving up after ${MAX_RETRIES} attempts.`);
                }
            } else {
                console.error(`Attempt ${attempt}/${MAX_RETRIES} failed for ${handle}: ${error.message}`);
                if (!isLastAttempt) {
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            if (isLastAttempt) {
                console.error(`❌ All ${MAX_RETRIES} attempts failed for ${handle}. Streams from this channel will not be updated.`);
                return [];
            }
        }
    }
}

async function updateStreams() {
    try {
        const results = await Promise.allSettled(CHANNEL_HANDLES.map(fetchStreamsForChannel));
        
        let fetchedStreams = [];
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'fulfilled') {
                fetchedStreams = fetchedStreams.concat(result.value);
            } else {
                console.error(`Failed to fetch ${CHANNEL_HANDLES[i]}:`, result.reason);
            }
        }

        // Deduplicate by video ID across channels
        const seen = new Set();
        fetchedStreams = fetchedStreams.filter(s => {
            if (seen.has(s.id)) return false;
            seen.add(s.id);
            return true;
        });

        // Load existing streams to preserve manually added ones
        let manualStreams = [];
        let previousAutoStreams = [];
        if (fs.existsSync(STREAMS_FILE)) {
            try {
                const existingContent = fs.readFileSync(STREAMS_FILE, 'utf8');
                const existingData = JSON.parse(existingContent);
                manualStreams = existingData.filter(s => s.autoUpdated === false);
                previousAutoStreams = existingData.filter(s => s.autoUpdated !== false);
            } catch (e) {
                console.error('Error reading existing streams file, starting fresh:', e);
            }
        }

        // CRITICAL: If fetch returned zero streams but we previously had auto-updated streams,
        // this likely indicates YouTube's HTML structure changed or a network issue occurred.
        // Preserve the old streams and log a warning.
        if (fetchedStreams.length === 0 && previousAutoStreams.length > 0) {
            console.warn(`⚠️  ALERT: Fetched 0 streams but previously had ${previousAutoStreams.length} streams. ` +
                `This may indicate YouTube's page structure has changed or a network issue. ` +
                `Preserving previous streams. Consider running test_channels.js to diagnose.`);
            fetchedStreams = previousAutoStreams;
        }

        const combinedStreams = [...manualStreams, ...fetchedStreams];

        console.log(`Updating streams.json with ${fetchedStreams.length} auto-updated and ${manualStreams.length} manual streams.`);
        fs.writeFileSync(STREAMS_FILE, JSON.stringify(combinedStreams, null, 2));

        // Keep a backup of successful fetches for recovery
        const backupPath = path.join(__dirname, '../data/streams.backup.json');
        if (combinedStreams.length > 0) {
            fs.writeFileSync(backupPath, JSON.stringify(combinedStreams, null, 2));
            console.log('Backup saved to streams.backup.json');
        }

    } catch (error) {
        console.error('Error fetching streams:', error);
    }
}

module.exports = updateStreams;
