import { UserAttributes } from "@/hooks/useClarity";
import { getUser } from "@/store/features/auth/utils";

/**
 * Extracts user attributes from the authenticated user for Clarity tracking
 * Call this function after login to identify the user in Clarity
 * @param userParam Optional user object. If not provided, will fetch from storage.
 */
export const getUserAttributesForClarity = async (userParam?: any): Promise<UserAttributes | null> => {
  try {
    const user = userParam || await getUser();
    
    if (!user) {
      console.log('No user found for Clarity tracking');
      return null;
    }
    
    // Create a UserAttributes object from the user data
    const userAttributes: UserAttributes = {
      userId: user.id?.toString() || user._id?.toString(),
      username: user.username || user.userName || '',
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      email: user.email || '',
    };
    
    // Add any additional attributes that might be useful for customer support
    if (user.isVerified) {
      userAttributes.isVerified = String(user.isVerified);
    }
    
    if (user.createdAt) {
      userAttributes.accountAge = getAccountAgeInDays(user.createdAt);
      userAttributes.createdDate = typeof user.createdAt === 'string' ? user.createdAt : user.createdAt.toISOString();
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
      userAttributes.subscriptionStatus = user.subscription.status || 'unknown';
      userAttributes.subscriptionPlan = user.subscription.planName || 'none';
    }

    // Add last login date if available
    if (user.lastLoginDate) {
      userAttributes.lastLoginDate = typeof user.lastLoginDate === 'string' 
        ? user.lastLoginDate 
        : user.lastLoginDate.toISOString();
    }
    
    console.log('Extracted user attributes for Clarity:', userAttributes);
    return userAttributes;
  } catch (error) {
    console.error('Error extracting user attributes for Clarity:', error);
    return null;
  }
};

/**
 * Calculate account age in days from creation date
 */
const getAccountAgeInDays = (createdAt: string | Date): string => {
  try {
    const createDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  } catch (e) {
    return '0';
  }
}; 