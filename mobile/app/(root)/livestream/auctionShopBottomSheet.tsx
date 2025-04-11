import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Dimensions, RefreshControl, TextInput } from 'react-native';
import { AntDesign, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

// Types for the stream products
interface StreamProduct {
  _id: string;
  product: {
    productId: string;
    name: string;
    quantity: number;
    description?: string;
    price: number;
    discountedPrice?: number;
    images: {
      url: string;
      _id: string;
    }[];
    seller?: {
      storeName: string;
      businessName: string;
      storeAvatar?: {
        url: string;
      };
    };
    category?: string;
    id?: string;
  };
  currentBid?: number;
  bidStatus?: string;
  orderCreated?: boolean;
  minBid?: number;
  maxBid?: number;
  currentBidder?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    profileImage?: {
      url: string;
    };
  };
  bidWinner?: {
    bidAmount: number;
    buyer: any;
    winningTime: string;
  };
}

interface AuctionShopBottomSheetProps {
  streamProducts: StreamProduct[];
  closeSheet: () => void;
  isLoading?: boolean;
}

const SkeletonLoader = () => (
  <View style={styles.skeletonContainer}>
    {[1, 2, 3].map((_, index) => (
      <MotiView
        key={`skeleton-${index}`}
        style={styles.card}
        from={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 1000,
          loop: true,
        }}
      >
        <View style={styles.cardLeft}>
          <View style={styles.skeletonImage} />
        </View>
        <View style={styles.cardContent}>
          <View style={[styles.skeletonText, { width: '90%', height: 16, marginBottom: 8 }]} />
          <View style={[styles.skeletonText, { width: '40%', height: 20, marginBottom: 8 }]} />
          <View style={styles.cardFooter}>
            <View style={[styles.skeletonText, { width: '45%', height: 14 }]} />
          </View>
        </View>
      </MotiView>
    ))}
  </View>
);

const AuctionShopBottomSheet = ({ streamProducts, closeSheet, isLoading = false }: AuctionShopBottomSheetProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Auctions');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  // Render empty state for auctions
  const renderEmptyAuctions = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="gavel" size={64} color="#444" />
      <Text style={styles.emptyStateTitle}>No Auctions Available</Text>
      <Text style={styles.emptyStateDescription}>
        There are no auction products available at the moment.
      </Text>
    </View>
  );

  // Render an auction product card
  const renderAuctionCard = ({ item, index }: { item: StreamProduct, index: number }) => {
    const isEnded = item.bidStatus === 'ended';
    const isActive = item.bidStatus === 'active';
    const bidAmount = item.currentBid || item.minBid || item.product.price;
    
    return (
      <View 
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Image 
              source={{ uri: item.product.images[0]?.url }} 
              style={styles.cardImage}
              resizeMode="cover"
            />
            {item.bidStatus === 'active' && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>LIVE</Text>
              </View>
            )}
            {isEnded && (
              <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
                style={styles.cardOverlay}
              >
                <Text style={styles.overlayLabel}>AUCTION ENDED</Text>
              </LinearGradient>
            )}
          </View>
          
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.product.name}</Text>
            </View>
            
            <View style={styles.cardFooter}>
              <View style={styles.metaInfo}>
                {isActive ? (
                  <View style={[styles.statusBadge, styles.activeBidBadge]}>
                    <Ionicons name="time-outline" size={12} color="#16783A" />
                    <Text style={styles.statusText}>Bidding now</Text>
                  </View>
                ) : isEnded ? (
                  <View style={[styles.statusBadge, styles.endedBadge]}>
                    <Ionicons name="checkmark-circle-outline" size={12} color="#F44336" />
                    <Text style={[styles.statusText, styles.endedText]}>Auction ended</Text>
                  </View>
                ) : (
                  <View style={styles.statusBadge}>
                    <Ionicons name="time-outline" size={12} color="#FF9800" />
                    <Text style={[styles.statusText, styles.waitingText]}>Waiting</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        
        {/* Additional auction details section */}
        <View style={styles.auctionDetails}>
          <View style={styles.auctionDetailRow}>
            <View style={styles.auctionDetailItem}>
              <Text style={styles.auctionDetailLabel}>Starting Bid</Text>
              <Text style={styles.auctionDetailValue}>{formatPrice(item.minBid || item.product.price)}</Text>
            </View>
            
            <View style={styles.auctionDetailItem}>
              <Text style={styles.auctionDetailLabel}>Current Bid</Text>
              <Text style={styles.auctionDetailValue}>
                {item.currentBid ? formatPrice(item.currentBid) : 'No bids yet'}
              </Text>
            </View>
            
            <View style={styles.auctionDetailItem}>
              <Text style={styles.auctionDetailLabel}>Status</Text>
              <Text style={[
                styles.auctionDetailValue,
                isActive ? styles.activeText : 
                isEnded ? styles.endedText : styles.waitingText
              ]}>
                {isActive ? 'Active' : isEnded ? 'Ended' : 'Waiting'}
              </Text>
            </View>
          </View>
          
          {item.bidWinner && (
            <View style={styles.winnerInfo}>
              <MaterialIcons name="emoji-events" size={14} color="#FFD700" />
              <Text style={styles.winnerName}>
                Winner: {item.bidWinner.buyer.username || 'Anonymous'} - {formatPrice(item.bidWinner.bidAmount)}
              </Text>
            </View>
          )}
          
          {item.product.category && (
            <View style={styles.categoryInfo}>
              <MaterialIcons name="category" size={14} color="#888" />
              <Text style={styles.categoryName}>{item.product.category}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render categories empty state
  const renderCategoriesEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="category" size={64} color="#444" />
      <Text style={styles.emptyStateTitle}>Categories Coming Soon</Text>
      <Text style={styles.emptyStateDescription}>
        Browse by categories feature is under development.
      </Text>
    </View>
  );

  // Render a skeleton loader for auction products
  const renderAuctionSkeleton = ({ item }: { item: number }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Animatable.View 
            animation="pulse" 
            easing="ease-in-out" 
            iterationCount="infinite" 
            duration={1500}
            style={[styles.cardImage, styles.skeletonBox]} 
          />
        </View>
        <View style={styles.cardContent}>
          <View>
            <Animatable.View 
              animation="pulse" 
              easing="ease-in-out" 
              iterationCount="infinite" 
              duration={1500}
              style={[styles.skeletonBox, { width: '80%', height: 18, borderRadius: 4 }]} 
            />
            <View style={{ height: 8 }} />
            <Animatable.View 
              animation="pulse" 
              easing="ease-in-out" 
              iterationCount="infinite" 
              duration={1500}
              style={[styles.skeletonBox, { width: '50%', height: 16, borderRadius: 4 }]} 
            />
          </View>
          
          <View style={styles.cardFooter}>
            <Animatable.View 
              animation="pulse" 
              easing="ease-in-out" 
              iterationCount="infinite" 
              duration={1500}
              style={[styles.skeletonBox, { width: '40%', height: 16, borderRadius: 8 }]} 
            />
          </View>
        </View>
      </View>
      
      {/* Skeleton for additional auction details */}
      <View style={styles.auctionDetails}>
        <View style={styles.auctionDetailRow}>
          <View style={styles.auctionDetailItem}>
            <Animatable.View 
              animation="pulse" 
              easing="ease-in-out" 
              iterationCount="infinite" 
              duration={1500}
              style={[styles.skeletonBox, { width: '70%', height: 12, borderRadius: 4, marginBottom: 4 }]} 
            />
            <Animatable.View 
              animation="pulse" 
              easing="ease-in-out" 
              iterationCount="infinite" 
              duration={1500}
              style={[styles.skeletonBox, { width: '50%', height: 14, borderRadius: 4 }]} 
            />
          </View>
          
          <View style={styles.auctionDetailItem}>
            <Animatable.View 
              animation="pulse" 
              easing="ease-in-out" 
              iterationCount="infinite" 
              duration={1500}
              style={[styles.skeletonBox, { width: '70%', height: 12, borderRadius: 4, marginBottom: 4 }]} 
            />
            <Animatable.View 
              animation="pulse" 
              easing="ease-in-out" 
              iterationCount="infinite" 
              duration={1500}
              style={[styles.skeletonBox, { width: '50%', height: 14, borderRadius: 4 }]} 
            />
          </View>
          
          <View style={styles.auctionDetailItem}>
            <Animatable.View 
              animation="pulse" 
              easing="ease-in-out" 
              iterationCount="infinite" 
              duration={1500}
              style={[styles.skeletonBox, { width: '70%', height: 12, borderRadius: 4, marginBottom: 4 }]} 
            />
            <Animatable.View 
              animation="pulse" 
              easing="ease-in-out" 
              iterationCount="infinite" 
              duration={1500}
              style={[styles.skeletonBox, { width: '50%', height: 14, borderRadius: 4 }]} 
            />
          </View>
        </View>
      </View>
    </View>
  );

  // Function to handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // In a real implementation, you might want to reload the data here
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Function to filter products based on search query
  const filteredAuctionProducts = searchQuery 
    ? streamProducts.filter(item => 
        item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : streamProducts;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <AntDesign name="search1" size={18} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <AntDesign name="close" size={16} color="#777" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Auctions' && styles.activeTab]}
          onPress={() => setActiveTab('Auctions')}
        >
          <Text style={[styles.tabText, activeTab === 'Auctions' && styles.activeTabText]}>Auctions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Categories' && styles.activeTab]}
          onPress={() => setActiveTab('Categories')}
        >
          <Text style={[styles.tabText, activeTab === 'Categories' && styles.activeTabText]}>Categories</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContent}>
        {activeTab === 'Auctions' && (
          <>
            {isLoading ? (
              <FlatList
                data={[1, 2, 3, 4, 5]}
                renderItem={renderAuctionSkeleton}
                keyExtractor={(item) => `auction-skeleton-${item}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16 }}
              />
            ) : filteredAuctionProducts.length === 0 ? (
              <View style={styles.emptyState}>
                {searchQuery ? (
                  <>
                    <MaterialIcons name="search-off" size={48} color="#888" />
                    <Text style={styles.emptyStateText}>No auctions found for "{searchQuery}"</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="local-offer" size={48} color="#888" />
                    <Text style={styles.emptyStateText}>No auctions available</Text>
                  </>
                )}
              </View>
            ) : (
              <FlatList
                data={filteredAuctionProducts}
                renderItem={({ item, index }) => (
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', delay: index * 100, duration: 500 }}
                  >
                    {renderAuctionCard({ item, index })}
                  </MotiView>
                )}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#16783A"
                    colors={["#16783A"]}
                    progressBackgroundColor="#1E1E1E"
                  />
                }
              />
            )}
          </>
        )}

        {activeTab === 'Categories' && renderCategoriesEmptyState()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 600,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    paddingVertical: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#16783A',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  // Modern card styles
  card: {
    flexDirection: 'column',
    backgroundColor: '#1A1A1A',
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardRow: {
    flexDirection: 'row',
    padding: 12,
  },
  cardLeft: {
    width: 100,
    height: 100,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'LexendDecaSemiBold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: 'LexendDecaBold',
  },
  discount: {
    backgroundColor: 'rgba(22, 120, 58, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#16783A',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'LexendDecaSemiBold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  metaInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 120, 58, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#16783A',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'LexendDecaMedium',
  },
  activeBidBadge: {
    backgroundColor: 'rgba(22, 120, 58, 0.2)',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(22, 120, 58, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  endedBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  endedText: {
    color: '#F44336',
  },
  waitingText: {
    color: '#FF9800',
  },
  activeText: {
    color: '#16783A',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: 'LexendDecaBold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
  },
  // Skeleton loading styles
  skeletonContainer: {
    flex: 1,
    padding: 12,
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
  },
  skeletonText: {
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
  },
  skeletonButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  // Empty states and errors
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#16783A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonBox: {
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 14,
  },
  clearButton: {
    padding: 5,
  },
  auctionDetails: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  auctionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  auctionDetailItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  auctionDetailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'LexendDecaMedium',
  },
  auctionDetailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'LexendDecaSemiBold',
  },
  winnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  winnerName: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'LexendDecaMedium',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryName: {
    color: '#BBBBBB',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'LexendDecaRegular',
  },
});

export default AuctionShopBottomSheet; 