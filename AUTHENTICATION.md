# Authentication System Documentation

This document provides an overview of the authentication system implemented in the Cricket120 platform.

## Features

- User registration with email verification
- Secure login with JWT authentication
- Password reset functionality
- Protected routes
- Input validation
- Error handling

## Environment Variables

Copy `.env.example` to `.env` and update the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=cricket_platform

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

## API Endpoints

### Authentication

#### Register a new user
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Verify Email
```
GET /api/auth/verify-email?token=verification_token_here
```

#### Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```
POST /api/auth/reset-password?token=reset_token_here
Content-Type: application/json

{
  "newPassword": "NewSecurePass123!"
}
```

## Frontend Integration

### Required Dependencies

Install the required frontend dependencies:
```bash
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled @mui/icons-material formik yup
```

### Protected Routes

Use the `ProtectedRoute` component to protect routes that require authentication:

```jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};
```

## Email Setup

For Gmail SMTP, you'll need to:

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password for your application
3. Use the generated password in the `SMTP_PASS` environment variable

## Security Considerations

- Passwords are hashed using bcrypt before storage
- JWT tokens are used for stateless authentication
- Password reset tokens expire after 1 hour
- Email verification is required before login
- Input validation is performed on both client and server
- Rate limiting is in place to prevent brute force attacks

## Error Handling

The API returns standardized error responses in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Testing

To test the authentication flow:

1. Register a new user
2. Check your email for the verification link
3. Click the verification link
4. Login with your credentials
5. Test protected routes
6. Test password reset flow

## Troubleshooting

- **Email not received**: Check spam folder and SMTP configuration
- **Invalid credentials**: Verify email and password
- **Token expired**: Request a new verification/reset email
- **Database connection issues**: Verify database credentials and connection settings
