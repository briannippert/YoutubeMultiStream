// Load streams from JSON file and render them
async function loadStreams() {
    try {
        const response = await fetch('data/streams.json');
        if (!response.ok) {
            throw new Error('Failed to load streams');
        }
        const streams = await response.json();
        renderStreams(streams);
    } catch (error) {
        console.error('Error loading streams:', error);
        displayError('Failed to load streams: ' + error.message);
    }
}

function renderStreams(streams) {
    const grid = document.getElementById('streams-grid');
    grid.innerHTML = '';

    if (!streams || streams.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No streams configured. Add streams to data/streams.json</p>';
        return;
    }

    streams.forEach(stream => {
        const streamBox = createStreamBox(stream);
        grid.appendChild(streamBox);
    });
}

function createStreamBox(stream) {
    const box = document.createElement('div');
    box.className = 'stream-box';

    let embedCode = '';
    
    if (stream.url) {
        const videoId = extractYouTubeVideoId(stream.url);
        if (videoId) {
            embedCode = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&fs=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
            embedCode = '<div class="stream-loading">Invalid YouTube URL. Please use format: https://www.youtube.com/watch?v=VIDEO_ID</div>';
        }
    } else {
        embedCode = '<div class="stream-loading">YouTube URL not configured. Add URL to streams.json</div>';
    }

    box.innerHTML = `
        <div class="stream-video">
            ${embedCode}
        </div>
        <div class="stream-info">
            <div class="stream-title">${escapeHtml(stream.title)}</div>
            <div class="stream-status">
                <span class="status-indicator"></span>
                <span>YouTube Stream</span>
            </div>
        </div>
    `;

    return box;
}

function extractYouTubeVideoId(url) {
    let videoId = null;
    
    // Handle youtube.com/watch?v=ID format
    const match1 = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\&\?\/]+)/);
    if (match1 && match1[1]) {
        videoId = match1[1];
    }
    
    return videoId;
}

function displayError(message) {
    const grid = document.getElementById('streams-grid');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    grid.insertBefore(errorDiv, grid.firstChild);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Load streams when page loads
document.addEventListener('DOMContentLoaded', loadStreams);

// Optional: Refresh streams every 5 minutes
setInterval(loadStreams, 5 * 60 * 1000);
