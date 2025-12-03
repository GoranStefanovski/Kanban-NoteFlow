# Docker Setup Guide

## Quick Start

### 1. Configure Environment Variables

Edit `docker-compose.yml` and update these values:

```yaml
environment:
  - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-chars  # Change this!
  - ADMIN_EMAIL=admin@example.com  # Your admin email
  - ADMIN_PASSWORD=AdminPassword123  # Your admin password
  - SMTP_USER=your-email@gmail.com  # Your email
  - SMTP_PASSWORD=your-app-specific-password  # Your email app password
```

**Important**: For Gmail SMTP:
1. Go to https://myaccount.google.com/apppasswords
2. Generate an app password
3. Use that password in `SMTP_PASSWORD`

### 2. Build and Run

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode (background)
docker compose up --build -d
```

### 3. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **MongoDB**: localhost:27017 (from host machine)

### 4. Login

**Admin Login**: http://localhost:3001/admin/login
- Email: Value you set in `ADMIN_EMAIL`
- Password: Value you set in `ADMIN_PASSWORD`

**Public Login**: http://localhost:3001/login
- First create a public user from admin dashboard

## Docker Commands

### Basic Operations

```bash
# Start services
docker compose up

# Start in background
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Rebuild and start
docker compose up --build

# Restart a specific service
docker compose restart backend
docker compose restart frontend
```

### Viewing Logs

```bash
# View all logs
docker compose logs

# Follow logs (real-time)
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb

# View last 100 lines
docker compose logs --tail=100
```

### Accessing Containers

```bash
# Execute shell in backend container
docker compose exec backend sh

# Execute shell in frontend container
docker compose exec frontend sh

# Access MongoDB shell
docker compose exec mongodb mongosh personal-notepad

# View backend environment variables
docker compose exec backend env
```

### Managing Services

```bash
# Start only specific services
docker compose up backend mongodb

# Scale services (if needed)
docker compose up --scale backend=2

# View running containers
docker compose ps

# View resource usage
docker stats
```

### Troubleshooting

```bash
# Check service health
docker compose ps

# Inspect a service
docker compose exec backend wget -qO- http://localhost:3000/api

# View container details
docker inspect notepad-backend

# Remove all stopped containers and unused images
docker system prune -a
```

## Architecture

The Docker setup includes three services:

### 1. MongoDB (Database)
- **Image**: mongo:7.0
- **Port**: 27017
- **Volume**: `mongodb_data` (persists data)
- **Network**: notepad-network

### 2. Backend (NestJS API)
- **Build**: Multi-stage Dockerfile
- **Port**: 3000
- **Depends on**: MongoDB
- **Health check**: Every 30 seconds
- **Network**: notepad-network

### 3. Frontend (Next.js)
- **Build**: Multi-stage Dockerfile
- **Port**: 3001 (mapped to container port 3000)
- **Depends on**: Backend
- **Network**: notepad-network

## Volumes

Data is persisted in Docker volumes:

```bash
# List volumes
docker volume ls

# Inspect MongoDB volume
docker volume inspect personal-notepad_mongodb_data

# Backup MongoDB data
docker compose exec mongodb mongodump --out=/data/backup

# Remove volumes (WARNING: deletes all data)
docker compose down -v
```

## Environment Variables

You can override environment variables in multiple ways:

### Option 1: Edit docker-compose.yml (recommended)
Directly edit the `environment` section in `docker-compose.yml`.

### Option 2: Use .env file
Create a `.env` file in the root directory:

```env
JWT_SECRET=my-secret-key
ADMIN_EMAIL=admin@mycompany.com
ADMIN_PASSWORD=SecurePassword123
SMTP_USER=myemail@gmail.com
SMTP_PASSWORD=myapppassword
```

Then update `docker-compose.yml`:

```yaml
backend:
  env_file:
    - .env
```

### Option 3: Environment-specific files
Create different compose files:

```bash
# docker-compose.prod.yml
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Production Deployment

For production deployment:

1. **Update all secrets**:
   - Generate a strong JWT_SECRET (32+ characters)
   - Use strong admin password
   - Configure production SMTP server

2. **Use environment variables or secrets**:
   ```bash
   # Don't hardcode secrets in docker-compose.yml
   # Use Docker secrets or environment variables
   ```

3. **Enable SSL/TLS**:
   - Add nginx reverse proxy
   - Configure Let's Encrypt certificates

4. **Add backup strategy**:
   ```bash
   # Backup MongoDB regularly
   docker compose exec mongodb mongodump --out=/backup
   ```

5. **Monitor services**:
   ```bash
   # Check health and logs regularly
   docker compose logs -f
   ```

## Networking

All services communicate via the `notepad-network` bridge network:

```bash
# Inspect network
docker network inspect personal-notepad_notepad-network

# Test connectivity
docker compose exec backend ping mongodb
docker compose exec frontend ping backend
```

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up --build -d

# View updated services
docker compose ps
```

## Cleanup

```bash
# Stop and remove containers, networks
docker compose down

# Also remove volumes (deletes all data!)
docker compose down -v

# Remove unused Docker resources
docker system prune -a
```

## Common Issues

### Issue: Port already in use
```bash
# Check what's using the port
sudo lsof -i :3000
sudo lsof -i :3001
sudo lsof -i :27017

# Change ports in docker-compose.yml if needed
ports:
  - "3002:3000"  # Use different host port
```

### Issue: MongoDB connection failed
```bash
# Check if MongoDB is running
docker compose ps mongodb

# View MongoDB logs
docker compose logs mongodb

# Restart MongoDB
docker compose restart mongodb
```

### Issue: Build fails
```bash
# Clean build
docker compose build --no-cache

# Remove old images
docker image prune -a
```

### Issue: Permission denied
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

## Development vs Production

For **development**, you might want to mount source code:

```yaml
# Add to docker-compose.yml
backend:
  volumes:
    - ./src:/app/src  # Live reload
  command: npm run start:dev
```

For **production**, use the current setup with multi-stage builds.

## Support

For issues or questions:
1. Check logs: `docker compose logs -f`
2. Verify environment variables: `docker compose config`
3. Check container health: `docker compose ps`
4. Restart services: `docker compose restart`

---

Happy coding! 🚀

