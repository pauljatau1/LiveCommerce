import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, ActivityIndicator } from 'react-native';
import React, { useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { AntDesign, Ionicons, MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';
import GlassImage from '@/app/(root)/livestream/components/GlassImage';

interface StoreInfo {
  name: string;
  username: string;
  avatar: any;
  followers?: number;
  following?: boolean;
}

interface StreamInfo {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  viewerCount?: number;
  scheduledStartTime?: string;
  actualStartTime?: string;
  status?: string;
  type?: string;
  sellerFollowers?: number;
}

interface StreamInfoProps {
  storeInfo: StoreInfo;
  streamInfo: StreamInfo;
  isLoading?: boolean;
  closeSheet: () => void;
  sellerId?: string;
  isFollowing?: boolean;
  isFollowingLoading?: boolean;
  onFollow?: () => Promise<void>;
  onUnfollow?: () => Promise<void>;
}

interface SkeletonItemProps {
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  marginBottom?: number;
  breatheAnim: Animated.Value;
}

// Pre-define colors for better performance
const COLORS = {
  primary: '#16783A',
  danger: '#FF5733',
  white: '#FFFFFF',
  dark: '#121212',
  transparent: 'transparent',
  border: 'rgba(255,255,255,0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.7)',
  textQuaternary: 'rgba(255,255,255,0.8)',
  backgroundDark: '#444444',
  backgroundLight: 'rgba(255,255,255,0.1)',
  backgroundLighter: 'rgba(255,255,255,0.05)',
  backgroundSkeleton: 'rgba(255, 255, 255, 0.08)',
  avatarFallback: '#333',
};

// Pre-calculate dimensions once
const { width } = Dimensions.get('window');

// Memoized Skeleton Item component
const SkeletonItem = memo(({ width = '100%', height = 16, marginBottom = 8, breatheAnim }: SkeletonItemProps) => {
  const animatedOpacity = useMemo(() => {
    return breatheAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7]
    });
  }, [breatheAnim]);
  
  return (
    <Animated.View 
      style={[
        {
          width,
          height,
          backgroundColor: COLORS.backgroundSkeleton,
          borderRadius: 4,
          marginBottom
        },
        { opacity: animatedOpacity }
      ]} 
    />
  );
});

// Memoized components for better performance
const Header = memo(({ title, onClose }: { title: string, onClose: () => void }) => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <AntDesign name="close" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  </View>
));

// Memoized FollowButton component
const FollowButton = memo(({ 
  isFollowing, 
  isFollowingLoading, 
  onPress 
}: { 
  isFollowing: boolean, 
  isFollowingLoading: boolean, 
  onPress: () => void 
}) => (
  <TouchableOpacity 
    style={[
      styles.followButton, 
      isFollowing && styles.followingButton
    ]}
    onPress={onPress}
    disabled={isFollowingLoading}
    activeOpacity={0.8}
  >
    {isFollowingLoading ? (
      <ActivityIndicator size="small" color={COLORS.white} />
    ) : (
      <>
        <Text style={styles.followButtonText}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
        {isFollowing && <AntDesign name="check" size={14} color={COLORS.white} style={styles.followIcon} />}
      </>
    )}
  </TouchableOpacity>
));

// Memoized TagItem component
const TagItem = memo(({ tag }: { tag: string }) => (
  <View style={styles.tagItem}>
    <Text style={styles.tagText}>#{tag}</Text>
  </View>
));

// Pre-defined date formatter function
const formatStreamDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = moment(dateString);
  return date.format('MMM D, YYYY • h:mm A');
};

// Main component - optimized
const StreamInfoComponent = ({ 
  storeInfo, 
  streamInfo, 
  isLoading = false, 
  closeSheet,
  sellerId,
  isFollowing = false,
  isFollowingLoading = false,
  onFollow,
  onUnfollow
}: StreamInfoProps) => {
  // Animation values for skeleton loading
  const breatheAnim = useRef(new Animated.Value(0)).current;
  
  // Start the breathing animation for skeleton loaders
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ])
    );
    
    animation.start();
    
    return () => {
      animation.stop();
    };
  }, []);

  // Handle follow/unfollow button click - memoized
  const handleFollowButtonPress = useCallback(async () => {
    if (!sellerId || isFollowingLoading) return;

    try {
      if (isFollowing) {
        onUnfollow && await onUnfollow();
      } else {
        onFollow && await onFollow();
      }
    } catch (error) {
      // Silent error handling for performance
    }
  }, [sellerId, isFollowingLoading, isFollowing, onUnfollow, onFollow]);

  // Memoized store section renderer
  const renderStoreSection = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.storeSection}>
          <View style={styles.storeHeader}>
            <View style={styles.avatarContainer}>
              <SkeletonItem width={70} height={70} marginBottom={0} breatheAnim={breatheAnim} />
            </View>
            <View style={styles.storeInfo}>
              <SkeletonItem width="80%" height={20} marginBottom={10} breatheAnim={breatheAnim} />
              <SkeletonItem width="50%" height={14} marginBottom={4} breatheAnim={breatheAnim} />
              <SkeletonItem width="40%" height={14} marginBottom={4} breatheAnim={breatheAnim} />
            </View>
          </View>
          <View style={styles.followSection}>
            <SkeletonItem width="100%" height={40} marginBottom={0} breatheAnim={breatheAnim} />
          </View>
        </View>
      );
    }

    // Memoize avatar source
    const avatarSource = useMemo(() => {
      if (typeof storeInfo.avatar === 'string') {
        return { uri: storeInfo.avatar };
      }
      return storeInfo.avatar;
    }, [storeInfo.avatar]);

    // Memoize follower count
    const followerCount = useMemo(() => {
      return streamInfo.sellerFollowers ? streamInfo.sellerFollowers.toString() : '0';
    }, [streamInfo.sellerFollowers]);

    return (
      <View style={styles.storeSection}>
        <View style={styles.storeHeader}>
          <View style={styles.avatarContainer}>
            <GlassImage 
              source={avatarSource} 
              imageStyle={styles.avatar} 
              glassStyle={styles.avatar} 
              placeholderColor="rgba(255, 255, 255, 0.1)" 
              blurIntensity={20} 
              tint="dark"
            />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{storeInfo.name}</Text>
            <Text style={styles.username}>{storeInfo.username}</Text>
            <View style={styles.followerCount}>
              <MaterialIcons name="people" size={16} color={COLORS.textTertiary} />
              <Text style={styles.followerText}>
                {followerCount} followers
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.followSection}>
          <FollowButton 
            isFollowing={isFollowing} 
            isFollowingLoading={isFollowingLoading} 
            onPress={handleFollowButtonPress} 
          />
        </View>
      </View>
    );
  }, [isLoading, storeInfo, streamInfo.sellerFollowers, breatheAnim, isFollowing, isFollowingLoading, handleFollowButtonPress]);

  // Memoized stream details renderer
  const renderStreamDetails = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.streamDetailsSection}>
          <SkeletonItem width="90%" height={24} marginBottom={16} breatheAnim={breatheAnim} />
          <SkeletonItem width="100%" height={16} marginBottom={8} breatheAnim={breatheAnim} />
          <SkeletonItem width="100%" height={16} marginBottom={8} breatheAnim={breatheAnim} />
          <SkeletonItem width="80%" height={16} marginBottom={20} breatheAnim={breatheAnim} />
          
          <View style={styles.infoRow}>
            <SkeletonItem width={24} height={24} marginBottom={0} breatheAnim={breatheAnim} />
            <SkeletonItem width="80%" height={16} marginBottom={0} breatheAnim={breatheAnim} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <SkeletonItem width={24} height={24} marginBottom={0} breatheAnim={breatheAnim} />
            <SkeletonItem width="60%" height={16} marginBottom={0} breatheAnim={breatheAnim} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <SkeletonItem width={24} height={24} marginBottom={0} breatheAnim={breatheAnim} />
            <SkeletonItem width="70%" height={16} marginBottom={0} breatheAnim={breatheAnim} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.tagsContainer}>
            <SkeletonItem width={80} height={30} marginBottom={0} breatheAnim={breatheAnim} />
            <SkeletonItem width={100} height={30} marginBottom={0} breatheAnim={breatheAnim} />
            <SkeletonItem width={90} height={30} marginBottom={0} breatheAnim={breatheAnim} />
          </View>
        </View>
      );
    }

    // Memoize formatted date and stream type
    const formattedStartDate = useMemo(() => formatStreamDate(streamInfo.actualStartTime), [streamInfo.actualStartTime]);
    const streamType = useMemo(() => streamInfo.type === 'auction' ? 'Auction' : 'Regular', [streamInfo.type]);
    const streamTitle = useMemo(() => streamInfo.title || 'Untitled Stream', [streamInfo.title]);
    const streamDescription = useMemo(() => streamInfo.description || 'No description provided', [streamInfo.description]);
    const streamCategory = useMemo(() => streamInfo.category || 'Uncategorized', [streamInfo.category]);
    const isLive = useMemo(() => streamInfo.status === 'live', [streamInfo.status]);
    const viewerCount = useMemo(() => streamInfo.viewerCount?.toLocaleString() || '0', [streamInfo.viewerCount]);

    // Memoize tags rendering
    const tagsSection = useMemo(() => {
      if (!streamInfo.tags || streamInfo.tags.length === 0) return null;
      
      return (
        <View style={styles.tagsContainer}>
          {streamInfo.tags.map((tag, index) => (
            <TagItem key={index} tag={tag} />
          ))}
        </View>
      );
    }, [streamInfo.tags]);
    
    return (
      <View style={styles.streamDetailsSection}>
        <Text style={styles.streamTitle}>{streamTitle}</Text>
        
        <Text style={styles.description}>{streamDescription}</Text>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="category" size={20} color={COLORS.textTertiary} />
          <Text style={styles.infoText}>
            Category: {streamCategory}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color={COLORS.textTertiary} />
          <Text style={styles.infoText}>
            Started: {formattedStartDate}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <FontAwesome name="tag" size={18} color={COLORS.textTertiary} />
          <Text style={styles.infoText}>
            Type: {streamType} Stream
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        {tagsSection}
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: isLive ? COLORS.primary : COLORS.danger }
          ]} />
          <Text style={styles.statusText}>
            {isLive ? 'LIVE NOW' : 'ENDED'}
          </Text>
          
          {streamInfo.viewerCount !== undefined && (
            <View style={styles.viewersContainer}>
              <Ionicons name="eye-outline" size={16} color={COLORS.textTertiary} />
              <Text style={styles.viewersText}>
                {viewerCount} viewers
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [isLoading, streamInfo, breatheAnim]);

  // Main render - simplified for performance
  return (
    <ScrollView 
      className="h-[400px]" 
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.scrollContent}>
        {renderStoreSection()}
        {renderStreamDetails()}
      </View>
    </ScrollView>
  );
};

// Pre-compute styles once
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.dark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContainer: {
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.avatarFallback,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  followerCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followerText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginLeft: 6,
  },
  followSection: {
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  followingButton: {
    backgroundColor: COLORS.backgroundDark,
  },
  followButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  followIcon: {
    marginLeft: 8,
  },
  streamDetailsSection: {
    paddingHorizontal: 23,
    paddingVertical: 20,
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 16,
    color: COLORS.textQuaternary,
    lineHeight: 24,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.textQuaternary,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 10,
  },
  tagItem: {
    backgroundColor: COLORS.backgroundLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: COLORS.backgroundLighter,
    padding: 12,
    borderRadius: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  viewersText: {
    color: COLORS.textTertiary,
    fontSize: 14,
    marginLeft: 6,
  },
});

// Export memoized component for better performance
const StreamInfo = memo(StreamInfoComponent);
export default StreamInfo; 