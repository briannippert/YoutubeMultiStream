#!/bin/bash

# YouTube Multi-Stream Install Script for Ubuntu

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default port
PORT=${1:-3000}
SERVICE_NAME="youtube-multistream"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER=$(whoami)

echo -e "${YELLOW}YouTube Multi-Stream Service Installer${NC}"
echo "========================================"
echo "Port: $PORT"
echo "App Directory: $APP_DIR"
echo "User: $USER"
echo ""

# Check if running as root (required for systemd service)
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    apt-get install -y nodejs
    echo -e "${GREEN}Node.js installed${NC}"
else
    echo -e "${GREEN}Node.js already installed: $(node --version)${NC}"
fi

# Install npm dependencies
echo -e "${YELLOW}Installing npm dependencies...${NC}"
cd "$APP_DIR"
npm install
echo -e "${GREEN}Dependencies installed${NC}"

# Create systemd service file
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=YouTube Multi-Stream Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment="NODE_ENV=production"
Environment="PORT=$PORT"
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}Service file created${NC}"

# Reload systemd daemon
echo -e "${YELLOW}Reloading systemd daemon...${NC}"
systemctl daemon-reload
echo -e "${GREEN}Daemon reloaded${NC}"

# Enable the service
echo -e "${YELLOW}Enabling service to start on boot...${NC}"
systemctl enable ${SERVICE_NAME}.service
echo -e "${GREEN}Service enabled${NC}"

# Start the service
echo -e "${YELLOW}Starting service...${NC}"
systemctl start ${SERVICE_NAME}.service
echo -e "${GREEN}Service started${NC}"

# Check status
echo ""
echo -e "${YELLOW}Service Status:${NC}"
systemctl status ${SERVICE_NAME}.service

echo ""
echo -e "${GREEN}Installation Complete!${NC}"
echo "========================================"
echo "Service Name: $SERVICE_NAME"
echo "Port: $PORT"
echo "App URL: http://localhost:$PORT"
echo ""
echo "Useful commands:"
echo "  View logs:     journalctl -u $SERVICE_NAME -f"
echo "  Stop service:  systemctl stop $SERVICE_NAME"
echo "  Start service: systemctl start $SERVICE_NAME"
echo "  Restart:       systemctl restart $SERVICE_NAME"
echo "  Disable:       systemctl disable $SERVICE_NAME"
