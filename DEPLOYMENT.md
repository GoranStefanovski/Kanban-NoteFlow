# Production Deployment Guide

This guide provides step-by-step instructions for deploying Personal Notepad to a production server with a custom domain.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Server Preparation](#server-preparation)
- [Domain Configuration](#domain-configuration)
- [Application Setup](#application-setup)
- [Nginx Installation](#nginx-installation)
- [SSL Certificate Setup](#ssl-certificate-setup)
- [Application Deployment](#application-deployment)
- [Firewall Configuration](#firewall-configuration)
- [Post-Deployment](#post-deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04/22.04 LTS or Debian 11/12 (recommended)
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **CPU**: 2 cores recommended
- **Root/sudo access**

### Domain Requirements
- A registered domain name (e.g., example.com)
- Access to DNS management panel

### Local Requirements
- Git installed
- SSH client

---

## Server Preparation

### 1. Connect to Your Server

```bash
ssh root@your-server-ip
# Or if using a non-root user:
ssh username@your-server-ip
```

### 2. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. Install Docker

```bash
# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

### 4. Install Nginx

```bash
sudo apt install -y nginx

# Verify installation
nginx -v

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Domain Configuration

### 1. Configure DNS Records

In your domain registrar's DNS management panel, create an **A record**:

```
Type: A
Name: @ (or leave blank for root domain)
Value: YOUR_SERVER_IP_ADDRESS
TTL: 3600 (or default)
```

If you want to support www subdomain:
```
Type: A
Name: www
Value: YOUR_SERVER_IP_ADDRESS
TTL: 3600
```

### 2. Verify DNS Propagation

```bash
# Check if DNS is pointing to your server
dig example.com +short
# Should return your server IP

# Or use nslookup
nslookup example.com
```

DNS propagation can take 5 minutes to 48 hours. Most providers propagate within 1-2 hours.

---

## Application Setup

### 1. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/yourusername/personal-notepad.git
cd personal-notepad
```

Or if transferring files directly:
```bash
cd /opt
sudo mkdir personal-notepad
cd personal-notepad
# Transfer files using scp, rsync, or sftp
```

### 2. Configure Environment Variables

```bash
# Copy the example file
sudo cp .env.example .env

# Edit with your preferred editor
sudo nano .env
# or
sudo vim .env
```

**Important variables to update:**

```env
# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set admin credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePassword123!

# Configure SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourdomain.com

# MongoDB URI (keep default for Docker)
MONGODB_URI=mongodb://mongodb:27017/personal-notepad

# Environment
NODE_ENV=production
```

**Gmail SMTP Setup:**
1. Enable 2-factor authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate a new app password
4. Use the 16-character password in SMTP_PASSWORD

### 3. Set Proper Permissions

```bash
sudo chown -R $USER:$USER /opt/personal-notepad
chmod 600 /opt/personal-notepad/.env
```

---

## Nginx Installation

### 1. Install Nginx Configuration

```bash
# Copy configuration file
sudo cp /opt/personal-notepad/nginx/notepad.conf /etc/nginx/sites-available/notepad

# Update domain name in the config
sudo sed -i 's/example.com/yourdomain.com/g' /etc/nginx/sites-available/notepad
```

### 2. Create Certbot Directory

```bash
sudo mkdir -p /var/www/certbot
```

### 3. Test Configuration (Temporarily)

First, we'll comment out SSL-related lines since we don't have certificates yet:

```bash
sudo nano /etc/nginx/sites-available/notepad
```

Comment out these lines in the HTTPS server block (add # at the beginning):
```nginx
#    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
#    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
#    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
```

Temporarily change the listen directive:
```nginx
    listen 80;  # Change from 443 ssl http2
    # listen [::]:80;  # Change from [::]:443 ssl http2
```

### 4. Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/notepad /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## SSL Certificate Setup

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service
# - Choose whether to share email with EFF
```

### 3. Restore Full Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/notepad
```

Uncomment the SSL lines and restore the listen directives:
```nginx
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
```

### 4. Test and Restart Nginx

```bash
# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
```

### 5. Setup Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# Certbot automatically installs a systemd timer for renewal
# Verify it's active:
sudo systemctl list-timers | grep certbot
```

---

## Application Deployment

### 1. Build and Start Containers

```bash
cd /opt/personal-notepad

# Build and start in detached mode
docker compose up --build -d
```

This will:
- Build the backend and frontend images
- Start MongoDB, backend, and frontend containers
- Seed the admin user
- Set up the Docker network

### 2. Verify Containers

```bash
# Check running containers
docker compose ps

# All services should show "running"
# View logs
docker compose logs -f

# Press Ctrl+C to stop following logs

# Check specific service logs
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb
```

### 3. Verify Application Health

```bash
# Check backend health
curl http://localhost:3000/api

# Should return: "Cannot GET /api"

# Check frontend
curl http://localhost:3001

# Should return HTML content
```

---

## Firewall Configuration

### 1. Install UFW (if not installed)

```bash
sudo apt install -y ufw
```

### 2. Configure Firewall Rules

```bash
# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**Output should show:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## Post-Deployment

### 1. Access Your Application

Open your browser and navigate to:
- **Frontend**: https://yourdomain.com
- **Admin Login**: https://yourdomain.com/admin/login
- **Public Login**: https://yourdomain.com/login

### 2. First-Time Login

1. Go to https://yourdomain.com/admin/login
2. Use credentials from your `.env` file:
   - Email: Your ADMIN_EMAIL
   - Password: Your ADMIN_PASSWORD
3. **IMPORTANT**: Change your admin password immediately in Settings!

### 3. Test Email Functionality

1. Create a public user with a valid email
2. Try logging in as that public user
3. Verify you receive the 6-digit verification code

### 4. Create Test Project

1. Create a test project
2. Add groups and notes
3. Test drag-and-drop functionality
4. Assign permissions to public users

---

## Maintenance

### Viewing Logs

```bash
# View all logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View specific service logs
docker compose logs backend
docker compose logs frontend
docker compose logs mongodb

# View Nginx logs
sudo tail -f /var/log/nginx/notepad-access.log
sudo tail -f /var/log/nginx/notepad-error.log
```

### Updating the Application

```bash
cd /opt/personal-notepad

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose up --build -d

# Or with no downtime (rolling restart)
docker compose up -d --build --no-deps backend
docker compose up -d --build --no-deps frontend
```

### Backing Up Data

#### MongoDB Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Backup MongoDB
docker exec notepad-mongodb mongodump \
  --db=personal-notepad \
  --out=/tmp/backup

docker cp notepad-mongodb:/tmp/backup ~/backups/mongodb-$(date +%Y%m%d-%H%M%S)

# Automated daily backups (crontab)
crontab -e

# Add this line:
# 0 2 * * * docker exec notepad-mongodb mongodump --db=personal-notepad --out=/tmp/backup && docker cp notepad-mongodb:/tmp/backup ~/backups/mongodb-$(date +\%Y\%m\%d) && find ~/backups -type d -mtime +30 -delete
```

#### Restore from Backup

```bash
# Copy backup to container
docker cp ~/backups/mongodb-20240101 notepad-mongodb:/tmp/restore

# Restore
docker exec notepad-mongodb mongorestore \
  --db=personal-notepad \
  /tmp/restore/personal-notepad
```

### Restarting Services

```bash
# Restart all containers
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend

# Restart Nginx
sudo systemctl restart nginx
```

### Stopping the Application

```bash
cd /opt/personal-notepad

# Stop all containers
docker compose down

# Stop and remove volumes (WARNING: deletes data!)
docker compose down -v
```

---

## Troubleshooting

### Application Not Accessible

**Check Nginx:**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo journalctl -u nginx -f
```

**Check Containers:**
```bash
docker compose ps
docker compose logs
```

**Check Firewall:**
```bash
sudo ufw status
```

### SSL Certificate Issues

**Certificate not found:**
```bash
# List certificates
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

**Test SSL:**
```bash
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Database Connection Issues

```bash
# Check MongoDB logs
docker compose logs mongodb

# Access MongoDB shell
docker exec -it notepad-mongodb mongosh personal-notepad

# Inside MongoDB shell:
show collections
db.admins.find()
exit
```

### Email Not Sending

**Check SMTP settings in `.env`**

**Test SMTP connection:**
```bash
# Install telnet
sudo apt install telnet

# Test connection
telnet smtp.gmail.com 587

# Should connect successfully
```

**Check backend logs:**
```bash
docker compose logs backend | grep -i mail
```

### High Memory Usage

```bash
# Check container resource usage
docker stats

# Set memory limits in docker-compose.yml:
services:
  backend:
    mem_limit: 512m
  frontend:
    mem_limit: 512m
  mongodb:
    mem_limit: 1g
```

### Cannot Access Admin Panel

1. Verify admin user exists:
```bash
docker exec -it notepad-mongodb mongosh personal-notepad
db.admins.findOne()
```

2. Reset admin password:
```bash
# Re-run seed
docker compose restart backend
```

### Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Or
sudo netstat -tulpn | grep 3000

# Kill the process
sudo kill -9 <PID>
```

---

## Security Checklist

- [ ] Strong, unique JWT_SECRET set
- [ ] Admin password changed from default
- [ ] Firewall enabled (ports 22, 80, 443 only)
- [ ] MongoDB not exposed to internet
- [ ] SSL certificate installed and auto-renewing
- [ ] SMTP credentials secured
- [ ] Regular backups configured
- [ ] Server OS kept up to date
- [ ] Application regularly updated
- [ ] Strong passwords for all accounts
- [ ] Rate limiting enabled in Nginx
- [ ] Security headers configured

---

## Performance Tips

1. **Enable Gzip in Nginx** (already configured in notepad.conf)
2. **Use CDN** for static assets (Cloudflare free tier)
3. **Monitor resources** with `htop` or monitoring tools
4. **Set up log rotation** to prevent disk space issues
5. **Use Docker logs driver** for centralized logging
6. **Regular database maintenance:**
   ```bash
   docker exec notepad-mongodb mongosh personal-notepad --eval "db.runCommand({compact: 'notes'})"
   ```

---

## Support

For issues or questions:
1. Check application logs: `docker compose logs`
2. Check Nginx logs: `/var/log/nginx/`
3. Review this troubleshooting guide
4. Check GitHub issues
5. Create a new issue with detailed logs

---

## Next Steps

- Set up monitoring (Uptime Kuma, Prometheus, etc.)
- Configure automated backups to cloud storage
- Set up email alerts for application errors
- Consider adding a CDN (Cloudflare)
- Implement database indexing for performance
- Set up staging environment for testing updates

