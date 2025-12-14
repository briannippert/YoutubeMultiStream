# YouTube Streamer

A web interface for displaying multiple YouTube live streams in a responsive grid layout.

## Features

- Display multiple YouTube streams in small boxes
- Responsive grid layout that adapts to screen size
- JSON-based configuration for easy stream management
- Dark theme with smooth animations
- Auto-refresh streams every 5 minutes

## Project Structure

```
youtube-streamer/
├── index.html          # Main HTML interface
├── app.js              # Frontend JavaScript to load and render streams
├── styles.css          # CSS styling and responsive design
├── server.js           # Express server (optional)
├── package.json        # Node.js dependencies
├── data/
│   └── streams.json    # Stream configuration (JSON)
└── README.md           # This file
```

## Configuration

Edit `data/streams.json` to configure your streams:

```json
[
  {
    "id": "stream1",
    "title": "Stream Title",
    "youtubeChannelId": "CHANNEL_ID",
    "youtubeVideoId": "VIDEO_ID"
  }
]
```

### Options:
- `id`: Unique identifier for the stream
- `title`: Display name for the stream
- `youtubeChannelId`: YouTube channel ID (for live channel streams)
- `youtubeVideoId`: Specific YouTube video/stream ID

Use `youtubeVideoId` for specific videos/streams, or `youtubeChannelId` to embed the channel's latest content.

## Running the Project

### Quick Start (Static Files)
Simply open `index.html` in your browser. The interface will load streams from `data/streams.json`.

### With Express Server (Local Development)
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open http://localhost:3000 in your browser

### Ubuntu Server Setup with systemd Service

Install as a systemd service that runs on startup:

```bash
# Clone the repository
git clone https://github.com/briannippert/YoutubeMultiStream.git
cd YoutubeMultiStream

# Run install script with optional port (default: 3000)
sudo bash install.sh [PORT]

# Examples:
sudo bash install.sh 3000    # Use port 3000
sudo bash install.sh 8080    # Use port 8080
sudo bash install.sh         # Use default port 3000
```

The install script will:
- Install Node.js and npm (if not present)
- Install project dependencies
- Create a systemd service
- Enable the service to start on boot
- Start the service immediately

**View logs:**
```bash
journalctl -u youtube-multistream -f
```

**Manage service:**
```bash
sudo systemctl start youtube-multistream
sudo systemctl stop youtube-multistream
sudo systemctl restart youtube-multistream
sudo systemctl status youtube-multistream
```

## How It Works

1. The page loads `data/streams.json` via JavaScript
2. For each stream, an iframe is created embedding the YouTube stream
3. Streams are displayed in a responsive CSS Grid layout
4. The grid automatically adjusts the number of columns based on screen size
5. Streams auto-refresh every 5 minutes

## Finding YouTube IDs

### Channel ID
- Go to the YouTube channel
- Look at the URL: `youtube.com/@username` or `youtube.com/c/channelname`
- Use the channel ID from the URL

### Video/Stream ID
- Open the video/stream on YouTube
- The URL format is: `youtube.com/watch?v=VIDEO_ID`
- Extract the `VIDEO_ID` part

## Customization

### Styling
Edit `styles.css` to change:
- Colors and gradients
- Grid layout (columns, gaps)
- Box shadows and animations
- Responsive breakpoints

### Grid Layout
Modify the grid in `styles.css`:
```css
.streams-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
}
```

Change `350px` to adjust the minimum width of boxes, and it will automatically create more columns on larger screens.

## Browser Compatibility

Works on all modern browsers that support:
- CSS Grid
- Fetch API
- ES6 JavaScript
- YouTube iframe embeds

## Notes

- Some YouTube streams require embedding permissions
- Live streams may not be available for all channels
- CORS might block loading on some servers; use the Express server in that case
