# Deployment Guide for Azure VM

This guide will help you deploy the Prompt of the Day application to an Azure VM.

## Prerequisites

1. **Azure VM** with Ubuntu 20.04 or later
2. **Domain name** (optional but recommended for SSL)
3. **OpenAI API Key**
4. **SSH access** to your Azure VM

## Quick Deployment

### Step 1: Prepare Your Azure VM

1. Create an Azure VM with Ubuntu 20.04+
2. Open ports 80 and 443 in the security group
3. SSH into your VM:
   ```bash
   ssh azureuser@your-vm-ip
   ```

### Step 2: Run Initial Setup

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/prompt_of_the_day/main/scripts/deploy-setup.sh -o deploy-setup.sh
chmod +x deploy-setup.sh
sudo ./deploy-setup.sh
```

### Step 3: Clone and Deploy the Application

```bash
# Clone your repository
sudo git clone https://github.com/YOUR_USERNAME/prompt_of_the_day.git /opt/prompt-of-the-day
cd /opt/prompt-of-the-day

# Set up environment variables
sudo cp .env.production.template .env.production
sudo nano .env.production  # Edit with your values

# Run deployment
sudo chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

### Step 4: Configure Environment Variables

Edit `/opt/prompt-of-the-day/.env.production`:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_actual_openai_api_key_here

# Application Configuration
NODE_ENV=production
PORT=3000

# Domain Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Manual Deployment Steps

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Application Deployment

```bash
# Clone repository
sudo git clone https://github.com/YOUR_USERNAME/prompt_of_the_day.git /opt/prompt-of-the-day
cd /opt/prompt-of-the-day

# Set up environment
sudo cp .env.production.template .env.production
# Edit .env.production with your values

# Create data directory
sudo mkdir -p /opt/prompt-of-the-day/data
sudo chown -R 1001:1001 /opt/prompt-of-the-day/data

# Build and start
sudo docker-compose up --build -d
```

### 3. Nginx Configuration

```bash
# Copy nginx config
sudo cp nginx/prompt-of-the-day.conf /etc/nginx/sites-available/
sudo sed -i 's/YOUR_DOMAIN_HERE/your-actual-domain.com/g' /etc/nginx/sites-available/prompt-of-the-day.conf

# Enable site
sudo ln -sf /etc/nginx/sites-available/prompt-of-the-day.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL Setup (Optional)

```bash
# Only if you have a domain name
sudo certbot --nginx -d your-domain.com --non-interactive --agree-tos --email admin@your-domain.com
```

## Post-Deployment

### Health Check

Visit `http://your-domain.com/api/health` to verify the application is running.

### Set Up Automated Backups

```bash
# Set up daily backups
sudo crontab -e
# Add this line:
# 0 2 * * * /opt/prompt-of-the-day/scripts/backup.sh
```

### Monitor Logs

```bash
# Application logs
cd /opt/prompt-of-the-day
sudo docker-compose logs -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Maintenance Commands

### Update Application

```bash
cd /opt/prompt-of-the-day
sudo git pull origin main
sudo docker-compose up --build -d
```

### Restart Services

```bash
# Restart application
sudo docker-compose restart

# Restart Nginx
sudo systemctl restart nginx
```

### View Status

```bash
# Check application status
sudo docker-compose ps

# Check nginx status
sudo systemctl status nginx

# Check health
curl http://localhost:3000/api/health
```

## Troubleshooting

### Application Won't Start

1. Check logs: `sudo docker-compose logs`
2. Verify environment variables in `.env.production`
3. Ensure data directory permissions: `sudo chown -R 1001:1001 /opt/prompt-of-the-day/data`

### Nginx Errors

1. Test config: `sudo nginx -t`
2. Check error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify application is running: `curl http://localhost:3000`

### SSL Issues

1. Check domain DNS records
2. Verify ports 80 and 443 are open
3. Re-run certbot: `sudo certbot --nginx -d your-domain.com`

## Security Considerations

1. **Firewall**: Configure UFW or Azure Security Groups
2. **Updates**: Keep system and Docker images updated
3. **Monitoring**: Set up log monitoring and alerts
4. **Backups**: Regular automated backups
5. **SSL**: Always use HTTPS in production

## Performance Optimization

1. **Resource Monitoring**: Monitor CPU, memory, and disk usage
2. **Scaling**: Consider multiple instances behind a load balancer
3. **Caching**: Implement Redis for caching if needed
4. **CDN**: Use Azure CDN for static assets

## Support

For issues and questions:
1. Check application logs
2. Review this deployment guide
3. Create an issue in the GitHub repository
