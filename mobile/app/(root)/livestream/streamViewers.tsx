import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

const { width } = Dimensions.get('window');

const StreamViewers = ({ viewers = [], hostInfo, closeSheet }: StreamViewersProps) => {
  console.log('bottom sheet viewers', viewers);
  console.log('bottom sheet hostInfo', hostInfo);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);

  // Safely validate viewers data
  const safeViewers = Array.isArray(viewers) ? viewers : [];

  // Start animations
  useEffect(() => {
    // Breathing pulse animation for new users
    Animated.loop(
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
    ).start();
    
    // Breathing animation for skeleton loaders
    Animated.loop(
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
    ).start();
    
    // Auto-hide loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, []);

  const getInitials = (firstName?: string, lastName?: string, username?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (username) {
      return username.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Function to generate a consistent avatar color based on the id
  const getAvatarColor = (id: string) => {
    if (!id) return '#33A1FF'; // Default color if id is missing
    
    const colors = [
      '#FF5733', '#33A1FF', '#33FF57', '#BD33FF',
      '#FFD133', '#33FFBD', '#FF33BD', '#7D33FF',
      '#FF7D33', '#33FF7D', '#FF3333', '#33A8FF'
    ];

    // Use a simple hash function to get a consistent color
    let sum = 0;
    for (let i = 0; i < id.length; i++) {
      sum += id.charCodeAt(i);
    }

    return colors[sum % colors.length];
  };

  // Skeleton loader item with breathing animation
  const SkeletonItem = ({ index = 0 }: { index?: number }) => {
    // Stagger the animations slightly based on index
    const delayFactor = index * 0.1;
    const animatedOpacity = breatheAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7]
    });

    const pulseStyles = {
      opacity: Animated.add(animatedOpacity, new Animated.Value(-delayFactor)).interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
        extrapolate: 'clamp'
      })
    };
    
    return (
      <Animated.View style={[styles.viewerItem, pulseStyles]}>
        <View style={styles.avatarContainer}>
          <Animated.View 
            style={[
              styles.avatar, 
              { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              pulseStyles
            ]} 
          />
        </View>
        
        <View style={styles.viewerInfo}>
          <Animated.View style={[{
            height: 16,
            width: '60%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            marginBottom: 8
          }, pulseStyles]} />
          <Animated.View style={[{
            height: 12,
            width: '40%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 4
          }, pulseStyles]} />
        </View>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>In this stream</Text>
          <View style={styles.viewerCount}>
            <Ionicons name="people" size={16} color="#FFF" />
            <Text style={styles.viewerCountText}>{safeViewers.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={closeSheet} style={styles.closeButton}>
          <AntDesign name="close" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderViewerItem = ({ item, index }: { item: Viewer; index: number }) => {
    if (!item || !item._id) {
      return null; // Skip invalid items
    }
    
    const initials = getInitials(item.firstName, item.lastName, item.username);
    const avatarColor = getAvatarColor(item._id);
    const displayName = item.username ||
      (item.firstName && item.lastName ?
        `${item.firstName} ${item.lastName}` :
        (item.firstName || 'Anonymous'));

    const isHost = hostInfo && hostInfo.name === displayName;
    const isNew = index > safeViewers.length - 4;

    return (
      <View style={styles.viewerItem}>
        <View style={styles.avatarContainer}>
          {item.profileImage?.url ? (
            <Image
              source={{ uri: item.profileImage.url }}
              style={styles.avatar}
              defaultSource={require('@/assets/icons/animoji.png')}
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
                    backgroundColor: '#16783A',
                    opacity: pulseAnim,
                    borderRadius: 5,
                  }
                ]}
              />
            </View>
          )}

          {isHost && (
            <View style={styles.hostBadge}>
              <MaterialIcons name="verified" size={12} color="#16783A" />
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
  };

  const renderHostSection = () => {
    if (!hostInfo || !hostInfo.name) return null;

    // Safely handle host avatar
    const getHostAvatarSource = () => {
      try {
        if (!hostInfo.avatar) {
          return require('@/assets/icons/animoji.png');
        }
        
        if (typeof hostInfo.avatar === 'string') {
          return { uri: hostInfo.avatar };
        }
        
        if (typeof hostInfo.avatar === 'object' && hostInfo.avatar.uri) {
          return { uri: hostInfo.avatar.uri };
        }
        
        if (typeof hostInfo.avatar === 'number') {
          return hostInfo.avatar; // Require'd image resource ID
        }
        
        return require('@/assets/icons/animoji.png');
      } catch (error) {
        console.error('Error handling host avatar:', error);
        return require('@/assets/icons/animoji.png');
      }
    };

    return (
      <View style={styles.hostSection}>
        <LinearGradient
          colors={['rgba(22, 120, 58, 0.2)', 'rgba(22, 120, 58, 0.05)']}
          style={styles.hostGradient}
        >
          <View style={styles.hostContent}>
            <View style={styles.hostAvatarContainer}>
              <Image
                source={getHostAvatarSource()}
                style={styles.hostAvatar}
                defaultSource={require('@/assets/icons/animoji.png')}
              />
              <View style={styles.hostIconBadge}>
                <MaterialIcons name="stars" size={14} color="#FFD700" />
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
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="people-outline" size={50} color="rgba(255,255,255,0.3)" />
      <Text style={styles.emptyStateText}>No viewers yet</Text>
      <Text style={styles.emptyStateSubText}>Share the stream to invite friends</Text>
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {renderHeader()}

      {hostInfo && renderHostSection()}

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[...Array(8)].map((_, i) => (
            <SkeletonItem key={`skeleton-${i}`} index={i} />
          ))}
        </View>
      ) : (
        <FlatList
          scrollEnabled={false}
          data={safeViewers}
          renderItem={renderViewerItem}
          keyExtractor={(item) => item._id || Math.random().toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    //flex: 1,
    height: 300,
    backgroundColor: '#121212',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 12,
  },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewerCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
  },
  closeButton: {
    width: 33,
    height: 33,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  skeletonContainer: {
    paddingTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#333',
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16783A',
  },
  viewerInfo: {
    flex: 1,
  },
  viewerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewerUsername: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  hostText: {
    color: '#16783A',
    fontWeight: 'normal',
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(22, 120, 58, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#16783A',
  },
  newBadgeText: {
    color: '#16783A',
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
    borderColor: '#16783A',
  },
  hostIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16783A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121212',
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hostLabel: {
    color: '#16783A',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyStateSubText: {
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: '#16783A',
    borderWidth: 1,
    borderColor: '#121212',
    overflow: 'hidden',
  },
});

export default StreamViewers; 