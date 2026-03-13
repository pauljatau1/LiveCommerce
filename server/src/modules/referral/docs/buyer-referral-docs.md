# 💸 Auqli Buyer Referral API Documentation

Welcome to the Auqli Buyer Referral system. This document outlines the API endpoints available for buyers to view their referral statistics, generated links, and the history of users they have invited.

## Base URL
`/api/v2/buyers/referral`

---

## 1. Get Referral Overview

Retrieve high-level statistics for the authenticated buyer, including their unique referral link and wallet balance.

*   **URL:** `/overview`
*   **Method:** `GET`
*   **Auth Required:** Yes (Buyer JWT Token)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "referralCode": "FYDMZERR",
    "referralLink": "https://auqli.com/invite?ref=FYDMZERR",
    "stats": {
      "totalReferred": 3,
      "completedReferrals": 1,
      "totalEarned": 500
    },
    "walletBalance": 500
  }
}
```

---

## 2. Get Referral History

Retrieve a paginated list of all users invited by the authenticated buyer.

*   **URL:** `/history`
*   **Method:** `GET`
*   **Auth Required:** Yes (Buyer JWT Token)

**Query Parameters:**
| Parameter | Type   | Required | Description |
| :--- | :--- | :--- | :--- |
| `page`    | Number | No       | Page number for pagination (default: 1) |
| `limit`   | Number | No       | Items per page (default: 10) |
| `status`  | String | No       | Filter by status. Options: `pending`, `completed`, `expired`. Omit parameter entirely or pass `all` to retrieve all. |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "id": "69b2...40b",
        "referee": {
          "id": "69b2...406",
          "name": "David Dave",
          "email": "davdav@gmail.com",
          "profileImage": "https://...",
          "registeredAt": "2026-03-12T01:13:59.000Z"
        },
        "status": "completed",
        "expiresAt": "2026-03-19T01:13:59.413Z",
        "completedAt": "2026-03-12T01:20:37.799Z",
        "rewardIssued": true,
        "createdAt": "2026-03-12T01:13:59.414Z"
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

## 3. Remind Pending Referee

Sends a manual push notification to a specific referee nudging them to complete their first purchase.

*   **URL:** `/:referralId/remind`
*   **Method:** `POST`
*   **Auth Required:** Yes (Buyer JWT Token)

> [!CAUTION]
> This endpoint enforces a limit of **1 manual reminder** per referred user to prevent spamming. 

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reminder sent successfully"
}
```

**Response (400 Bad Request) - Limit Reached:**
```json
{
  "success": false,
  "error": "REMIND_LIMIT_REACHED",
  "message": "A manual reminder has already been sent for this referral"
}
```

---

## Important System Logic Notes
1. **Wallet Transactions:** Whenever a referral transitions to `completed`, a native `credit` receipt is added to `/api/buyer/wallet/transactions` logging the earned amount.
2. **First Order Trigger:** The frontend can detect if an order payout triggered a reward by parsing the response of the checkout/payment endpoint via `isReferralRewardQualified: true`.
3. **Pending Expiry:** Pending referrals expire natively after 7 days if the referee does not make a paid purchase.

---

## 4. Buyer Registration (Adding a Referral Code)

When a new buyer signs up, the frontend must pass the `referralCode` extracted from the invite link (`?ref=CODE`) to the backend registration endpoints. This ensures the new buyer is correctly attributed to the referrer.

### Local Registration
*   **URL:** `/api/buyer/auth/register`
*   **Method:** `POST`

**Request Body Example:**
```json
{
  "firstName": "David",
  "lastName": "Dave",
  "email": "davdav@gmail.com",
  "password": "SecurePassword123!",
  "referralCode": "FYDMZERR" // <-- Include this extracted from the URL
}
```

### Google Authentication
*   **URL:** `/api/buyer/auth/google-auth`
*   **Method:** `POST`

**Request Body Example:**
```json
{
  "token": "google_id_token_here",
  "referralCode": "FYDMZERR" // <-- Include this extracted from the URL
}
```

### Apple Authentication
*   **URL:** `/api/buyer/auth/apple-auth`
*   **Method:** `POST`

**Request Body Example:**
```json
{
  "identityToken": "apple_identity_token_here",
  "user": {
    "name": {
      "firstName": "David",
      "lastName": "Dave"
    },
    "email": "davdav@gmail.com"
  },
  "referralCode": "FYDMZERR" // <-- Include this extracted from the URL
}
```
