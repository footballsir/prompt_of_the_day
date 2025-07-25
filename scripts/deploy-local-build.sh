#!/bin/bash

# Local build and deploy script for Prompt of the Day
# Usage: ./scripts/deploy-local-build.sh [VM_IP] [VM_USER] [REMOTE_PATH]

set -e

# Configuration
VM_IP=${1:-"your-vm-ip"}
VM_USER=${2:-"azureuser"}
REMOTE_PATH=${3:-"/home/azureuser/prompt_of_the_day"}
BUILD_DIR=".next"
DEPLOYMENT_PACKAGE="deployment-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "🚀 Starting local build and deployment..."

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next

# Step 2: Install dependencies and build
echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building application..."
npm run build

# Step 3: Create deployment package
echo "📦 Creating deployment package..."
tar -czf "$DEPLOYMENT_PACKAGE" \
    .next/standalone \
    .next/static \
    public \
    package.json \
    next.config.ts \
    data

echo "📁 Package created: $DEPLOYMENT_PACKAGE"

# Step 4: Upload to VM
echo "⬆️  Uploading to VM ($VM_USER@$VM_IP:$REMOTE_PATH)..."
scp "$DEPLOYMENT_PACKAGE" "$VM_USER@$VM_IP:/tmp/"

# Step 5: Deploy on VM
echo "🚀 Deploying on VM..."
ssh "$VM_USER@$VM_IP" << EOF
    set -e
    
    # Create app directory if it doesn't exist
    mkdir -p "$REMOTE_PATH"
    cd "$REMOTE_PATH"
    
    # Stop existing application (if running)
    pkill -f "node.*standalone/server.js" || true
    pkill -f "npm.*start" || true
    
    # Backup current deployment
    if [ -d ".next" ]; then
        mv .next .next.backup.\$(date +%Y%m%d-%H%M%S) || true
    fi
    
    # Extract new deployment
    tar -xzf "/tmp/$DEPLOYMENT_PACKAGE"
    
    # Copy static files to standalone directory
    cp -r .next/static .next/standalone/.next/
    cp -r public .next/standalone/
    
    # Install production dependencies in standalone directory
    cd .next/standalone
    npm ci --production --silent
    
    # Start the application
    echo "🎉 Starting application..."
    nohup node server.js > ../app.log 2>&1 &
    
    echo "✅ Deployment completed!"
    echo "📄 Logs: tail -f $REMOTE_PATH/.next/app.log"
EOF

# Step 6: Clean up local package
echo "🧹 Cleaning up local deployment package..."
rm "$DEPLOYMENT_PACKAGE"

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be running on http://$VM_IP:3000"
echo "📄 Check logs: ssh $VM_USER@$VM_IP 'tail -f $REMOTE_PATH/.next/app.log'"
