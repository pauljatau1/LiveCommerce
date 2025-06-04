import { UserAttributes } from "@/hooks/useClarity";
import { getUser } from "@/store/features/auth/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getUserAttributesForClarity = async (
  userParam?: any,
): Promise<UserAttributes | null> => {
  try {
    console.log("🔍 Starting getUserAttributesForClarity...");
    
    let user = userParam;
    
    // If no user parameter provided, try to get from AsyncStorage
    if (!user) {
      try {
        const userData = await AsyncStorage.getItem("user");
        console.log("📱 Raw user data from AsyncStorage:", userData);
        
        if (userData) {
          user = JSON.parse(userData);
          console.log("✅ Parsed user data from AsyncStorage:", user);
        } else {
          console.log("❌ No user data found in AsyncStorage");
        }
      } catch (asyncError) {
        console.error("❌ Error getting user from AsyncStorage:", asyncError);
        
        // Fallback to original getUser method
        try {
          console.log("🔄 Falling back to getUser() method...");
          user = await getUser();
          console.log("✅ User data from getUser():", user);
        } catch (getUserError) {
          console.error("❌ Error getting user from getUser():", getUserError);
        }
      }
    }

    if (!user || (typeof user === 'object' && Object.keys(user).length === 0)) {
      console.log("❌ No user found for Clarity tracking");
      return null;
    }

    console.log("👤 Processing user data for Clarity:", user);

    // Create a UserAttributes object from the user data
    const userAttributes: UserAttributes = {
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      userId: user.id?.toString() || user._id?.toString() || user.userId?.toString(),
      username: user.username || user.userName || user.user_name || "",
      firstName: user.firstName || user.first_name || user.name?.split(' ')[0] || "",
      lastName: user.lastName || user.last_name || user.name?.split(' ')[1] || "",
      email: user.email || "",
    };

    // Add any additional attributes that might be useful for customer support
    if (user.isVerified !== undefined) {
      userAttributes.isVerified = String(user.isVerified);
    }

    if (user.createdAt) {
      userAttributes.accountAge = getAccountAgeInDays(user.createdAt);
      userAttributes.createdDate =
        typeof user.createdAt === "string"
          ? user.createdAt
          : user.createdAt.toISOString();
    }

    // Add device and platform information if available
    if (user.lastLoginDevice) {
      userAttributes.lastDevice = user.lastLoginDevice;
    }

    if (user.lastLoginPlatform) {
      userAttributes.platform = user.lastLoginPlatform;
    }

    // Add subscription or account type if available
    if (user.accountType) {
      userAttributes.accountType = user.accountType;
    }

    if (user.subscription) {
      userAttributes.subscriptionStatus = user.subscription.status || "unknown";
      userAttributes.subscriptionPlan = user.subscription.planName || "none";
    }

    // Add last login date if available
    if (user.lastLoginDate) {
      userAttributes.lastLoginDate =
        typeof user.lastLoginDate === "string"
          ? user.lastLoginDate
          : user.lastLoginDate.toISOString();
    }

    console.log("✅ Extracted user attributes for Clarity:", userAttributes);
    
    // Check if we have at least a userId or email to make it worthwhile
    if (!userAttributes.userId && !userAttributes.email) {
      console.warn("⚠️ No userId or email found in user attributes");
      return null;
    }
    
    return userAttributes;
  } catch (error) {
    console.error("❌ Error extracting user attributes for Clarity:", error);
    return null;
  }
};

const getAccountAgeInDays = (createdAt: string | Date): string => {
  try {
    const createDate =
      typeof createdAt === "string" ? new Date(createdAt) : createdAt;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  } catch (e) {
    return "0";
  }
};

/**
 * Helper function to identify a user in Clarity immediately when they log in
 * Call this from your login success handler
 */
export const identifyUserInClarity = async (
  clarityHook: any,
  userParam?: any,
): Promise<boolean> => {
  try {
    console.log("🎯 identifyUserInClarity called");
    
    const userAttributes = await getUserAttributesForClarity(userParam);
    if (userAttributes) {
      console.log("🚀 Calling clarity.identifyUser with:", userAttributes);
      clarityHook.identifyUser(userAttributes);
      console.log("✅ User successfully identified in Clarity");
      return true;
    } else {
      console.warn("⚠️ No user attributes available for Clarity identification");
      return false;
    }
  } catch (error) {
    console.error("❌ Error identifying user in Clarity:", error);
    return false;
  }
};

/**
 * Helper function to clear user identity in Clarity when they log out
 * Call this from your logout handler
 */
export const clearUserIdentityInClarity = (clarityHook: any): void => {
  try {
    if (clarityHook.clearUserIdentity) {
      clarityHook.clearUserIdentity();
      console.log("✅ User identity cleared in Clarity");
    }
  } catch (error) {
    console.error("❌ Error clearing user identity in Clarity:", error);
  }
};
