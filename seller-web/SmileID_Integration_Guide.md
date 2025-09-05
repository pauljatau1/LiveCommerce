# SmileID Integration Guide for KYC Verification

## Overview
This document explains the SmileID integration implementation in the KYC verification page for document verification.

## What's Implemented

### Frontend Integration
✅ **SmileID Web Components Installed**: `@smileid/web-components`
✅ **KYC Verification Page**: Complete UI with SmileID integration
✅ **Document Verification**: Supports both individual (NIN Slip) and business (Business Registration) verification
✅ **Service Methods**: Added SmileID verification methods to VerificationService

### Features
- **Individual Account**: NIN Slip verification using SmileID
- **Business Account**: Business Registration document verification
- **Token Generation**: Service method to generate SmileID tokens
- **Result Handling**: Saves verification results to backend
- **Error Handling**: Comprehensive error handling and user feedback

## Backend Implementation Required

To complete the SmileID integration, you need to implement these backend endpoints:

### 1. Token Generation Endpoint
```javascript
POST /api/v2/sellers/verification/smileid/token
Headers: Authorization: Bearer <token>
Body: {
  accountType: "individual" | "business",
  userId: string,
  idType: "NIN_SLIP" | "BUSINESS_REGISTRATION"
}
Response: {
  token: string,
  expiresAt: string
}
```

### 2. Individual Verification Result Endpoint
```javascript
POST /api/seller/verification/smileid/individual
Headers: Authorization: Bearer <token>
Body: {
  smileIdResult: object,
  accountType: "individual",
  verifiedAt: string,
  verificationProvider: "SmileID"
}
```

### 3. Business Verification Result Endpoint
```javascript
POST /api/seller/verification/smileid/business
Headers: Authorization: Bearer <token>
Body: {
  smileIdResult: object,
  accountType: "business",
  verifiedAt: string,
  verificationProvider: "SmileID"
}
```

## SmileID Configuration

### Required Environment Variables
```bash
SMILEID_PARTNER_ID=your_partner_id
SMILEID_API_KEY=your_api_key
SMILEID_SANDBOX_MODE=true|false
SMILEID_CALLBACK_URL=your_callback_url
```

### Document Types Supported
- **Individual**: NIN Slip Verification (Nigeria)
- **Business**: Business Registration Certificate

### Sample SmileID Token Generation (Node.js)
```javascript
const SmileIdentity = require('@smileid/server-sdk');

const smileId = new SmileIdentity({
  partnerId: process.env.SMILEID_PARTNER_ID,
  apiKey: process.env.SMILEID_API_KEY,
  environment: process.env.SMILEID_SANDBOX_MODE === 'true' ? 'sandbox' : 'production'
});

// Generate token for verification
const generateToken = async (userId, idType) => {
  try {
    const token = await smileId.generateToken({
      userId: userId,
      jobType: idType === 'NIN_SLIP' ? 'basic_kyc' : 'business_verification',
      country: 'NG'
    });
    
    return token;
  } catch (error) {
    throw new Error('Failed to generate SmileID token');
  }
};
```

## Testing

### Demo Mode
The frontend implementation includes a demo mode that generates mock tokens when the backend endpoints are not available. This allows for testing the UI flow.

### Production Setup
1. Register with SmileID and get your credentials
2. Implement the required backend endpoints
3. Set environment variables
4. Update the frontend to use production SmileID environment

## Usage Flow

1. **User clicks "Start Document Verification"**
2. **Frontend requests token** from backend
3. **SmileID component initializes** with the token
4. **User captures document** using SmileID interface
5. **SmileID processes** the document
6. **Results are sent** to backend for storage
7. **UI updates** to show verification status

## Error Handling

- Network errors during token generation
- SmileID verification failures
- Backend storage failures
- User cancellation

## Security Notes

- Tokens should have short expiration times
- Verification results should be validated on the backend
- All communication should use HTTPS
- Store minimal user data and follow privacy regulations

## Next Steps

1. Implement the required backend endpoints
2. Set up SmileID account and get credentials
3. Test in sandbox environment
4. Deploy to production

## Support

For SmileID specific issues, refer to:
- [SmileID Documentation](https://docs.smileidentity.com/)
- [SmileID Web Components](https://www.npmjs.com/package/@smileid/web-components) 