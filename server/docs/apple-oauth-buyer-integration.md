# Apple OAuth Buyer Integration

This document describes the Apple Sign-In integration for buyer authentication in the Auqli mobile app.

## Overview

Apple Sign-In allows buyers to authenticate using their Apple ID. This integration provides:

- New user registration with Apple credentials
- Login for existing Apple-linked accounts
- Account linking for existing email-based accounts
- Expo push token support for notifications

## Endpoint

```
POST /api/v2/buyers/auth/apple-auth
```

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Apple ID token from frontend Apple Sign-In |
| `rawNonce` | string | Yes | Raw nonce used during sign-in for security verification |
| `firstName` | string | No | User's first name (only on first sign-in) |
| `lastName` | string | No | User's last name (only on first sign-in) |
| `email` | string | No | User's email (only on first sign-in) |
| `fromDev` | boolean | No | Whether from dev environment (different bundle ID) |
| `expoPushToken` | string | No | Expo push notification token |

### Example Request

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "rawNonce": "abc123xyz",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@icloud.com",
  "fromDev": false,
  "expoPushToken": "ExponentPushToken[xxxxx]"
}
```

## Response

### Success Response (200)

```json
{
  "success": true,
  "message": "Apple authentication successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@icloud.com",
      "username": "johndoe",
      "appleId": "001234.abcdef123456.7890",
      "authProvider": "apple",
      "emailVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Missing or invalid token/nonce |
| 401 | Invalid Apple token |
| 500 | Internal server error |

## Important Notes

### Apple's User Information Policy

Apple only provides user information (name, email) on the **FIRST sign-in**:

1. **First Sign-In**: Apple returns `firstName`, `lastName`, and `email` in the authorization response
2. **Subsequent Sign-Ins**: Apple only returns the `identityToken` containing the user's Apple ID (`sub` claim)

**Critical**: The mobile app MUST capture and send user info on first sign-in, as it won't be available on future logins.

### Private Email Relay

Users can choose to hide their real email address. Apple provides a private relay email like:
```
xxxxx@privaterelay.appleid.com
```

The system handles this gracefully and uses the relay email for account creation.

### Nonce Verification

Apple Sign-In requires nonce verification to prevent replay attacks:

1. Mobile app generates a random nonce
2. Nonce is included in the sign-in request to Apple
3. Backend verifies the nonce in the token matches the provided `rawNonce`

### Bundle ID Configuration

The system supports different bundle IDs for dev and production:

| Environment | Bundle ID |
|-------------|-----------|
| Production | `com.auqli.auqliapp` |
| Development | `com.auqli.auqliappdev` |

Set `fromDev: true` for development environment.

## Mobile App Implementation

### React Native / Expo

```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

async function signInWithApple() {
  // Generate nonce
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  // Request Apple Sign-In
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  // Send to backend
  const response = await fetch('/api/v2/buyers/auth/apple-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: credential.identityToken,
      rawNonce: rawNonce,
      firstName: credential.fullName?.givenName,
      lastName: credential.fullName?.familyName,
      email: credential.email,
      fromDev: __DEV__,
      expoPushToken: pushToken,
    }),
  });

  return response.json();
}
```

## Security

- Token verification uses Apple's official JWKS endpoint
- Nonce verification prevents replay attacks
- JWT tokens are validated for issuer and audience
- Sensitive data (passwords) are never returned in responses

## Database Schema

The Buyer model includes:

```javascript
{
  appleId: {
    type: String,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'apple'],
    default: 'local'
  }
}
```

## Files Modified

| File | Changes |
|------|---------|
| `src/models/Buyer.js` | Added `appleId` field, updated `authProvider` enum |
| `src/modules/buyer/repositories/buyer.repository.js` | Added `findByAppleId()` |
| `src/modules/buyer/services/appleAuth.service.js` | New - Apple auth service |
| `src/modules/buyer/validators/appleAuth.validator.js` | New - Input validation |
| `src/modules/buyer/controllers/buyer.controller.js` | Added `appleAuth()` method |
| `src/modules/buyer/routes/buyer.auth.routes.js` | Added `/auth/apple-auth` route |
