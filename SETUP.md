# B2B Portal Setup Guide

## Environment Configuration

This project supports multiple environments with different API endpoints:

### Local Development
- Uses `.env.local`
- API Base URL: `http://localhost:5001`
- NextAuth URL: `http://localhost:3000`

### Development Environment
- Uses `.env.development`
- API Base URL: `https://dev.eassylife.in`
- NextAuth URL: `https://dev.eassylife.in`

### Production Environment
- Uses `.env.production`
- API Base URL: `https://app.eassylife.in`
- NextAuth URL: `https://app.eassylife.in`

## API Endpoints

The application expects the following API endpoints:

1. **Email/Password Login**: `POST /b2b/login`
   - Body: `{ "email": "user@example.com", "password": "password123" }`
   - Response: User object with authentication token
   - Sets `b2b_customer_token` cookie automatically

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env.local` for local development
   - Update the `NEXTAUTH_SECRET` with a secure random string
   - Configure Google OAuth credentials (see Google OAuth Setup below)
   - Ensure API endpoints are correctly configured

3. **Google OAuth Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set Application type to "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://yourdomain.com/api/auth/callback/google`
   - Copy the Client ID and Client Secret to your `.env.local` file:
     ```
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     ```

4. **Run the Application**
   ```bash
   # Development
   npm run dev

   # Production build
   npm run build
   npm start
   ```

## Authentication Flow

### Email/Password Authentication
1. User enters email and password on `/login`
2. System calls `POST /b2b/login` with credentials
3. On successful authentication, token is set as `b2b_customer_token` cookie
4. User is redirected to `/dashboard`

### Google OAuth Authentication
1. User clicks "Sign in with Google" on `/login`
2. User is redirected to Google OAuth consent screen
3. After consent, Google redirects back to the application
4. NextAuth handles the OAuth flow and creates a session
5. User is redirected to `/dashboard`

## Pages

- `/` - Home page (redirects to login or dashboard based on auth status)
- `/login` - Authentication page with email/password and Google sign-in options
- `/dashboard` - Protected dashboard page

## Authentication Features

- **Dual Authentication**: Support for both email/password and Google OAuth
- **Automatic Cookie Management**: B2B customer token automatically set as cookie
- **Session Management**: Unified session handling for both authentication methods
- **Protected Routes**: Automatic redirection for unauthenticated users
- **User Profile**: Access to user information regardless of authentication method

## Security Notes

- All authentication is handled through NextAuth.js
- OTP verification is done server-side
- Session management uses JWT tokens
- Protected routes automatically redirect to login if not authenticated
