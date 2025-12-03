# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client && npm install && cd ..
```

### 2. Create Environment Files

**Backend `.env` (root directory):**
```bash
cp .env.example .env
# Edit .env with your actual values
```

**Frontend `client/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Configure MongoDB

Option A: Local MongoDB
```bash
# Install and start MongoDB
mongod
```

Option B: MongoDB Atlas
```bash
# Get connection string from Atlas and update MONGODB_URI in .env
```

### 4. Configure Email (SMTP)

For Gmail:
1. Go to https://myaccount.google.com/apppasswords
2. Generate app password
3. Update `.env`:
```env
SMTP_USER=youremail@gmail.com
SMTP_PASSWORD=your-app-password
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 6. Access the Application

- **Public Login**: http://localhost:3001/login
- **Admin Login**: http://localhost:3001/admin/login
- **Backend API**: http://localhost:3000/api

### 7. First Time Login

**Admin:**
- Email: Value from `ADMIN_EMAIL` in `.env`
- Password: Value from `ADMIN_PASSWORD` in `.env`

## Quick Test Workflow

1. Login as admin at `/admin/login`
2. Create a project (e.g., "My First Project")
3. Select the project from sidebar
4. Create a group (e.g., "Todo")
5. Create another group (e.g., "Done")
6. Add notes to groups
7. Drag notes between groups
8. Create a public user with username and email
9. Assign project permissions to the public user
10. Logout and test public user login at `/login`

## Common Commands

```bash
# Backend
npm run start:dev        # Start backend in dev mode
npm run build           # Build backend
npm run start:prod      # Start backend in production
npm run lint            # Lint backend code

# Frontend
cd client
npm run dev             # Start frontend in dev mode
npm run build          # Build frontend for production
npm run start          # Start frontend in production
npm run lint           # Lint frontend code
```

## Troubleshooting Quick Fixes

**Backend won't start:**
```bash
# Check MongoDB is running
ps aux | grep mongod

# Check port availability
lsof -i :3000
```

**Frontend won't connect:**
```bash
# Verify backend is running
curl http://localhost:3000/api

# Check .env.local exists
cat client/.env.local
```

**Email not sending:**
- Check SMTP credentials in `.env`
- Test with a simple SMTP tester
- Check firewall settings for port 587

## Default Credentials

**Admin (created automatically on first run):**
- Email: From `.env` - `ADMIN_EMAIL`
- Password: From `.env` - `ADMIN_PASSWORD`

⚠️ **IMPORTANT**: Change these credentials in production!

## Next Steps

1. Create your first project
2. Invite team members as public users
3. Customize note groups and colors
4. Start organizing your notes!

For more detailed information, see the main [README.md](./README.md)

