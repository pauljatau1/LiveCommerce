# 💸 Auqli Seller Referral API Documentation

Welcome to the Auqli Seller Referral system. This document outlines the API endpoints available for sellers to view their referral statistics, earned GMV commissions, generated links, and the history of users they have invited.

## Base URL
`/api/v2/sellers/referral`

---

## 1. Get Referral Overview

Retrieve high-level statistics for the authenticated seller. Includes total lifetime revenue earned purely from referrals, Gross Merchandise Value dynamically attributed to them, and wallet balancing.

*   **URL:** `/overview`
*   **Method:** `GET`
*   **Auth Required:** Yes (Seller JWT Token)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "referralCode": "ZGCM9M7Z",
    "referralLink": "https://auqli.com/invite?ref=ZGCM9M7Z",
    "milestone": "none",
    "stats": {
      "totalReferred": 1,
      "completedReferrals": 1,
      "totalEarned": 1764.86,
      "totalGMV": 35297.25
    },
    "walletBalance": 1764.86
  }
}
```

---

## 2. Get Referral History

Retrieve a paginated list of all users invited by the authenticated seller.

*   **URL:** `/history`
*   **Method:** `GET`
*   **Auth Required:** Yes (Seller JWT Token)

**Query Parameters:**
| Parameter | Type   | Required | Description |
| :--- | :--- | :--- | :--- |
| `page`    | Number | No       | Page number for pagination (default: 1) |
| `limit`   | Number | No       | Items per page (default: 10) |
| `status`  | String | No       | Filter by status. Options: `pending`, `completed`, `expired`. Omit parameter entirely or pass `all` to retrieve all. |
| `from`    | ISOString | No    | Filter referrals created *after* this UTC timestamp. |
| `to`      | ISOString | No    | Filter referrals created *before* this UTC timestamp. |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
         "id": "69b2...db5c",
        "referee": {
          "id": "69b2...db56",
          "name": "Test Buyer",
          "email": "flash@gmail.com",
          "profileImage": "https://...",
          "registeredAt": "2026-03-12T11:59:52.000Z"
        },
        "status": "completed",
        "linkTarget": {
           "type": "store",
           "targetId": null
        },
        "expiresAt": "2026-03-19T11:59:52.656Z",
        "completedAt": "2026-03-12T12:03:13.895Z",
        "rewardIssued": true,
        "orderValue": 35297.25,
        "amountEarned": 1764.86,
        "createdAt": "2026-03-12T11:59:52.658Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    }
  }
}
```

---

## 3. Get Single Referral Detail

Fetch fully expanded details for a single referral. 

*   **URL:** `/:referralId`
*   **Method:** `GET`
*   **Auth Required:** Yes (Seller JWT Token)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
        "id": "69b2...db5c",
        "referee": {
          "id": "69b2...db56",
          "name": "Test Buyer",
          "email": "flash@gmail.com",
          "profileImage": "https://...",
          "registeredAt": "2026-03-12T11:59:52.000Z"
        },
        "status": "completed",
        "linkTarget": {
           "type": "store",
           "targetId": null
        },
        "expiresAt": "2026-03-19T11:59:52.656Z",
        "completedAt": "2026-03-12T12:03:13.895Z",
        "rewardIssued": true,
        "orderValue": 35297.25,
        "amountEarned": 1764.86,
        "createdAt": "2026-03-12T11:59:52.658Z",
        "reminders": {
           "day3Sent": false,
           "day7Sent": false,
           "manualSent": false,
           "lastSentAt": null
        }
  }
}
```

---

## 4. Remind Pending Referee

Sends a manual push notification up to once per user to nudge them before expiry.

*   **URL:** `/:referralId/remind`
*   **Method:** `POST`
*   **Auth Required:** Yes (Seller JWT Token)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reminder sent successfully"
}
```

---

## 5. Update Link Target Dashboard Pref.

Allows the seller UI to save its preference on what the generated `invite?ref=ZGCM&target=...` link should default to (Store profile, a specific Live stream, or a specific Product item).

*   **URL:** `/link-target`
*   **Method:** `PATCH`
*   **Auth Required:** Yes (Seller JWT Token)

**Request Body:**
```json
{
  "target": "product",
  "targetId": "PRODUCT_OBJECT_ID"
}
```

---

## Important System Logic Notes
1. **Dynamic Payouts:** Sellers earn 5% of their invited user's very first cart checkout natively attached to their wallet balance, up to a maximum cap of 3,000 NGN.
2. **Wallet Transactions:** Referrals will show up in the authenticated Seller's main financial wallet transaction ledger as a formal log with `"type": "referral_reward"`.
3. **Pending Expiry:** Referrals strictly expire exactly 7 days after sign up if unfulfilled.
