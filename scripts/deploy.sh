#!/bin/bash

# Automated deployment script for prompt-of-the-day on Azure VM
set -e

# Configuration
APP_NAME="prompt-of-the-day"
APP_DIR="/opt/${APP_NAME}"
REPO_URL="YOUR_GIT_REPO_URL"  # Replace with your git repository URL
DOMAIN="YOUR_DOMAIN"  # Replace with your domain or IP address

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
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

print_step "Starting deployment of $APP_NAME..."

# Stop existing services
print_step "Stopping existing services..."
cd $APP_DIR 2>/dev/null || echo "App directory doesn't exist yet"
docker-compose down 2>/dev/null || echo "No existing containers to stop"

# Clone or update repository
if [ ! -d "$APP_DIR/.git" ]; then
    print_step "Cloning repository..."
    rm -rf $APP_DIR
    git clone $REPO_URL $APP_DIR
else
    print_step "Updating repository..."
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/main  # or your main branch name
fi

cd $APP_DIR

# Set up environment variables
print_step "Setting up environment variables..."
if [ ! -f ".env.production" ]; then
    cp .env.production.template .env.production
    print_warning "Please edit .env.production with your actual values"
    print_warning "Then run this script again"
    exit 1
fi

# Create data directory with proper permissions
print_step "Setting up data directory..."
mkdir -p $APP_DIR/data
chown -R 1001:1001 $APP_DIR/data  # nextjs user from Dockerfile

# Build and start the application
print_step "Building and starting the application..."
docker-compose up --build -d

# Wait for application to be ready
print_step "Waiting for application to start..."
sleep 30

# Check if application is running
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Application is running successfully!"
else
    print_error "Application health check failed"
    docker-compose logs
    exit 1
fi

# Configure Nginx
print_step "Configuring Nginx..."
cp nginx/prompt-of-the-day.conf /etc/nginx/sites-available/
sed -i "s/YOUR_DOMAIN_HERE/$DOMAIN/g" /etc/nginx/sites-available/prompt-of-the-day.conf

# Enable the site
ln -sf /etc/nginx/sites-available/prompt-of-the-day.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default  # Remove default site

# Test Nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    print_success "Nginx configured successfully!"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Set up SSL with Let's Encrypt (if domain is provided and not an IP)
if [[ $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_warning "Skipping SSL setup for IP address. Use a domain name for SSL."
else
    print_step "Setting up SSL certificate..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    print_success "SSL certificate installed!"
fi

# Set up automatic startup
print_step "Setting up automatic startup..."
cat > /etc/systemd/system/prompt-of-the-day.service << EOF
[Unit]
Description=Prompt of the Day Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Set up scheduler service
cat > /etc/systemd/system/prompt-scheduler.service << EOF
[Unit]
Description=Prompt of the Day Scheduler
After=prompt-of-the-day.service
Requires=prompt-of-the-day.service

[Service]
Type=simple
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm run scheduler
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl enable prompt-of-the-day.service
systemctl enable prompt-scheduler.service
systemctl daemon-reload

print_success "Deployment completed successfully!"
print_success "Your app is now running at: http://$DOMAIN"
if [[ ! $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_success "With SSL: https://$DOMAIN"
fi

print_step "Deployment Summary:"
echo "- Application: Running in Docker container"
echo "- Nginx: Configured and running"
echo "- SSL: $(if [[ ! $DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then echo "Enabled"; else echo "Not configured (IP address)"; fi)"
echo "- Auto-start: Enabled"
echo "- Health check: http://$DOMAIN/api/health"
echo ""
print_warning "Don't forget to:"
print_warning "1. Update your DNS records to point to this server"
print_warning "2. Configure your OpenAI API key in .env.production"
print_warning "3. Set up regular backups for the data directory"
