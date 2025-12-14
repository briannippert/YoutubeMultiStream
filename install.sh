#!/bin/bash

# YouTube Multi-Stream Install Script for Ubuntu

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default port
PORT=${1:-3000}
SERVICE_NAME="youtube-multistream"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUDO_USER=${SUDO_USER:-$(whoami)}

echo -e "${YELLOW}YouTube Multi-Stream Service Installer${NC}"
echo "========================================"
echo "Port: $PORT"
echo "App Directory: $APP_DIR"
echo "Running as User: $SUDO_USER"
echo ""

# Check if running as root (required for systemd service)
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (use sudo)${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 16+ before running this script"
    echo "Visit: https://nodejs.org/ or use your package manager"
    exit 1
fi

echo -e "${GREEN}Node.js: $(node --version)${NC}"
echo -e "${GREEN}npm: $(npm --version)${NC}"

# Install npm dependencies
echo -e "${YELLOW}Installing npm dependencies...${NC}"
cd "$APP_DIR" || exit 1
if npm install; then
    echo -e "${GREEN}Dependencies installed${NC}"
else
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

# Create systemd service file
echo -e "${YELLOW}Creating systemd service...${NC}"
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=YouTube Multi-Stream Service
After=network.target

[Service]
Type=simple
User=$SUDO_USER
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

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Service file created${NC}"
else
    echo -e "${RED}Error: Failed to create service file${NC}"
    exit 1
fi

# Reload systemd daemon
echo -e "${YELLOW}Reloading systemd daemon...${NC}"
if systemctl daemon-reload; then
    echo -e "${GREEN}Daemon reloaded${NC}"
else
    echo -e "${RED}Error: Failed to reload daemon${NC}"
    exit 1
fi

# Enable the service
echo -e "${YELLOW}Enabling service to start on boot...${NC}"
if systemctl enable ${SERVICE_NAME}.service; then
    echo -e "${GREEN}Service enabled${NC}"
else
    echo -e "${RED}Error: Failed to enable service${NC}"
    exit 1
fi

# Start the service
echo -e "${YELLOW}Starting service...${NC}"
if systemctl start ${SERVICE_NAME}.service; then
    echo -e "${GREEN}Service started${NC}"
else
    echo -e "${RED}Error: Failed to start service${NC}"
    echo "Check logs with: journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

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
