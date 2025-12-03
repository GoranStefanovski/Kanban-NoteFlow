#!/bin/bash

# ============================================
# Personal Notepad - Production Deployment Script
# Domain: domain.com
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Domain configuration
DOMAIN="domain.com"
WWW_DOMAIN="www.domain.com"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Personal Notepad - Production Deployment${NC}"
echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    print_warning "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Pre-deployment checklist
echo -e "${BLUE}📋 Pre-Deployment Checklist${NC}"
echo "=================================="
echo ""

# Check 1: Environment file
echo -n "Checking for .env.production file... "
if [ -f ".env.production" ]; then
    print_success "Found"
    
    # Check if critical values are still default
    if grep -q "CHANGE_THIS" .env.production; then
        print_error "Environment file contains default values!"
        print_warning "Please update .env.production with your actual credentials"
        echo ""
        echo "Required changes:"
        echo "  - JWT_SECRET (generate with: openssl rand -base64 64)"
        echo "  - ADMIN_EMAIL"
        echo "  - ADMIN_PASSWORD"
        echo "  - SMTP_USER"
        echo "  - SMTP_PASSWORD"
        exit 1
    fi
    
    # Copy to .env if not exists or if user confirms
    if [ ! -f ".env" ] || [ ".env.production" -nt ".env" ]; then
        print_info "Copying .env.production to .env"
        cp .env.production .env
        chmod 600 .env
    fi
else
    print_error "Not found"
    print_warning "Please create .env.production file first"
    exit 1
fi

# Check 2: Docker
echo -n "Checking Docker installation... "
if command -v docker &> /dev/null; then
    print_success "Installed ($(docker --version | cut -d' ' -f3))"
else
    print_error "Not installed"
    echo "Please install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check 3: Docker Compose
echo -n "Checking Docker Compose... "
if docker compose version &> /dev/null; then
    print_success "Installed ($(docker compose version | cut -d' ' -f4))"
else
    print_error "Not installed"
    echo "Please install Docker Compose plugin"
    exit 1
fi

# Check 4: Nginx
echo -n "Checking Nginx installation... "
if command -v nginx &> /dev/null; then
    print_success "Installed ($(nginx -v 2>&1 | cut -d'/' -f2))"
else
    print_warning "Not installed"
    print_info "Nginx is required for production deployment"
    read -p "Install Nginx now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo apt update
        sudo apt install -y nginx
        print_success "Nginx installed"
    else
        print_error "Nginx is required. Exiting."
        exit 1
    fi
fi

# Check 5: DNS Configuration
echo -n "Checking DNS configuration for ${DOMAIN}... "
DNS_IP=$(dig +short ${DOMAIN} | tail -n1)
if [ -n "$DNS_IP" ]; then
    print_success "Resolves to ${DNS_IP}"
    
    # Get server's public IP
    SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "unknown")
    if [ "$DNS_IP" != "$SERVER_IP" ] && [ "$SERVER_IP" != "unknown" ]; then
        print_warning "DNS points to ${DNS_IP} but server IP is ${SERVER_IP}"
        print_info "Make sure DNS is correctly configured"
    fi
else
    print_warning "DNS not configured or not propagated yet"
    print_info "Please configure your DNS A record to point to this server"
fi

echo ""
echo -e "${BLUE}🚀 Starting Deployment${NC}"
echo "=================================="
echo ""

# Step 1: Stop existing containers
print_info "Stopping existing containers..."
docker compose down 2>/dev/null || true
print_success "Containers stopped"

# Step 2: Build and start containers
print_info "Building and starting containers..."
if docker compose up --build -d; then
    print_success "Containers started"
else
    print_error "Failed to start containers"
    exit 1
fi

# Step 3: Wait for services to be ready
print_info "Waiting for services to start..."
sleep 10

# Check container status
print_info "Checking container status..."
if docker compose ps | grep -q "Up"; then
    print_success "All containers running"
else
    print_error "Some containers failed to start"
    docker compose ps
    exit 1
fi

# Step 4: Configure Nginx
echo ""
print_info "Configuring Nginx..."

# Check if nginx config already exists
if [ -f "/etc/nginx/sites-available/notepad" ]; then
    print_warning "Nginx configuration already exists"
    read -p "Overwrite existing configuration? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Skipping Nginx configuration"
    else
        sudo cp nginx/notepad.conf /etc/nginx/sites-available/notepad
        print_success "Nginx configuration updated"
    fi
else
    sudo cp nginx/notepad.conf /etc/nginx/sites-available/notepad
    print_success "Nginx configuration installed"
fi

# Enable site
if [ ! -L "/etc/nginx/sites-enabled/notepad" ]; then
    sudo ln -s /etc/nginx/sites-available/notepad /etc/nginx/sites-enabled/
    print_success "Site enabled"
fi

# Remove default site if exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
    print_info "Default site removed"
fi

# Test Nginx configuration
print_info "Testing Nginx configuration..."
if sudo nginx -t; then
    print_success "Nginx configuration valid"
else
    print_error "Nginx configuration invalid"
    exit 1
fi

# Step 5: SSL Certificate Setup
echo ""
print_info "Checking SSL certificates..."

if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    print_success "SSL certificates found"
    
    # Check expiration
    CERT_EXPIRY=$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/${DOMAIN}/fullchain.pem | cut -d= -f2)
    print_info "Certificate expires: ${CERT_EXPIRY}"
    
    # Reload Nginx with SSL
    sudo systemctl reload nginx
    print_success "Nginx reloaded with SSL"
else
    print_warning "SSL certificates not found"
    print_info "You need to obtain SSL certificates using Certbot"
    echo ""
    echo "To obtain certificates, run:"
    echo "  sudo systemctl stop nginx"
    echo "  sudo certbot certonly --standalone -d ${DOMAIN} -d ${WWW_DOMAIN}"
    echo "  sudo systemctl start nginx"
    echo ""
    
    read -p "Do you want to obtain certificates now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if certbot is installed
        if ! command -v certbot &> /dev/null; then
            print_info "Installing Certbot..."
            sudo apt update
            sudo apt install -y certbot python3-certbot-nginx
        fi
        
        print_info "Stopping Nginx temporarily..."
        sudo systemctl stop nginx
        
        print_info "Obtaining SSL certificate..."
        if sudo certbot certonly --standalone -d ${DOMAIN} -d ${WWW_DOMAIN}; then
            print_success "SSL certificate obtained"
            
            print_info "Starting Nginx..."
            sudo systemctl start nginx
            print_success "Nginx started with SSL"
        else
            print_error "Failed to obtain SSL certificate"
            sudo systemctl start nginx
            print_warning "Nginx started without SSL"
        fi
    else
        # Start Nginx without SSL (temporary)
        print_warning "Starting Nginx without SSL (HTTP only)"
        sudo systemctl reload nginx || sudo systemctl start nginx
    fi
fi

# Step 6: Firewall Configuration
echo ""
print_info "Checking firewall configuration..."

if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status | grep -i "Status:" | awk '{print $2}')
    
    if [ "$UFW_STATUS" = "active" ]; then
        print_success "UFW firewall is active"
        
        # Check if required ports are open
        if ! sudo ufw status | grep -q "80/tcp"; then
            print_info "Opening port 80 (HTTP)..."
            sudo ufw allow 80/tcp
        fi
        
        if ! sudo ufw status | grep -q "443/tcp"; then
            print_info "Opening port 443 (HTTPS)..."
            sudo ufw allow 443/tcp
        fi
        
        print_success "Firewall configured"
    else
        print_warning "UFW firewall is not active"
        read -p "Enable firewall? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo ufw allow 22/tcp  # SSH
            sudo ufw allow 80/tcp  # HTTP
            sudo ufw allow 443/tcp # HTTPS
            sudo ufw --force enable
            print_success "Firewall enabled"
        fi
    fi
else
    print_warning "UFW not installed"
    print_info "Consider installing and configuring a firewall"
fi

# Final checks
echo ""
echo -e "${BLUE}🔍 Final Verification${NC}"
echo "=================================="
echo ""

# Check backend health
print_info "Checking backend health..."
if curl -sf http://localhost:3000/api > /dev/null 2>&1 || curl -sf http://localhost:3000/ > /dev/null 2>&1; then
    print_success "Backend is responding"
else
    print_warning "Backend may not be ready yet"
fi

# Check frontend health
print_info "Checking frontend health..."
if curl -sf http://localhost:3001 > /dev/null 2>&1; then
    print_success "Frontend is responding"
else
    print_warning "Frontend may not be ready yet"
fi

# Display summary
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📝 Access Information:${NC}"
echo "  Frontend:    https://${DOMAIN}"
echo "  Admin Login: https://${DOMAIN}/admin/login"
echo "  Public Login: https://${DOMAIN}/login"
echo ""
echo -e "${BLUE}🔐 Next Steps:${NC}"
echo "  1. Access the admin panel at https://${DOMAIN}/admin/login"
echo "  2. Login with credentials from .env file"
echo "  3. Change admin password immediately!"
echo "  4. Test email functionality"
echo "  5. Create your first project"
echo ""
echo -e "${BLUE}📊 Useful Commands:${NC}"
echo "  View logs:        docker compose logs -f"
echo "  Restart services: docker compose restart"
echo "  Stop services:    docker compose down"
echo "  View containers:  docker compose ps"
echo "  Nginx logs:       sudo tail -f /var/log/nginx/notepad-error.log"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  Full guide: DEPLOYMENT.md"
echo "  Docker info: DOCKER_README.md"
echo ""

# Show container status
echo -e "${BLUE}📦 Container Status:${NC}"
docker compose ps
echo ""

print_success "Deployment completed successfully!"

