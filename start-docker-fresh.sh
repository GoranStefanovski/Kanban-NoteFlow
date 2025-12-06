#!/bin/bash

echo "🔄 Personal Notepad - Fresh Database Setup"
echo "==========================================="
echo ""

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker found"
echo ""

# WARNING MESSAGE
echo "⚠️  WARNING: DESTRUCTIVE OPERATION ⚠️"
echo "=========================================="
echo ""
echo "This script will:"
echo "  1. Stop all containers"
echo "  2. PERMANENTLY DELETE all database data (MongoDB volume)"
echo "  3. Remove all container data"
echo "  4. Rebuild and start everything fresh"
echo ""
echo "❌ ALL DATA WILL BE LOST including:"
echo "   - All projects, groups, and notes"
echo "   - All public users"
echo "   - All comments and activity logs"
echo "   - Admin user (will be recreated from .env)"
echo ""
echo "This is useful for:"
echo "   ✓ Development/testing when you need a clean slate"
echo "   ✓ Fixing database corruption issues"
echo "   ✓ Starting over with fresh seed data"
echo ""

# Confirmation prompt
read -p "⚠️  Are you ABSOLUTELY SURE you want to delete all data? (yes/no) " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Operation cancelled. No changes made."
    echo ""
    echo "💡 Tip: Use 'docker compose restart' to restart without losing data"
    exit 0
fi

echo ""
echo "🛑 Stopping all containers..."
docker compose down

if [ $? -ne 0 ]; then
    echo "❌ Failed to stop containers"
    exit 1
fi

echo ""
echo "🗑️  Removing volumes (deleting all data)..."
docker compose down -v

if [ $? -ne 0 ]; then
    echo "❌ Failed to remove volumes"
    exit 1
fi

echo ""
echo "🏗️  Rebuilding and starting containers..."
echo ""

# Build and start containers
docker compose up --build -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to build and start containers"
    exit 1
fi

# Wait a bit for services to start
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check if containers are running
echo ""
echo "📊 Container Status:"
docker compose ps

echo ""
echo "==========================================="
echo "✅ Fresh Setup Complete!"
echo "==========================================="
echo ""
echo "🌐 Access your application:"
echo "   Frontend:    http://localhost:3001"
echo "   Backend API: http://localhost:3000/api"
echo ""
echo "👤 Admin Login: http://localhost:3001/admin/login"
echo "   Email:    (value from ADMIN_EMAIL in .env)"
echo "   Password: (value from ADMIN_PASSWORD in .env)"
echo ""
echo "🔄 The admin user has been recreated from your .env file"
echo "📝 All other data has been wiped - start fresh!"
echo ""
echo "📝 Useful commands:"
echo "   View logs:        docker compose logs -f"
echo "   Stop services:    docker compose down"
echo "   Restart:          docker compose restart"
echo "   View containers:  docker compose ps"
echo ""
echo "💡 Next time, use './start-docker.sh' for normal startup"
echo "   (without deleting data)"
echo ""

