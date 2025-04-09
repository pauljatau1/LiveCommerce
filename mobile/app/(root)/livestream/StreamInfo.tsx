import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, ActivityIndicator } from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { AntDesign, Ionicons, MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

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
}

const { width } = Dimensions.get('window');

const StreamInfo = ({ 
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
  console.log('storeInfo', storeInfo)

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

  // Handle follow/unfollow button click
  const handleFollowButtonPress = async () => {
    if (!sellerId) {
      console.error("No seller ID available");
      return;
    }

    if (isFollowingLoading) return;

    try {
      if (isFollowing) {
        onUnfollow && await onUnfollow();
      } else {
        onFollow && await onFollow();
      }
    } catch (error) {
      console.error("Error with follow/unfollow:", error);
    }
  };

  // Format dates to be more readable
  const formatStreamDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.format('MMM D, YYYY • h:mm A');
  };

  // Render skeleton loader items
  const SkeletonItem = ({ width = '100%', height = 16, marginBottom = 8 }: SkeletonItemProps) => {
    const animatedOpacity = breatheAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7]
    });
    
    return (
      <Animated.View 
        style={[
          {
            width,
            height,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 4,
            marginBottom
          },
          { opacity: animatedOpacity }
        ]} 
      />
    );
  };

  // Render the header with store info
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>Stream Info</Text>
        <TouchableOpacity onPress={closeSheet} style={styles.closeButton}>
          <AntDesign name="close" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render store section
  const renderStoreSection = () => {
    if (isLoading) {
      return (
        <View style={styles.storeSection}>
          <View style={styles.storeHeader}>
            <View style={styles.avatarContainer}>
              <SkeletonItem width={70} height={70} marginBottom={0} />
            </View>
            <View style={styles.storeInfo}>
              <SkeletonItem width="80%" height={20} marginBottom={10} />
              <SkeletonItem width="50%" height={14} marginBottom={4} />
              <SkeletonItem width="40%" height={14} marginBottom={4} />
            </View>
          </View>
          <View style={styles.followSection}>
            <SkeletonItem width="100%" height={40} marginBottom={0} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.storeSection}>
        <View style={styles.storeHeader}>
          <View style={styles.avatarContainer}>
            {typeof storeInfo.avatar === 'string' ? (
              <Image source={{ uri: storeInfo.avatar }} style={styles.avatar} />
            ) : (
              <Image source={storeInfo.avatar} style={styles.avatar} />
            )}
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{storeInfo.name}</Text>
            <Text style={styles.username}>{storeInfo.username}</Text>
            <View style={styles.followerCount}>
              <MaterialIcons name="people" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.followerText}>
                {streamInfo.sellerFollowers ? streamInfo.sellerFollowers : '0'} followers
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.followSection}>
          <TouchableOpacity 
            style={[
              styles.followButton, 
              isFollowing && styles.followingButton
            ]}
            onPress={handleFollowButtonPress}
            disabled={isFollowingLoading}
          >
            {isFollowingLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
                {isFollowing && <AntDesign name="check" size={14} color="#FFF" style={styles.followIcon} />}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render stream details
  const renderStreamDetails = () => {
    if (isLoading) {
      return (
        <View style={styles.streamDetailsSection}>
          <SkeletonItem width="90%" height={24} marginBottom={16} />
          <SkeletonItem width="100%" height={16} marginBottom={8} />
          <SkeletonItem width="100%" height={16} marginBottom={8} />
          <SkeletonItem width="80%" height={16} marginBottom={20} />
          
          <View style={styles.infoRow}>
            <SkeletonItem width={24} height={24} marginBottom={0} />
            <SkeletonItem width="80%" height={16} marginBottom={0} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <SkeletonItem width={24} height={24} marginBottom={0} />
            <SkeletonItem width="60%" height={16} marginBottom={0} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <SkeletonItem width={24} height={24} marginBottom={0} />
            <SkeletonItem width="70%" height={16} marginBottom={0} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.tagsContainer}>
            <SkeletonItem width={80} height={30} marginBottom={0} />
            <SkeletonItem width={100} height={30} marginBottom={0} />
            <SkeletonItem width={90} height={30} marginBottom={0} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.streamDetailsSection}>
        <Text style={styles.streamTitle}>{streamInfo.title || 'Untitled Stream'}</Text>
        
        <Text style={styles.description}>
          {streamInfo.description || 'No description provided'}
        </Text>
        
        <View style={styles.infoRow}>
          <MaterialIcons name="category" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.infoText}>
            Category: {streamInfo.category || 'Uncategorized'}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.infoText}>
            Started: {formatStreamDate(streamInfo.actualStartTime)}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <FontAwesome name="tag" size={18} color="rgba(255,255,255,0.7)" />
          <Text style={styles.infoText}>
            Type: {streamInfo.type === 'auction' ? 'Auction' : 'Regular'} Stream
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        {streamInfo.tags && streamInfo.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {streamInfo.tags.map((tag, index) => (
              <View key={index} style={styles.tagItem}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: streamInfo.status === 'live' ? '#16783A' : '#FF5733' }
          ]} />
          <Text style={styles.statusText}>
            {streamInfo.status === 'live' ? 'LIVE NOW' : 'ENDED'}
          </Text>
          
          {streamInfo.viewerCount !== undefined && (
            <View style={styles.viewersContainer}>
              <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.7)" />
              <Text style={styles.viewersText}>
                {streamInfo.viewerCount.toLocaleString()} viewers
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView className="h-[400px]">
      {/*{renderHeader()}*/}
      
      <View 
        style={styles.scrollContent}
      >
        {renderStoreSection()}
        {renderStreamDetails()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    //flex: 1,
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  scrollContainer: {
    //flex: 1,
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: '#333',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  followerCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 6,
  },
  followSection: {
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: '#16783A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  followingButton: {
    backgroundColor: '#444444',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  followIcon: {
    marginLeft: 8,
  },
  streamDetailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
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
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 10,
  },
  tagItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tagText: {
    color: '#16783A',
    fontSize: 14,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  viewersText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default StreamInfo; 