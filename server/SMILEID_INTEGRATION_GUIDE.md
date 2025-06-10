# SmileID Integration Guide

## Overview
This guide explains how to integrate SmileID for KYC verification in your seller onboarding process. SmileID provides document verification services for individual (NIN Slip) and business (Business Registration) verification.

## Installation
The SmileID Node.js library has already been installed:
```bash
npm install smile-identity-core
```

## ID Type Selection for Individual Verification

**RECOMMENDED**: Use **NIN_SLIP** for individual verification in Nigeria - it provides the same functionality as NIN_V2 but without requiring an Enterprise ID.

### Available ID Types:

#### **NIN_SLIP** (Recommended)
- ✅ **No Enterprise ID required**
- ✅ **Works immediately**
- ✅ **Returns photo and document image**
- ✅ **Same 11-digit format as NIN_V2**
- ✅ **Full Enhanced KYC support**

#### **Alternative Options:**
- **BVN**: Bank Verification Number (available by default)
- **V_NIN**: Virtual NIN (no Enterprise ID required) 
- **PHONE_NUMBER**: Nigerian phone number verification

### If You Still Want NIN_V2:
NIN_V2 requires Enterprise ID registration:
1. Log into [Smile ID Portal](https://portal.usesmileid.com)
2. Navigate to Partner section and register Enterprise ID with NIMC
3. Add `SMILEID_ENTERPRISE_ID` to environment variables

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# SmileID Configuration
SMILEID_PARTNER_ID=your_smileid_partner_id
SMILEID_API_KEY=your_smileid_api_key
SMILEID_SANDBOX_MODE=true
SMILEID_ENTERPRISE_ID=your_nimc_enterprise_id  # Required for NIN_V2 verification
SMILEID_CALLBACK_URL=https://your-domain.com/api/seller/verification/smileid/callback  # Optional
BACKEND_URL=https://your-domain.com  # Optional - defaults to http://localhost:3000
```

### Environment Variable Details:

- **SMILEID_PARTNER_ID**: Your SmileID Partner ID (required)
- **SMILEID_API_KEY**: Your SmileID API Key (required)
- **SMILEID_SANDBOX_MODE**: Set to `true` for testing, `false` for production
- **SMILEID_ENTERPRISE_ID**: Your NIMC Enterprise ID (only required for NIN_V2 verification, not needed for NIN_SLIP) - Register at [Smile ID Portal](https://portal.usesmileid.com)
- **SMILEID_CALLBACK_URL**: Webhook URL for SmileID callbacks (optional - provides backup verification)
- **BACKEND_URL**: Your backend base URL (optional - defaults to localhost for development)

## API Endpoints

### 1. Generate SmileID Token
**Endpoint**: `POST /api/seller/verification/smileid/token`

**Headers**:
```
Authorization: Bearer <seller_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "accountType": "individual",  // or "business"
  "userId": "optional_user_id",
  "idType": "NIN_SLIP"         // or "BUSINESS_REGISTRATION"
}
```

**Response**:
```json
{
  "token": "smileid_web_token",
  "expiresAt": "2024-01-15T10:30:00.000Z",
  "userId": "seller-123-1705312200000",
  "jobId": "job-123-1705312200000"
}
```

### 2. Save Individual Verification Result
**Endpoint**: `POST /api/seller/verification/smileid/individual`

**Headers**:
```
Authorization: Bearer <seller_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "smileIdResult": {
    "success": true,
    "job_id": "job-123-1705312200000",
    "user_id": "seller-123-1705312200000",
    "result": {
      // SmileID verification result object
    }
  },
  "accountType": "individual",
  "verifiedAt": "2024-01-15T10:30:00.000Z",
  "verificationProvider": "SmileID"
}
```

**Response**:
```json
{
  "message": "Individual SmileID verification result saved successfully",
  "verification": {
    "type": "individual",
    "provider": "SmileID",
    "status": "verified",
    "verifiedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Save Business Verification Result
**Endpoint**: `POST /api/seller/verification/smileid/business`

**Headers**:
```
Authorization: Bearer <seller_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "smileIdResult": {
    "success": true,
    "job_id": "job-123-1705312200000",
    "user_id": "seller-123-1705312200000",
    "result": {
      // SmileID verification result object
    }
  },
  "accountType": "business",
  "verifiedAt": "2024-01-15T10:30:00.000Z",
  "verificationProvider": "SmileID"
}
```

**Response**:
```json
{
  "message": "Business SmileID verification result saved successfully",
  "verification": {
    "type": "business",
    "provider": "SmileID",
    "status": "verified",
    "verifiedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. SmileID Callback (Webhook)
**Endpoint**: `POST /api/seller/verification/smileid/callback`

This endpoint receives webhook notifications from SmileID when verification is completed.

## Features

✅ **Token Generation**: Generates secure tokens for SmileID web integration
✅ **Verification Result Storage**: Stores complete SmileID verification results
✅ **Email Notifications**: Sends confirmation emails after verification
✅ **Analytics Tracking**: Tracks verification events in Mixpanel
✅ **Error Handling**: Comprehensive error handling for all endpoints

## Supported Document Types

### Individual Verification
- **NIN_SLIP**: National Identification Number slip verification (no Enterprise ID required) - **RECOMMENDED**
- **BVN**: Bank Verification Number (no Enterprise ID required)
- **V_NIN**: Virtual NIN (no Enterprise ID required)
- **PHONE_NUMBER**: Nigerian phone number verification (no Enterprise ID required)
- Product type: `enhanced_kyc`

### Business Verification
- **Business Registration**: Business registration certificate verification
- Product type: `enhanced_kyc`

## Getting Started

1. **Register with SmileID** and get credentials
2. **Configure environment variables** in your `.env` file
3. **Test in sandbox mode** first
4. **Deploy to production** with production credentials

## How Verification Works

The SmileID integration supports **dual verification handling** for maximum reliability:

### 1. Primary Flow (Frontend)
1. Frontend requests token from `/api/seller/verification/smileid/token`
2. User completes verification in SmileID widget
3. Widget returns results immediately to frontend
4. Frontend calls `/api/seller/verification/smileid/individual` or `/business` to save results
5. `hasFilledVerificationDocuments` is set to `true`
6. Confirmation email sent

### 2. Backup Flow (Webhook)
1. SmileID processes verification in background
2. SmileID sends webhook to `/api/seller/verification/smileid/callback`
3. Callback endpoint also sets `hasFilledVerificationDocuments` to `true`
4. Provides redundancy in case frontend fails to save results

### Environment Variable Options

**Option 1: With Callback URL (Recommended)**
```bash
SMILEID_CALLBACK_URL=https://your-domain.com/api/seller/verification/smileid/callback
```

**Option 2: Without Callback URL (Still Works)**
```bash
# SMILEID_CALLBACK_URL=  # Leave empty or omit
```

**Token generation works in both cases!** The callback URL is purely for webhook redundancy.

## Troubleshooting

### Common Issues:

#### Error: "Unable to validate ID - Enterprise ID is required for NIN_V2"
- **Cause**: Missing Enterprise ID for NIN_V2 verification
- **Solution**: Switch to NIN_SLIP (recommended) or register Enterprise ID at [Smile ID Portal](https://portal.usesmileid.com)
- **Alternative**: Use NIN_SLIP, BVN, V_NIN, or PHONE_NUMBER instead of NIN_V2

#### Jobs not appearing in SmileID dashboard
- **Cause**: Using wrong API class or missing Enterprise ID
- **Solution**: Ensure using `IDApi` for Enhanced KYC and provide Enterprise ID for NIN_V2

#### Error: "Request failed with status code 400"
- **Cause**: Incorrect API usage or missing required fields
- **Solution**: Check if using correct API class (`IDApi` for Enhanced KYC, `SIDWebAPI` for document verification)

#### Error: "Invalid ID number format"
- **Cause**: ID number doesn't match expected format
- **Solution**: Use regex validation `/^[0-9]{11}$/` for Nigerian ID numbers

This completes the SmileID integration for your seller verification system! 