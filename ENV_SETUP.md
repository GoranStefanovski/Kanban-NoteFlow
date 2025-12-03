# Environment Variables Setup

This application requires environment variables to be configured before running. Follow these steps:

## 1. Create .env file

Copy the example file to create your own `.env`:

```bash
cp .env.example .env
```

## 2. Configure Required Variables

Edit the `.env` file and update the following **required** variables:

### JWT Configuration (REQUIRED)
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```
**Important**: Generate a strong random string for production!

### Admin Credentials (REQUIRED)
```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=AdminPassword123
```
**Important**: Change these from defaults for security!

### SMTP Configuration (REQUIRED for email verification)
```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

**Note**: For testing, you can use [Mailtrap.io](https://mailtrap.io) or similar services.

## 3. Optional Variables

These have default values but can be customized:

```
MONGODB_URI=mongodb://mongodb:27017/personal-notepad  # Default is fine for Docker
JWT_EXPIRES_IN=7d                                       # Token expiration
SMTP_SECURE=false                                       # Use TLS (true/false)
SMTP_FROM_NAME=Personal Notepad                        # Sender name
PORT=3000                                               # Backend port
NODE_ENV=production                                     # Environment
```

## 4. Start the Application

```bash
docker compose up --build -d
```

## Security Notes

- ⚠️ **Never commit the `.env` file** to version control (it's in `.gitignore`)
- ✅ The `.env.example` file is safe to commit (contains no secrets)
- 🔐 Use strong, unique values for `JWT_SECRET` and `ADMIN_PASSWORD` in production
- 📧 Use a real SMTP service in production (not Mailtrap)

## Generating a Strong JWT Secret

```bash
# Using openssl
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
