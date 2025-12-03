# Quick Deployment Guide for domain.com

This is a streamlined guide to deploy Personal Notepad to production on **domain.com**.

## Prerequisites

- Ubuntu/Debian server with root/sudo access
- Domain `domain.com` pointing to your server IP
- Server requirements: 2GB RAM, 20GB storage, 2 CPU cores

## Quick Start (5 Steps)

### 1. Configure Environment Variables

```bash
cd /opt/personal-notepad
cp .env.production .env
nano .env
```

**Update these critical values:**
```bash
# Generate a strong JWT secret
JWT_SECRET=$(openssl rand -base64 64)

# Set your admin credentials
ADMIN_EMAIL=admin@domain.com
ADMIN_PASSWORD=YourStrongPassword123!

# Configure Gmail SMTP (or your email provider)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
```

**Gmail Setup:**
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password in `SMTP_PASSWORD`

### 2. Run Automated Deployment Script

```bash
./deploy.sh
```

This script will:
- ✅ Verify all prerequisites
- ✅ Check DNS configuration
- ✅ Build and start Docker containers
- ✅ Configure Nginx
- ✅ Obtain SSL certificates (optional)
- ✅ Configure firewall
- ✅ Verify deployment

### 3. Obtain SSL Certificate (if not done by script)

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d domain.com -d www.domain.com
sudo systemctl start nginx
```

### 4. Access Your Application

Open in browser:
- **Frontend**: https://domain.com
- **Admin Panel**: https://domain.com/admin/login

Login with credentials from `.env` file.

### 5. Post-Deployment Security

1. ✅ Change admin password immediately
2. ✅ Test email functionality
3. ✅ Verify SSL certificate is working
4. ✅ Check firewall status: `sudo ufw status`

## Manual Deployment (Alternative)

If you prefer manual deployment, follow these steps:

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone Repository

```bash
cd /opt
sudo git clone <your-repo-url> personal-notepad
cd personal-notepad
sudo chown -R $USER:$USER .
```

### 3. Configure Environment

```bash
cp .env.production .env
nano .env
# Update all CHANGE_THIS values
chmod 600 .env
```

### 4. Start Application

```bash
docker compose up --build -d
```

### 5. Configure Nginx

```bash
sudo cp nginx/notepad.conf /etc/nginx/sites-available/notepad
sudo ln -s /etc/nginx/sites-available/notepad /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Obtain SSL Certificate

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d domain.com -d www.domain.com
sudo systemctl start nginx
```

### 7. Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Verification Checklist

After deployment, verify:

- [ ] Application accessible at https://domain.com
- [ ] SSL certificate valid (green padlock in browser)
- [ ] Admin login works
- [ ] Email verification codes are received
- [ ] Can create projects and notes
- [ ] Firewall is active: `sudo ufw status`
- [ ] All containers running: `docker compose ps`

## Troubleshooting

### Application Not Accessible

```bash
# Check containers
docker compose ps
docker compose logs

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/notepad-error.log

# Check firewall
sudo ufw status
```

### SSL Certificate Issues

```bash
# List certificates
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL
openssl s_client -connect domain.com:443 -servername domain.com
```

### Email Not Working

```bash
# Check backend logs
docker compose logs backend | grep -i mail

# Test SMTP connection
telnet smtp.gmail.com 587
```

### Reset Admin Password

```bash
# Restart backend to re-run seed
docker compose restart backend

# Or manually in MongoDB
docker exec -it notepad-mongodb mongosh personal-notepad
db.admins.findOne()
```

## Maintenance Commands

```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose down

# Update application
git pull origin main
docker compose up --build -d

# Backup database
docker exec notepad-mongodb mongodump --db=personal-notepad --out=/tmp/backup
docker cp notepad-mongodb:/tmp/backup ~/backups/mongodb-$(date +%Y%m%d)
```

## Important Files

- `.env` - Environment configuration (DO NOT COMMIT)
- `docker-compose.yml` - Container orchestration
- `nginx/notepad.conf` - Nginx configuration
- `DEPLOYMENT.md` - Full deployment guide

## Security Checklist

- [ ] Strong JWT_SECRET generated
- [ ] Admin password changed from default
- [ ] Firewall enabled (ports 22, 80, 443 only)
- [ ] MongoDB not exposed to internet
- [ ] SSL certificate installed and auto-renewing
- [ ] SMTP credentials secured
- [ ] Regular backups configured

## Support

For detailed information, see:
- **Full Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Docker Info**: [DOCKER_README.md](DOCKER_README.md)
- **Environment Setup**: [ENV_SETUP.md](ENV_SETUP.md)

## Next Steps

1. Set up automated backups
2. Configure monitoring (Uptime Kuma, etc.)
3. Set up staging environment
4. Configure CDN (Cloudflare)
5. Enable database indexing

---

**Need Help?**
- Check logs: `docker compose logs -f`
- Review full guide: `DEPLOYMENT.md`
- Check container status: `docker compose ps`

