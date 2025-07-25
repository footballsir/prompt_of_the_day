#!/bin/bash

# Backup script for prompt-of-the-day application
set -e

APP_NAME="prompt-of-the-day"
APP_DIR="/opt/${APP_NAME}"
BACKUP_BASE_DIR="/opt/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/${APP_NAME}-${DATE}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory
mkdir -p $BACKUP_DIR

print_info "Creating backup: $BACKUP_DIR"

# Backup application data
print_info "Backing up application data..."
cp -r $APP_DIR/data $BACKUP_DIR/

# Backup environment configuration
print_info "Backing up configuration..."
cp $APP_DIR/.env.production $BACKUP_DIR/ 2>/dev/null || print_warning ".env.production not found"

# Backup nginx configuration
print_info "Backing up nginx configuration..."
mkdir -p $BACKUP_DIR/nginx
cp /etc/nginx/sites-available/prompt-of-the-day.conf $BACKUP_DIR/nginx/ 2>/dev/null || print_warning "Nginx config not found"

# Create backup info file
cat > $BACKUP_DIR/backup-info.txt << EOF
Backup created: $(date)
Application: $APP_NAME
Source directory: $APP_DIR
Backup directory: $BACKUP_DIR
EOF

# Compress backup
print_info "Compressing backup..."
cd $BACKUP_BASE_DIR
tar -czf "${APP_NAME}-${DATE}.tar.gz" "${APP_NAME}-${DATE}"
rm -rf $BACKUP_DIR

# Keep only last 7 backups
print_info "Cleaning up old backups..."
ls -t ${BACKUP_BASE_DIR}/${APP_NAME}-*.tar.gz | tail -n +8 | xargs -r rm

print_info "Backup completed: ${BACKUP_BASE_DIR}/${APP_NAME}-${DATE}.tar.gz"

# Optional: Upload to cloud storage
# Uncomment and configure for your cloud provider
# print_info "Uploading backup to cloud storage..."
# aws s3 cp "${BACKUP_BASE_DIR}/${APP_NAME}-${DATE}.tar.gz" s3://your-backup-bucket/
