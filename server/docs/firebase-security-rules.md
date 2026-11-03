# Firebase Realtime Database Security Rules

To secure your Firebase Realtime Database, follow these steps to update your security rules:

## Log in to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `auqli-app`
3. In the left sidebar, click on "Realtime Database"
4. Click on the "Rules" tab

## Update Security Rules

Replace your current rules with the following:

```json
{
  "rules": {
    "userTokens": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()",
        ".write": "$uid === auth.uid || root.child('admins').child(auth.uid).exists()"
      }
    },
    "admins": {
      ".read": "auth != null && root.child('admins').child(auth.uid).exists()",
      ".write": "auth != null && root.child('admins').child(auth.uid).exists()"
    },
    // Add additional paths as needed based on your database structure
    "$other": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

These rules:
1. Allow users to read and write only their own token data
2. Allow admin users to read and write all user tokens
3. Restrict admin list access to admin users only
4. Require authentication for all other database operations

## Verify Rules Work with Your Application

After applying these rules, test your application to ensure all functionality continues to work correctly. 

## Additional Security Recommendations

1. Define more granular rules for specific data paths in your database
2. Use Firebase Authentication's validation methods to verify user claims
3. Consider using Firebase Security Rules to validate data structure and values
4. Audit your security rules regularly

## How Authentication Works in Your Application

Your application already uses Firebase Authentication via the `auth` object exported from `Firebase.js`. The JWT tokens generated in your authentication flow can be used to authenticate requests to the Firebase Realtime Database.

When a user logs in:
1. They get authenticated through your existing JWT or Google OAuth flow
2. Your application should then use Firebase Authentication to get a Firebase token
3. This token is automatically used by the Firebase client libraries to authenticate requests to the Realtime Database

## Troubleshooting

If you experience issues after implementing these rules:
1. Check Firebase console logs for denied requests
2. Ensure users are properly authenticated before accessing the database
3. Temporarily revert to less restrictive rules for testing, then gradually add restrictions back 