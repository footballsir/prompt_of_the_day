#!/bin/bash

# Deployment script for Azure VM
set -e

echo "🚀 Starting deployment to Azure VM..."

# Configuration
APP_NAME="prompt-of-the-day"
APP_DIR="/opt/${APP_NAME}"
BACKUP_DIR="/opt/${APP_NAME}-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    apt install -y nginx
    systemctl enable nginx
fi

# Install certbot for SSL
if ! command -v certbot &> /dev/null; then
    print_status "Installing Certbot for SSL..."
    apt install -y certbot python3-certbot-nginx
fi

# Create application directory
print_status "Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Backup existing deployment if it exists
if [ -d "$APP_DIR/.git" ]; then
    print_status "Backing up existing deployment..."
    cp -r $APP_DIR $BACKUP_DIR
fi

print_status "Deployment script completed. Ready for application deployment."
print_warning "Next steps:"
print_warning "1. Copy your application files to $APP_DIR"
print_warning "2. Set up environment variables"
print_warning "3. Configure nginx"
print_warning "4. Run docker-compose up -d"
