# Google OAuth Integration for Buyer Authentication

This document provides a comprehensive guide for the Google OAuth integration implemented for buyer authentication in the Auqli platform.

## Overview

The Google OAuth integration allows buyers to:
- Register new accounts using their Google credentials
- Login to existing accounts using Google Sign-In
- Link Google accounts to existing email-based accounts
- Maintain secure session management with JWT tokens

## Implementation Details

### 1. Database Schema

The `Buyer` model includes Google OAuth fields:

```javascript
// Google OAuth fields in Buyer schema
googleId: { type: String, sparse: true },
authProvider: {
  type: String,
  enum: ['local', 'google'],
  default: 'local'
},
// Password is optional for Google OAuth users
password: {
  type: String,
  required: function() {
    return this.authProvider === 'local';
  }
}
```

### 2. Files Structure

#### Service Layer
- `src/modules/buyer/services/googleAuth.service.js` - Core Google OAuth business logic
- `src/modules/buyer/validators/googleAuth.validator.js` - Input validation for Google OAuth requests

#### Controller Layer
- Added `googleAuth` method to `src/modules/buyer/controllers/buyer.controller.js`

#### Repository Layer
- Added `findByGoogleId` method to `src/modules/buyer/repositories/buyer.repository.js`

#### Routes
- Added `/api/v2/buyers/auth/google-auth` POST endpoint with Swagger documentation

### 3. Dependencies

The following package is used (already installed for seller OAuth):
- `google-auth-library` - Official Google authentication library for Node.js

## Environment Configuration

Ensure the following environment variable is set in your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
```

> **Note**: The same `GOOGLE_CLIENT_ID` is shared between sellers and buyers.

## API Endpoint

### POST `/api/v2/buyers/auth/google-auth`

Authenticates a buyer using Google OAuth ID token.

#### Request Body
```json
{
  "token": "google_id_token_from_frontend",
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@gmail.com",
      "username": "johndoe",
      "googleId": "123456789012345678901",
      "emailVerified": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Responses

**400 Bad Request - Missing Token**
```json
{
  "success": false,
  "message": "Google ID token is required",
  "errors": [
    {
      "field": "token",
      "message": "Google ID token is required"
    }
  ]
}
```

**401 Unauthorized - Invalid Token**
```json
{
  "success": false,
  "message": "Invalid Google token: Unable to verify with Google"
}
```

## Authentication Flow

### 1. Frontend Integration

The frontend should implement Google Sign-In:

```javascript
// Frontend Google Sign-In implementation
function onGoogleSignIn(googleUser) {
  const idToken = googleUser.getAuthResponse().id_token;
  
  // Send token to backend
  fetch('/api/v2/buyers/auth/google-auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: idToken })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Store JWT token for future requests
      localStorage.setItem('authToken', data.data.token);
      // Redirect to buyer home
      window.location.href = '/buyer/home';
    }
  });
}
```

### 2. Backend Processing

The backend follows this secure flow:

1. **Token Verification**: Uses Google's official library to verify the ID token
2. **User Lookup**: Checks if user exists by Google ID or email
3. **Account Management**: 
   - Creates new account if user doesn't exist (with auto-generated username)
   - Links Google OAuth to existing email-based accounts
   - Updates profile information with Google data
4. **Session Management**: Generates JWT token for application authentication
5. **Response**: Returns user data and authentication token

## Security Features

### Token Verification
- Uses Google's official `google-auth-library` for token verification
- Validates token signature and expiration
- Ensures token was issued for the correct application (audience validation)

### Account Linking
- Prevents duplicate Google accounts for the same email
- Safely links Google OAuth to existing accounts
- Preserves existing buyer data and settings

### Data Protection
- Passwords are excluded from responses
- Sensitive information is properly handled
- Error messages don't leak sensitive information

## Testing

### Test Cases

1. **New User Registration**
   - Send valid Google ID token for new email
   - Verify new buyer account is created with auto-generated username
   - Verify JWT token is returned

2. **Existing User Login**
   - Send valid Google ID token for existing Google-linked account
   - Verify user data is returned
   - Verify JWT token is returned

3. **Account Linking**
   - Send Google ID token for email that exists with password-based account
   - Verify Google OAuth is linked to existing account
   - Verify existing data is preserved

4. **Invalid Token**
   - Send invalid or expired Google ID token
   - Verify appropriate error response

5. **Missing Token**
   - Send request without token
   - Verify validation error response

### Manual Testing

Use Postman or curl to test the endpoint:

```bash
curl -X POST http://localhost:PORT/api/v2/buyers/auth/google-auth \
  -H "Content-Type: application/json" \
  -d '{"token": "your_google_id_token_here"}'
```

## Troubleshooting

### Common Issues

1. **"Invalid Google token" Error**
   - Verify `GOOGLE_CLIENT_ID` environment variable is set correctly
   - Ensure Google Cloud Console project is properly configured
   - Check that the token hasn't expired

2. **"Email already linked" Error**
   - User is trying to link Google account to email that already has Google OAuth
   - Check existing account linking status

3. **Username Collision**
   - Auto-generated username may conflict with existing username
   - System automatically retries with random suffix

---

**Note**: This implementation follows security best practices and integrates seamlessly with the existing buyer authentication system while maintaining backward compatibility with email/password authentication.
