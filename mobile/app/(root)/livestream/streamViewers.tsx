import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import React, { useRef, useEffect, useState, useCallback, useMemo, memo, useReducer } from 'react';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetScrollView, BottomSheetFlatList, BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';

interface Viewer {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImage?: {
    url: string;
  };
}

interface StreamViewersProps {
  viewers: Viewer[];
  hostInfo?: {
    name: string;
    avatar: any;
  };
  closeSheet: () => void;
}

// Pre-calculate dimensions once
const { width } = Dimensions.get('window');

// Pre-define default avatar for consistent reference
const DEFAULT_AVATAR = require('@/assets/icons/animoji.png');

// Pre-computed array for skeleton items
const SKELETON_ARRAY = Array(8).fill(null);

// Pre-define colors for better performance
const COLORS = {
  primary: '#16783A',
  white: '#FFFFFF',
  dark: '#121212',
  transparent: 'transparent',
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.05)',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.5)',
  textQuaternary: 'rgba(255,255,255,0.3)',
  backgroundLight: 'rgba(255,255,255,0.1)',
  gold: '#FFD700',
  avatarFallback: '#333',
};

// Pre-define avatar colors for consistent references
const AVATAR_COLORS = [
      '#FF5733', '#33A1FF', '#33FF57', '#BD33FF',
      '#FFD133', '#33FFBD', '#FF33BD', '#7D33FF',
      '#FF7D33', '#33FF7D', '#FF3333', '#33A8FF'
    ];

// Memoized Skeleton Item Component
const SkeletonItem = memo(({ index = 0, breatheAnim }: { index?: number, breatheAnim: Animated.Value }) => {
  // Calculate styles outside of render when possible
  const delayFactor = index * 0.1;
  
  // Memoize interpolated values to prevent recalculation
  const animatedOpacity = useMemo(() => {
    return breatheAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7]
    });
  }, [breatheAnim]);

  const pulseStyles = useMemo(() => {
    return {
      opacity: Animated.add(animatedOpacity, new Animated.Value(-delayFactor)).interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
        extrapolate: 'clamp'
      })
    };
  }, [animatedOpacity, delayFactor]);

    return (
      <Animated.View style={[styles.viewerItem, pulseStyles]}>
        <View style={styles.avatarContainer}>
          <Animated.View
            style={[
              styles.avatar,
            { backgroundColor: COLORS.backgroundLight },
              pulseStyles
            ]}
          />
        </View>

        <View style={styles.viewerInfo}>
        <Animated.View style={[styles.skeletonName, pulseStyles]} />
        <Animated.View style={[styles.skeletonUsername, pulseStyles]} />
      </View>
    </Animated.View>
  );
});

// Memoized Viewer Item Component
const ViewerItem = memo(({ 
  item, 
  index, 
  totalViewers, 
  hostInfo, 
  pulseAnim 
}: { 
  item: Viewer; 
  index: number; 
  totalViewers: number; 
  hostInfo?: { name: string; avatar: any; }; 
  pulseAnim: Animated.Value;
}) => {
  // Skip invalid items
  if (!item || !item._id) return null;

  // Memoize computed values
  const initials = useMemo(() => {
    if (item.firstName && item.lastName) {
      return `${item.firstName.charAt(0)}${item.lastName.charAt(0)}`.toUpperCase();
    } else if (item.firstName) {
      return item.firstName.charAt(0).toUpperCase();
    } else if (item.username) {
      return item.username.charAt(0).toUpperCase();
    }
    return '?';
  }, [item.firstName, item.lastName, item.username]);

  const avatarColor = useMemo(() => {
    if (!item._id) return AVATAR_COLORS[0];
    
    // Fast hash calculation
    let sum = 0;
    const id = item._id;
    const len = Math.min(id.length, 6); // Limit to first 6 chars for speed
    for (let i = 0; i < len; i++) {
      sum += id.charCodeAt(i);
    }
    
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  }, [item._id]);

  const displayName = useMemo(() => {
    return (item.firstName && item.lastName 
      ? `${item.firstName} ${item.lastName}` 
      : (item.firstName || 'Anonymous')) || item.username;
  }, [item.firstName, item.lastName, item.username]);

  // Calculate flags once
  const isHost = useMemo(() => hostInfo && hostInfo.name === displayName, [hostInfo, displayName]);
  const isNew = useMemo(() => index > totalViewers - 2, [index, totalViewers]);

    return (
      <View style={styles.viewerItem}>
        <View style={styles.avatarContainer}>
          {item.profileImage?.url ? (
            <Image
              source={{ uri: item.profileImage.url }}
              style={styles.avatar}
            defaultSource={DEFAULT_AVATAR}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: avatarColor }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}

          {isNew && (
            <View style={styles.newDot}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                  backgroundColor: COLORS.primary,
                    opacity: pulseAnim,
                    borderRadius: 5,
                  }
                ]}
              />
            </View>
          )}

          {isHost && (
            <View style={styles.hostBadge}>
            <MaterialIcons name="verified" size={12} color={COLORS.primary} />
            </View>
          )}
        </View>

        <View style={styles.viewerInfo}>
          <Text style={styles.viewerName} numberOfLines={1}>
            {displayName}
            {isHost && <Text style={styles.hostText}> · Host</Text>}
          </Text>
          {item.username && item.firstName && (
            <Text style={styles.viewerUsername} numberOfLines={1}>
              @{item.username}
            </Text>
          )}
        </View>

        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>New</Text>
          </View>
        )}
      </View>
    );
}, (prevProps, nextProps) => {
  // Custom equality check to prevent unnecessary re-renders
  return (
    prevProps.item._id === nextProps.item._id &&
    prevProps.index === nextProps.index &&
    prevProps.totalViewers === nextProps.totalViewers &&
    prevProps.hostInfo?.name === nextProps.hostInfo?.name
  );
});

// State reducer for more efficient state updates
type StreamViewersState = {
  isLoading: boolean;
  safeViewers: Viewer[];
};

type StreamViewersAction = 
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_VIEWERS', payload: Viewer[] };

const viewersReducer = (state: StreamViewersState, action: StreamViewersAction): StreamViewersState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_VIEWERS':
      return { ...state, safeViewers: action.payload };
    default:
      return state;
  }
};

// Main component
const StreamViewers = memo(function StreamViewers({ viewers = [], hostInfo, closeSheet }: StreamViewersProps) {
  // Use reducer for better state management
  const [state, dispatch] = useReducer(viewersReducer, {
    isLoading: true,
    safeViewers: []
  });
  
  const { isLoading, safeViewers } = state;

  // Animation values - using refs to prevent rerenders
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  
  // List ref to prevent scroll recreations
  const listRef = useRef<BottomSheetFlatListMethods>(null);

  // Process viewers data only when it changes
  useEffect(() => {
    // Safely validate viewers data
    const processedViewers = Array.isArray(viewers) ? viewers : [];
    dispatch({ type: 'SET_VIEWERS', payload: processedViewers });
  }, [viewers]);

  // Setup animations once
  useEffect(() => {
    // Breathing pulse animation for new users
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    );
    
    // Breathing animation for skeleton loaders
    const breatheAnimation = Animated.loop(
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

    pulseAnimation.start();
    breatheAnimation.start();

    // Auto-hide loading state
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1200);

    return () => {
      pulseAnimation.stop();
      breatheAnimation.stop();
      clearTimeout(timer);
    };
  }, []);

  // Memoized Host Avatar Source function
  const getHostAvatarSource = useCallback(() => {
    if (!hostInfo || !hostInfo.avatar) {
      return DEFAULT_AVATAR;
    }

    try {
        if (typeof hostInfo.avatar === 'string') {
          return { uri: hostInfo.avatar };
        }

        if (typeof hostInfo.avatar === 'object' && hostInfo.avatar.uri) {
          return { uri: hostInfo.avatar.uri };
        }

        if (typeof hostInfo.avatar === 'number') {
          return hostInfo.avatar; // Require'd image resource ID
        }

      return DEFAULT_AVATAR;
      } catch (error) {
      return DEFAULT_AVATAR;
    }
  }, [hostInfo]);

  // Memoized render functions to prevent recreation on every render
  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>In this stream</Text>
          <View style={styles.viewerCount}>
            <Ionicons name="people" size={16} color={COLORS.white} />
            <Text style={styles.viewerCountText}>{safeViewers.length}</Text>
          </View>
        </View>
      </View>
    </View>
  ), [safeViewers.length]);

  const renderHostSection = useCallback(() => {
    if (!hostInfo || !hostInfo.name) return null;

    const hostAvatarSource = getHostAvatarSource();

    return (
      <View style={styles.hostSection}>
        <LinearGradient
          colors={['rgba(22, 120, 58, 0.2)', 'rgba(22, 120, 58, 0.05)']}
          style={styles.hostGradient}
        >
          <View style={styles.hostContent}>
            <View style={styles.hostAvatarContainer}>
              <Image
                source={hostAvatarSource}
                style={styles.hostAvatar}
                defaultSource={DEFAULT_AVATAR}
              />
              <View style={styles.hostIconBadge}>
                <MaterialIcons name="stars" size={14} color={COLORS.gold} />
              </View>
            </View>

            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{hostInfo.name}</Text>
              <Text style={styles.hostLabel}>Stream Host</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }, [hostInfo, getHostAvatarSource]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <MaterialIcons name="people-outline" size={50} color={COLORS.textQuaternary} />
      <Text style={styles.emptyStateText}>No viewers yet</Text>
      <Text style={styles.emptyStateSubText}>Share the stream to invite friends</Text>
    </View>
  ), []);
  
  // Optimized renderItem function
  const renderViewerItem = useCallback(({ item, index }: { item: Viewer; index: number }) => (
    <ViewerItem 
      item={item} 
      index={index} 
      totalViewers={safeViewers.length} 
      hostInfo={hostInfo} 
      pulseAnim={pulseAnim} 
    />
  ), [safeViewers.length, hostInfo, pulseAnim]);

  // Optimized keyExtractor
  const keyExtractor = useCallback((item: Viewer) => `viewer-${item._id || Math.random()}`, []);

  // Render skeleton items with optimized rendering
  const renderSkeletonItems = useCallback(() => (
    <View style={styles.skeletonContainer}>
      {SKELETON_ARRAY.map((_, i) => (
        <SkeletonItem key={`skeleton-${i}`} index={i} breatheAnim={breatheAnim} />
      ))}
    </View>
  ), [breatheAnim]);

  // Main render function - optimized to avoid unnecessary calculations
  return (
    <BottomSheetScrollView 
      showsVerticalScrollIndicator={false} 
      style={styles.container}
      removeClippedSubviews={true}
      contentInsetAdjustmentBehavior="automatic"
    >
      {renderHeader()}

      {hostInfo && renderHostSection()}

      {isLoading ? renderSkeletonItems() : (
        <BottomSheetFlatList
          ref={listRef}
          scrollEnabled={false}
          data={safeViewers}
          renderItem={renderViewerItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          windowSize={5}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          getItemLayout={(data, index) => ({
            length: 79, // height of item + vertical padding + border
            offset: 79 * index,
            index,
          })}
        />
      )}
    </BottomSheetScrollView>
  );
});

// Pre-compute styles once
const styles = StyleSheet.create({
  container: {
    height: "100%",
    backgroundColor: COLORS.dark,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginRight: 12,
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewerCountText: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 4,
  },
  closeButton: {
    width: 33,
    height: 33,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    height: 79, // Fixed height for getItemLayout optimization
  },
  skeletonContainer: {
    paddingTop: 10,
  },
  skeletonName: {
    height: 16,
    width: '60%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonUsername: {
    height: 12,
    width: '40%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.avatarFallback,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  hostBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  viewerUsername: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  hostText: {
    color: COLORS.primary,
    fontWeight: 'normal',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(22, 120, 58, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  newBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  hostSection: {
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hostGradient: {
    borderRadius: 12,
    padding: 16,
  },
  hostContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostAvatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  hostAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  hostIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hostLabel: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyStateSubText: {
    color: COLORS.textTertiary,
    fontSize: 14,
    marginTop: 8,
  },
  newDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.dark,
    overflow: 'hidden',
  },
});

export default StreamViewers; 