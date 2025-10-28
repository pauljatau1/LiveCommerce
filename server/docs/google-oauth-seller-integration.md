# Google OAuth Integration for Seller Authentication

This document provides a comprehensive guide for the Google OAuth integration implemented for seller authentication in the Auqli platform.

## Overview

The Google OAuth integration allows sellers to:
- Register new accounts using their Google credentials
- Login to existing accounts using Google Sign-In
- Link Google accounts to existing email-based accounts
- Maintain secure session management with JWT tokens

## Implementation Details

### 1. Database Schema Updates

The `Seller` model has been updated to include Google OAuth fields:

```javascript
// Google OAuth fields added to Seller schema
googleId: { type: String, unique: true, sparse: true },
googleProfilePicture: { type: String },
googleVerifiedEmail: { type: Boolean, default: false },

// Password field updated to be optional for Google OAuth users
password: { type: String, required: function() { return !this.googleId; } }
```

### 2. New Files Created

#### Service Layer
- `src/modules/seller/services/googleAuth.service.js` - Core Google OAuth business logic
- `src/modules/seller/validators/googleAuth.validator.js` - Input validation for Google OAuth requests

#### Controller Layer
- Added `googleAuth` method to `src/modules/seller/controllers/seller.controller.js`

#### Repository Layer
- Added `findByGoogleId` method to `src/modules/seller/repositories/seller.repository.js`

#### Routes
- Added `/api/v2/sellers/google-auth` POST endpoint with comprehensive Swagger documentation

### 3. Dependencies

The following package has been installed:
- `google-auth-library` - Official Google authentication library for Node.js

## Environment Configuration

Add the following environment variable to your `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Getting Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen
7. Set application type to "Web application"
8. Add your domain to authorized origins
9. Copy the Client ID and add it to your environment variables

## API Endpoint

### POST `/api/v2/sellers/google-auth`

Authenticates a seller using Google OAuth ID token.

#### Request Body
```json
{
  "token": "google_id_token_from_frontend"
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
      "googleId": "123456789012345678901",
      "googleProfilePicture": "https://lh3.googleusercontent.com/a/...",
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

The frontend should implement Google Sign-In following the [YouTube tutorial](https://www.youtube.com/watch?v=UUJfTsn6S_Y&t=352s) referenced:

```javascript
// Frontend Google Sign-In implementation
function onGoogleSignIn(googleUser) {
  const idToken = googleUser.getAuthResponse().id_token;
  
  // Send token to backend
  fetch('/api/v2/sellers/google-auth', {
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
      // Redirect to seller dashboard
      window.location.href = '/seller/dashboard';
    }
  });
}
```

### 2. Backend Processing

The backend follows this secure flow:

1. **Token Verification**: Uses Google's official library to verify the ID token
2. **User Lookup**: Checks if user exists by Google ID or email
3. **Account Management**: 
   - Creates new account if user doesn't exist
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
- Preserves existing seller data and settings

### Data Protection
- Passwords are excluded from responses
- Sensitive information is properly handled
- Error messages don't leak sensitive information

## Testing

### Test Cases

1. **New User Registration**
   - Send valid Google ID token for new email
   - Verify new seller account is created
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

Use tools like Postman or curl to test the endpoint:

```bash
curl -X POST api/v2/sellers/google-auth \
  -H "Content-Type: application/json" \
  -d '{"token": "your_google_id_token_here"}'
```

## Error Handling

The implementation includes comprehensive error handling:

- **Validation Errors**: Input validation with detailed error messages
- **Authentication Errors**: Google token verification failures
- **Database Errors**: Account creation and lookup failures
- **Security Errors**: Duplicate account prevention

## Future Enhancements

Potential improvements for the Google OAuth integration:

1. **Refresh Token Support**: Implement Google refresh token handling
2. **Multiple OAuth Providers**: Add support for Facebook, Apple, etc.
3. **Profile Sync**: Periodic sync of Google profile information
4. **Account Unlinking**: Allow users to unlink Google accounts
5. **Analytics**: Track OAuth usage and conversion rates

## Troubleshooting

### Common Issues

1. **"Invalid Google token" Error**
   - Verify `GOOGLE_CLIENT_ID` environment variable is set correctly
   - Ensure Google Cloud Console project is properly configured
   - Check that the token hasn't expired

2. **"Email already linked" Error**
   - User is trying to link Google account to email that already has Google OAuth
   - Check existing account linking status

3. **Database Connection Issues**
   - Verify MongoDB connection is working
   - Check database permissions for seller collection

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=google-auth:*
```

## Support

For issues or questions regarding the Google OAuth integration:

1. Check the error logs for detailed error messages
2. Verify environment configuration
3. Test with Google's token verification tools
4. Review Google Cloud Console configuration

---

**Note**: This implementation follows security best practices and integrates seamlessly with the existing seller authentication system while maintaining backward compatibility with email/password authentication.
