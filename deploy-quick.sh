#!/bin/bash

# ============================================
# Personal Notepad - Quick Deployment Script
# Assumes Nginx is already configured
# ============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}Personal Notepad - Quick Deployment${NC}"
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

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Quick checks
echo -e "${BLUE}🔍 Pre-Deployment Checks${NC}"
echo "=================================="
echo ""

# Check 1: Environment file
echo -n "Checking for .env file... "
if [ -f ".env" ]; then
    print_success "Found"
    
    # Check if critical values are still default
    if grep -q "CHANGE_THIS" .env 2>/dev/null; then
        print_error "Environment file contains default values!"
        print_warning "Please update .env with your actual credentials"
        exit 1
    fi
elif [ -f ".env.production" ]; then
    print_info "Found .env.production, copying to .env"
    cp .env.production .env
    chmod 600 .env
    print_success ".env created"
else
    print_error "No .env file found"
    print_warning "Please create .env or .env.production file first"
    exit 1
fi

# Check 2: Docker
echo -n "Checking Docker... "
if command -v docker &> /dev/null; then
    print_success "OK"
else
    print_error "Docker not installed"
    exit 1
fi

# Check 3: Docker Compose
echo -n "Checking Docker Compose... "
if docker compose version &> /dev/null; then
    print_success "OK"
else
    print_error "Docker Compose not installed"
    exit 1
fi

# Check 4: Nginx
echo -n "Checking Nginx... "
if command -v nginx &> /dev/null; then
    print_success "OK"
else
    print_error "Nginx not installed"
    exit 1
fi

# Check 5: Nginx configuration
echo -n "Checking Nginx configuration... "
if [ -f "/etc/nginx/sites-available/notepad" ] && [ -L "/etc/nginx/sites-enabled/notepad" ]; then
    print_success "OK"
else
    print_warning "Nginx configuration not found at /etc/nginx/sites-available/notepad"
    print_info "Please ensure nginx/notepad.conf is properly installed"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}🚀 Starting Deployment${NC}"
echo "=================================="
echo ""

# Step 1: Stop existing containers
print_info "Stopping existing containers..."
docker compose down 2>/dev/null || true
print_success "Containers stopped"

# Step 2: Remove old images (optional - keeps builds fresh)
print_info "Removing old images..."
docker compose down --rmi local 2>/dev/null || true
print_success "Old images removed"

# Step 3: Build and start containers
print_info "Building and starting containers (this may take a few minutes)..."
if docker compose up --build -d; then
    print_success "Containers built and started"
else
    print_error "Failed to start containers"
    echo ""
    echo "Check logs with: docker compose logs"
    exit 1
fi

# Step 4: Wait for services to be ready
print_info "Waiting for services to initialize..."
sleep 15

# Check container health
print_info "Checking container status..."
RUNNING_CONTAINERS=$(docker compose ps | grep -c "Up" || true)
if [ "$RUNNING_CONTAINERS" -ge 3 ]; then
    print_success "All containers running"
else
    print_warning "Some containers may not be running properly"
    docker compose ps
fi

# Step 5: Test Nginx configuration
echo ""
print_info "Testing Nginx configuration..."
if sudo nginx -t 2>/dev/null; then
    print_success "Nginx configuration valid"
else
    print_error "Nginx configuration has errors"
    exit 1
fi

# Step 6: Reload Nginx
print_info "Reloading Nginx..."
if sudo systemctl reload nginx; then
    print_success "Nginx reloaded"
else
    print_warning "Failed to reload Nginx, trying restart..."
    sudo systemctl restart nginx
    print_success "Nginx restarted"
fi

# Step 7: Health checks
echo ""
echo -e "${BLUE}🏥 Health Checks${NC}"
echo "=================================="
echo ""

# Wait a bit more for services to fully start
sleep 5

# Check MongoDB
print_info "Checking MongoDB..."
if docker compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    print_success "MongoDB is healthy"
else
    print_warning "MongoDB may not be ready yet"
fi

# Check Backend
print_info "Checking Backend..."
MAX_ATTEMPTS=10
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:3000/api >/dev/null 2>&1 || curl -sf http://localhost:3000/ >/dev/null 2>&1; then
        print_success "Backend is responding"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        sleep 2
    else
        print_warning "Backend is not responding yet (may still be starting up)"
    fi
done

# Check Frontend
print_info "Checking Frontend..."
MAX_ATTEMPTS=10
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -sf http://localhost:3001 >/dev/null 2>&1; then
        print_success "Frontend is responding"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        sleep 2
    else
        print_warning "Frontend is not responding yet (may still be starting up)"
    fi
done

# Final summary
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Get domain from nginx config or use default
DOMAIN=$(grep -oP 'server_name\s+\K[^;]+' /etc/nginx/sites-available/notepad 2>/dev/null | head -1 | awk '{print $1}' || echo "your-domain.com")

echo -e "${BLUE}📝 Access Information:${NC}"
echo "  Frontend:     https://${DOMAIN}"
echo "  Admin Login:  https://${DOMAIN}/admin/login"
echo "  Public Login: https://${DOMAIN}/login"
echo ""

echo -e "${BLUE}📊 Useful Commands:${NC}"
echo "  View logs (all):     docker compose logs -f"
echo "  View backend logs:   docker compose logs -f backend"
echo "  View frontend logs:  docker compose logs -f frontend"
echo "  Restart services:    docker compose restart"
echo "  Stop services:       docker compose down"
echo "  View containers:     docker compose ps"
echo "  Nginx error logs:    sudo tail -f /var/log/nginx/notepad-error.log"
echo "  Nginx access logs:   sudo tail -f /var/log/nginx/notepad-access.log"
echo ""

# Show container status
echo -e "${BLUE}📦 Container Status:${NC}"
docker compose ps
echo ""

print_success "Deployment completed successfully!"
echo ""
print_info "If services are not responding, check logs with: docker compose logs -f"



