# Facebook Events Debugging Guide

## 🚨 **Common Issues & Solutions**

### **Issue: Events not showing in Facebook Events Manager**

This is the most common issue. Here's how to debug:

## 📋 **Step-by-Step Debugging**

### 1. **Check Console Logs**
Look for these logs in your console:

```
✅ Facebook event sent: buyer_login { userId: "123", email: "user@example.com" }
✅ Facebook User ID set: 123
✅ Facebook User Data set: { em: "user@example.com", fn: "john", ln: "doe" }
🔄 Facebook events flushed (dev mode)
```

**If you DON'T see these logs:**
- Facebook SDK is not properly initialized
- Check your imports in `utils/analytics.ts`

### 2. **Use the Debug Button**
In development mode, you should see a yellow "🔍 Debug Facebook Analytics" button on your login screen.

Tap it and check the console for:
```
🔍 === ANALYTICS DEBUG SESSION ===
📱 Facebook SDK Status:
- Platform: ios
- __DEV__: true
- Anonymous ID: [some ID]
- User ID: null or [user ID]
```

### 3. **Check Facebook Events Manager**
1. Go to [Facebook Events Manager](https://www.facebook.com/events_manager)
2. Select your app
3. Go to "Events" tab
4. Look for events (they can take 5-10 minutes to appear)

## 🎯 **Required Conditions for Facebook Events**

### **Critical Requirements:**
1. **Real Device Only** - Simulators often don't work
2. **Facebook App Installed** - User must have Facebook app
3. **Facebook App Logged In** - Must be logged into Facebook app
4. **App Tracking Permission** (iOS) - Must grant tracking permission

### **iOS Specific:**
```javascript
// Your app should request tracking permission
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

const { status } = await requestTrackingPermissionsAsync();
if (status === 'granted') {
  // Facebook events will work better
}
```

### **Android Specific:**
- Usually works without special permissions
- Make sure Google Play Services are installed

## 🔧 **Manual Testing Steps**

### 1. **Test on Real Device**
```bash
# iOS
npx expo run:ios --device

# Android  
npx expo run:android --device
```

### 2. **Enable Facebook App Event Debugging**
1. Install Facebook app on device
2. Log into Facebook app
3. Go to Facebook app settings > Privacy > App Tracking
4. Enable tracking for your app

### 3. **Test Login Event**
1. Open your app
2. Tap "🔍 Debug Facebook Analytics" button
3. Check console logs
4. Then try normal login
5. Check console for `buyer_login` event

## 📊 **Facebook Events Manager Debugging**

### **Events Tab:**
- Shows all events received
- Can take 5-10 minutes to appear
- Filter by event name: `buyer_login`

### **Diagnostics Tab:**
- Shows SDK errors
- Shows integration issues
- Check for warnings

### **Data Sources Tab:**
- Verify your app is listed
- Check if events are being received

## 🔬 **Advanced Debugging**

### **Enable Facebook Debug Mode:**
Add to your `app.config.js`:
```javascript
// In your Facebook plugin config
"autoLogAppEventsEnabled": true,
"isAutoInitEnabled": true,
// Add this for debugging:
"debugEnabled": true
```

### **Check Facebook SDK Version:**
```bash
npm list react-native-fbsdk-next
```

### **Verify App ID:**
Check your `app.config.js` has correct Facebook App ID:
```javascript
{
  "appID": "your-facebook-app-id",
  "clientToken": "your-client-token"
}
```

## 🚫 **Events Won't Show If:**

1. **Using Simulator** - Use real device
2. **No Facebook App** - Install Facebook app
3. **Not Logged into Facebook** - Log into Facebook app  
4. **No Tracking Permission** - Grant ATT permission (iOS)
5. **Wrong App ID** - Check Facebook app configuration
6. **Development vs Production** - Events may behave differently

## 💡 **Quick Fixes**

### **If Console Shows Events But Manager Doesn't:**
- Wait 10-15 minutes
- Check you're looking at correct Facebook app
- Verify device has internet connection
- Try force-closing and reopening Facebook app

### **If No Console Logs:**
- Check imports in `utils/analytics.ts`
- Verify Facebook SDK is initialized in `app/index.tsx`
- Check for JavaScript errors

### **If Events Inconsistent:**
- Use `debugAnalytics()` function
- Check device connectivity
- Verify Facebook app permissions

## 🎯 **Test Events to Look For**

Your app should send these events:

| Event Name | When | Expected Properties |
|------------|------|-------------------|
| `buyer_login` | User logs in | userId, email, firstName, etc. |
| `debug_test_event` | Debug button pressed | test_param, timestamp |
| `debug_global_test` | Debug button pressed | test_type, platform, value |
| `fb_mobile_screen_view` | Screen changes | screen_name, fb_content_type |

## 🆘 **Still Not Working?**

1. **Check Facebook Developer Console** for app-level issues
2. **Verify Bundle ID/Package Name** matches Facebook app settings
3. **Check Facebook App Review Status** - some events need approval
4. **Try Different Facebook Account** - test with different user
5. **Check Regional Restrictions** - some countries have limitations

## 📝 **Debug Checklist**

- [ ] Using real device (not simulator)
- [ ] Facebook app installed and logged in
- [ ] App Tracking Transparency permission granted (iOS)
- [ ] Console shows Facebook event logs
- [ ] Facebook Events Manager checked (waited 10+ minutes)
- [ ] Correct Facebook App ID in config
- [ ] Internet connection stable
- [ ] No JavaScript errors in console 