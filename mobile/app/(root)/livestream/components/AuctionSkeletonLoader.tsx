import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface AuctionSkeletonLoaderProps {
  type: 'loading' | 'fallback';
}

/**
 * Skeleton loader component for the LiveAuctionStudioFeed
 * Provides visual placeholders with pulsing animation while content is loading
 */
export const AuctionSkeletonLoader: React.FC<AuctionSkeletonLoaderProps> = ({ type }) => {
  const insets = useSafeAreaInsets();
  
  // Create staggered skeleton items
  const SkeletonItem = ({ index = 0, style = {} }: { index?: number, style?: any }) => {
    return (
      <Animated.View className='animate-pulse' style={style} />
    );
  };

  if (type === 'loading') {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        
        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Top Bar - Header */}
          <View style={[styles.topBar, { marginTop: insets.top + 15 }]}>
            <View style={styles.storeInfoContainer}>
              <SkeletonItem index={1} style={styles.avatarPlaceholder} />
              <View>
                <SkeletonItem index={2} style={styles.storeName} />
                <SkeletonItem index={3} style={styles.username} />
              </View>
              <SkeletonItem index={4} style={styles.followButton} />
            </View>
            
            <View style={styles.rightHeaderContainer}>
              <SkeletonItem index={5} style={styles.viewerCount} />
  
            </View>
          </View>
          
          {/* Main Content Area */}
          <View style={styles.mainContentArea}>
            {/* Right Side Actions */}
            <View style={styles.rightActionsContainer}>
              {[0, 1, 2 ].map((index) => (
                <View key={index} style={styles.actionItem}>
                  <SkeletonItem index={7 + index} style={styles.actionButton} />
                  <SkeletonItem index={12 + index} style={styles.actionText} />
                </View>
              ))}
            </View>
            
            {/* Comments */}
            <View style={styles.commentsContainer}>
              {[0, 1, 2, 3].map((index) => (
                <View key={index} style={styles.commentItem}>
                  <SkeletonItem index={17 + index} style={styles.commentAvatar} />
                  <View style={styles.commentContent}>
                    <SkeletonItem index={21 + index} style={styles.commentUser} />
                    <SkeletonItem index={25 + index} style={styles.commentText} />
                  </View>
                </View>
              ))}
            </View>
          </View>
          
          {/* Bottom Area */}
          <View style={styles.bottomArea}>
            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              <SkeletonItem index={29} style={styles.inputWithButtonContainer} />
            </View>
            
            {/* Winning Notification */}
            <View style={styles.winningNotificationContainer}>
              <SkeletonItem index={30} style={styles.winningNotificationAvatar} />
              <SkeletonItem index={31} style={styles.winningText} />
            </View>
            
            {/* Auction Product Card */}
            <View style={styles.auctionProductCardContainer}>
              <View style={styles.auctionCard}>
                <View style={styles.auctionCardTop}>
                  <View style={styles.productImageContainer}>
                    <SkeletonItem index={32} style={styles.productImage} />
                  </View>
                  <View style={styles.auctionCardInfo}>
                    <SkeletonItem index={33} style={styles.productTitle} />
                    <SkeletonItem index={34} style={styles.productDescription} />
                    <SkeletonItem index={35} style={styles.productPrice} />
                    <SkeletonItem index={36} style={styles.productQuantity} />
                  </View>
                  <View style={styles.auctionCardPrice}>
                    <SkeletonItem index={37} style={styles.currentBid} />
                    <SkeletonItem index={38} style={styles.stockInfo} />
                  </View>
                </View>
                
                {/* Timer */}
                <View style={styles.timerContainer}>
                  <SkeletonItem index={39} style={styles.timer} />
                </View>
                
                {/* Tags */}
                <View style={styles.tagsContainer}>
                  <SkeletonItem index={40} style={styles.tags} />
                </View>
                
                {/* Bid Buttons */}
                <View style={styles.bidButtonsContainer}>
                  <View style={styles.awaitingButtonContainer}>
                    <SkeletonItem index={41} style={styles.awaitingButton} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }
  
  // Fallback skeleton (simpler, focuses on empty state)
  return (
    <View style={styles.container}>
      <View style={styles.fallbackContainer}>
        <SkeletonItem index={0} style={styles.logoPlaceholder} />
        <SkeletonItem index={1} style={styles.fallbackText} />
        <SkeletonItem index={2} style={styles.fallbackSubtext} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  videoPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#111111',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'absolute',
    gap: 5,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  storeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rightHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  storeName: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 6,
  },
  username: {
    width: 80,
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  followButton: {
    width: 80,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(22, 120, 58, 0.3)',
    marginLeft: 16,
  },
  menuIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewerCount: {
    width: 60,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  mainContentArea: {
    height: '51%',
    position: 'relative',
  },
  rightActionsContainer: {
    position: 'absolute',
    right: 13,
    bottom: 10,
    maxHeight: 250,
    zIndex: 10,
  },
  actionItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 4,
  },
  actionText: {
    width: 36,
    height: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  commentsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    width: '70%',
    maxHeight: 200,
    zIndex: 10,
    paddingHorizontal: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 6,
  },
  commentText: {
    width: '90%',
    height: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomArea: {
    position: 'relative',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  commentInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  inputWithButtonContainer: {
    height: 50,
    borderRadius: 30,
    backgroundColor: 'rgba(50, 50, 50, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  winningNotificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  winningNotificationAvatar: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(106, 90, 205, 0.5)', // Purple for winner avatar
    marginRight: 8,
  },
  winningText: {
    width: 150,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  auctionProductCardContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  auctionCard: {
    borderRadius: 12,
    padding: 12,
  },
  auctionCardTop: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  auctionCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    width: '100%',
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 6,
  },
  productDescription: {
    width: '80%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 6,
  },
  productPrice: {
    width: '50%',
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 4,
  },
  productQuantity: {
    width: '40%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  auctionCardPrice: {
    alignItems: 'flex-end',
    width: 80,
  },
  currentBid: {
    width: 70,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 6,
  },
  stockInfo: {
    width: 50,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  timerContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  timer: {
    width: 50,
    height: 14,
    backgroundColor: 'rgba(22, 120, 58, 0.3)',
    borderRadius: 4,
  },
  tagsContainer: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tags: {
    width: 120,
    height: 12,
    backgroundColor: 'transparent',
  },
  bidButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 8,
  },
  awaitingButtonContainer: {
    flex: 1,
  },
  awaitingButton: {
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    opacity: 0.6,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  logoPlaceholder: {
    width: 80,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
  },
  fallbackText: {
    width: 200,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  fallbackSubtext: {
    width: 240,
    height: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
}); 