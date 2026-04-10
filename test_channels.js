async function testChannel(handle) {
    console.log(`Testing ${handle}...`);
    try {
        const res = await fetch(`https://www.youtube.com/${handle}/streams`);
        console.log(`Response: ${res.status} ${res.statusText}`);
        if (!res.ok) return 0;
        
        const html = await res.text();
        const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
        if (!match) {
            console.log('No ytInitialData found');
            return 0;
        }
        
        const data = JSON.parse(match[1]);
        const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
        const liveTab = tabs.find(t => t?.tabRenderer?.title === 'Live');
        const items = liveTab?.tabRenderer?.content?.richGridRenderer?.contents ?? [];
        
        const liveStreams = items.filter(item => {
            const video = item?.richItemRenderer?.content?.videoRenderer;
            if (!video?.videoId) return false;
            const overlays = video.thumbnailOverlays ?? [];
            return overlays.some(o => o?.thumbnailOverlayTimeStatusRenderer?.style === 'LIVE');
        });
        
        console.log(`${handle}: ${liveStreams.length} live streams`);
        return liveStreams.length;
    } catch (e) {
        console.error(`Error with ${handle}:`, e.message);
        return 0;
    }
}

async function main() {
    const ch1 = await testChannel('@TownofSalem-NH');
    const ch2 = await testChannel('@TownofSalem-NH-2');
    console.log(`Total: ${ch1 + ch2} streams`);
}

main();