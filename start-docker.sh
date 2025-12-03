#!/bin/bash

echo "🚀 Personal Notepad - Docker Setup"
echo "=================================="
echo ""

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker found"
echo ""

# Remind user to configure environment variables
echo "⚠️  IMPORTANT: Before starting, make sure you've updated the environment variables in docker-compose.yml:"
echo "   - JWT_SECRET (use a strong random string)"
echo "   - ADMIN_EMAIL (your admin email)"
echo "   - ADMIN_PASSWORD (your admin password)"
echo "   - SMTP_USER (your email address)"
echo "   - SMTP_PASSWORD (your email app password from https://myaccount.google.com/apppasswords)"
echo ""

read -p "Have you updated the environment variables? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please update the environment variables in docker-compose.yml first."
    exit 1
fi

echo ""
echo "🏗️  Building and starting containers..."
echo ""

# Build and start containers
docker compose up --build -d

# Wait a bit for services to start
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check if containers are running
echo ""
echo "📊 Container Status:"
docker compose ps

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "🌐 Access your application:"
echo "   Frontend:    http://localhost:3001"
echo "   Backend API: http://localhost:3000/api"
echo ""
echo "👤 Admin Login: http://localhost:3001/admin/login"
echo "   Email:    (value from ADMIN_EMAIL in docker-compose.yml)"
echo "   Password: (value from ADMIN_PASSWORD in docker-compose.yml)"
echo ""
echo "📝 Useful commands:"
echo "   View logs:        docker compose logs -f"
echo "   Stop services:    docker compose down"
echo "   Restart:          docker compose restart"
echo "   View containers:  docker compose ps"
echo ""
echo "📖 For more information, see DOCKER_README.md"
echo ""

