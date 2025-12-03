# Personal Notepad Dashboard

A full-stack personalized notepad application with project management, note groups, and drag-and-drop functionality.

## Features

- **Admin Authentication**: Email/password login for administrators
- **Public User Authentication**: Username-based login with 6-digit email verification
- **Project Management**: Create, edit, and delete projects
- **Note Groups**: Organize notes into customizable groups with colors
- **Drag & Drop**: Move notes between groups with drag-and-drop
- **Role-Based Access**: Granular permissions for public users (read/write access per project)
- **Responsive UI**: Modern, clean interface built with TailwindCSS

## Tech Stack

### Backend (NestJS)
- NestJS 11
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer for email verification
- Passport JWT Strategy

### Frontend (Next.js)
- Next.js 14 with App Router
- TypeScript
- TailwindCSS
- Zustand for state management
- @dnd-kit for drag-and-drop
- Axios for API calls

## Project Structure

```
/
├── src/                          # NestJS backend
│   ├── auth/                     # Authentication module
│   ├── mail/                     # Email service
│   ├── projects/                 # Projects CRUD
│   ├── groups/                   # Groups CRUD
│   ├── notes/                    # Notes CRUD with drag-drop
│   ├── public-users/             # Public users management
│   ├── schemas/                  # Mongoose schemas
│   ├── guards/                   # Auth guards
│   ├── decorators/              # Custom decorators
│   └── seed/                     # Admin user seeding
├── client/                       # Next.js frontend
│   ├── app/                      # Next.js App Router pages
│   │   ├── admin/login/         # Admin login page
│   │   ├── login/               # Public user login page
│   │   └── dashboard/           # Main dashboard
│   ├── components/              # React components
│   ├── lib/                     # API client
│   ├── stores/                  # Zustand stores
│   └── types/                   # TypeScript types
└── .env                         # Environment variables
```

## Installation & Setup

> **For Production Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete production setup with domain, SSL, and Nginx.

### Prerequisites
- Node.js (v20+ recommended, v18.19+ minimum)
- MongoDB (local or Atlas)
- SMTP server credentials (Gmail, SendGrid, etc.)
- Docker & Docker Compose (for containerized deployment)

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone <repository-url>
cd personal-notepad

# 2. Create and configure environment
cp .env.example .env
nano .env  # Update with your values

# 3. Start all services
docker compose up --build -d

# 4. Access the application
# Frontend: http://localhost:3001
# Backend: http://localhost:3000/api
```

### 1. Clone and Install Dependencies (Development)

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/personal-notepad

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Admin Credentials (Initial Seed)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-secure-password

# SMTP Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_NAME=Personal Notepad
SMTP_FROM_EMAIL=noreply@example.com

# Application
PORT=3000
NODE_ENV=development
```

### 3. Configure Frontend Environment

Create a `.env.local` file in the `client` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Start MongoDB

Make sure MongoDB is running locally or configure the connection string to your MongoDB Atlas cluster.

```bash
# If using local MongoDB
mongod
```

### 5. Run the Application

**Backend (NestJS):**
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The backend will run on http://localhost:3000 (API at http://localhost:3000/api)

**Frontend (Next.js):**
```bash
cd client
npm run dev
```

The frontend will run on http://localhost:3001 (or next available port)

## Usage

### Admin Setup

1. On first run, an admin user is automatically created using the credentials in `.env`
2. Navigate to http://localhost:3001/admin/login
3. Login with your admin credentials
4. Create projects, groups, and notes
5. Create public users and assign them permissions

### Public User Login

1. Admin must first create a public user with username and email
2. Public user navigates to http://localhost:3001/login
3. Enter username → receives 6-digit code via email
4. Enter code → authenticated and redirected to dashboard
5. Can only see projects they have access to

### Creating Notes

1. Select a project from the sidebar
2. Click "Add Group" to create note groups
3. Click "Add Note" within a group to create notes
4. Drag notes between groups to reorganize

## API Endpoints

### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/public/request-code` - Request verification code
- `POST /api/auth/public/verify-code` - Verify code and login

### Projects
- `GET /api/projects` - List all projects (filtered by permissions)
- `POST /api/projects` - Create project (admin only)
- `PATCH /api/projects/:id` - Update project (admin only)
- `DELETE /api/projects/:id` - Delete project (admin only)

### Groups
- `GET /api/groups/project/:projectId` - List groups in project
- `POST /api/groups` - Create group (admin only)
- `PATCH /api/groups/:id` - Update group (admin only)
- `DELETE /api/groups/:id` - Delete group (admin only)

### Notes
- `GET /api/notes/group/:groupId` - List notes in group
- `POST /api/notes` - Create note
- `PATCH /api/notes/:id` - Update note
- `PATCH /api/notes/:id/move` - Move note to different group
- `DELETE /api/notes/:id` - Delete note

### Public Users
- `GET /api/public-users` - List all public users (admin only)
- `POST /api/public-users` - Create public user (admin only)
- `PATCH /api/public-users/:id` - Update user permissions (admin only)
- `DELETE /api/public-users/:id` - Delete user (admin only)

## Email Configuration

### Using Gmail

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in your `.env` file

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

### Using Other SMTP Providers

Update the SMTP configuration based on your provider's documentation.

## Development

### Running Tests

```bash
# Backend unit tests
npm run test

# Backend e2e tests
npm run test:e2e

# Frontend tests (if configured)
cd client
npm run test
```

### Code Linting

```bash
# Backend
npm run lint

# Frontend
cd client
npm run lint
```

## Production Deployment

For production deployment with a custom domain, SSL certificates, and Nginx reverse proxy, see:

**📘 [DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete production deployment guide

Quick deployment overview:
1. Set up Ubuntu/Debian server with Docker installed
2. Configure domain DNS (A record to server IP)
3. Copy `.env.example` to `.env` and configure
4. Install and configure Nginx reverse proxy
5. Obtain SSL certificates with Certbot
6. Run `docker compose up --build -d`

## Security Notes

1. **Change default credentials**: Update `ADMIN_EMAIL` and `ADMIN_PASSWORD` in production
2. **Strong JWT secret**: Use a long, random string for `JWT_SECRET`
3. **HTTPS in production**: Always use HTTPS for production deployments
4. **Environment variables**: Never commit `.env` files to version control
5. **Rate limiting**: Rate limiting is configured in Nginx for authentication endpoints
6. **Email verification**: Codes expire after 5 minutes for security
7. **Firewall**: Only expose ports 22, 80, and 443
8. **MongoDB**: Never expose MongoDB port to the internet

## Troubleshooting

### Backend won't start
- Check MongoDB is running and accessible
- Verify `.env` file exists and has correct values
- Check port 3000 is not already in use

### Frontend won't connect to backend
- Verify `NEXT_PUBLIC_API_URL` in `client/.env.local`
- Check CORS is enabled in backend
- Ensure backend is running

### Email verification not working
- Verify SMTP credentials are correct
- Check spam/junk folder
- Enable "Less secure app access" if using Gmail (or use App Password)

### Drag and drop not working
- Make sure you're using a supported browser (modern Chrome, Firefox, Safari, Edge)
- Check console for JavaScript errors

## License

UNLICENSED - Private Project

## Support

For issues or questions, please create an issue in the repository.
