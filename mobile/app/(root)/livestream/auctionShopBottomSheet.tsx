import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, RefreshControl, ListRenderItem } from 'react-native';
import { AntDesign, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Animatable from 'react-native-animatable';
import { BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';

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

// Memoized SkeletonLoader component
const SkeletonLoader = memo(() => (
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
));
SkeletonLoader.displayName = 'SkeletonLoader';

// Memoized EmptyState component
const EmptyStateComponent = memo(({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string 
}) => (
  <View style={styles.emptyState}>
    {icon}
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateDescription}>{description}</Text>
  </View>
));
EmptyStateComponent.displayName = 'EmptyStateComponent';

// Memoized SearchResult component
const SearchResult = memo(({ query }: { query: string }) => (
  <View style={styles.emptyState}>
    <MaterialIcons name="search-off" size={48} color="#888" />
    <Text style={styles.emptyStateText}>No auctions found for "{query}"</Text>
  </View>
));
SearchResult.displayName = 'SearchResult';

// Memoized EmptyAuctions component
const EmptyAuctions = memo(() => (
  <View style={styles.emptyState}>
    <MaterialIcons name="local-offer" size={48} color="#888" />
    <Text style={styles.emptyStateText}>No auctions available</Text>
  </View>
));
EmptyAuctions.displayName = 'EmptyAuctions';

// Memoized AuctionStatusBadge component
const AuctionStatusBadge = memo(({ isActive, isEnded }: { isActive: boolean, isEnded: boolean }) => {
  if (isActive) {
    return (
      <View style={[styles.statusBadge, styles.activeBidBadge]}>
        <Ionicons name="time-outline" size={12} color="#16783A" />
        <Text style={styles.statusText}>Bidding now</Text>
      </View>
    );
  } else if (isEnded) {
    return (
      <View style={[styles.statusBadge, styles.endedBadge]}>
        <Ionicons name="checkmark-circle-outline" size={12} color="#F44336" />
        <Text style={[styles.statusText, styles.endedText]}>Auction ended</Text>
      </View>
    );
  } else {
    return (
      <View style={styles.statusBadge}>
        <Ionicons name="time-outline" size={12} color="#FF9800" />
        <Text style={[styles.statusText, styles.waitingText]}>Waiting</Text>
      </View>
    );
  }
});
AuctionStatusBadge.displayName = 'AuctionStatusBadge';

// Memoized BidWinnerInfo component
const BidWinnerInfo = memo(({ 
  winner, 
  formatPrice 
}: { 
  winner: StreamProduct['bidWinner'], 
  formatPrice: (price: number) => string 
}) => {
  if (!winner) return null;
  
  return (
    <View style={styles.winnerInfo}>
      <MaterialIcons name="emoji-events" size={14} color="#FFD700" />
      <Text style={styles.winnerName}>
        Winner: {winner.buyer.username || 'Anonymous'} - {formatPrice(winner.bidAmount)}
      </Text>
    </View>
  );
});
BidWinnerInfo.displayName = 'BidWinnerInfo';

// Memoized CategoryInfo component
const CategoryInfo = memo(({ category }: { category?: string }) => {
  if (!category) return null;
  
  return (
    <View style={styles.categoryInfo}>
      <MaterialIcons name="category" size={14} color="#888" />
      <Text style={styles.categoryName}>{category}</Text>
    </View>
  );
});
CategoryInfo.displayName = 'CategoryInfo';

// Memoized AuctionDetailItem component
const AuctionDetailItem = memo(({ 
  label, 
  value, 
  valueStyle 
}: { 
  label: string, 
  value: string, 
  valueStyle?: any 
}) => (
  <View style={styles.auctionDetailItem}>
    <Text style={styles.auctionDetailLabel}>{label}</Text>
    <Text style={[styles.auctionDetailValue, valueStyle]}>{value}</Text>
  </View>
));
AuctionDetailItem.displayName = 'AuctionDetailItem';

// Memoized searchBar component
const SearchBar = memo(({ 
  value, 
  onChangeText, 
  onClear 
}: { 
  value: string, 
  onChangeText: (text: string) => void, 
  onClear: () => void 
}) => (
  <View style={styles.searchContainer}>
    <AntDesign name="search1" size={18} color="#777" style={styles.searchIcon} />
    <BottomSheetTextInput
      style={styles.searchInput}
      placeholder="Search products..."
      placeholderTextColor="#777"
      value={value}
      onChangeText={onChangeText}
      returnKeyType="search"
    />
    {value ? (
      <TouchableOpacity onPress={onClear} style={styles.clearButton}>
        <AntDesign name="close" size={16} color="#777" />
      </TouchableOpacity>
    ) : null}
  </View>
));
SearchBar.displayName = 'SearchBar';

// Memoized TabButton component
const TabButton = memo(({ 
  title, 
  isActive, 
  onPress 
}: { 
  title: string, 
  isActive: boolean, 
  onPress: () => void 
}) => (
  <TouchableOpacity
    style={[styles.tab, isActive && styles.activeTab]}
    onPress={onPress}
  >
    <Text style={[styles.tabText, isActive && styles.activeTabText]}>{title}</Text>
  </TouchableOpacity>
));
TabButton.displayName = 'TabButton';

// Memoized AuctionSkeleton component
const AuctionSkeleton = memo(({ item }: { item: number }) => (
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
));
AuctionSkeleton.displayName = 'AuctionSkeleton';

// Memoized AuctionCard component
const AuctionCard = memo(({ 
  item, 
  formatPrice 
}: { 
  item: StreamProduct, 
  formatPrice: (price: number) => string 
}) => {
  const isEnded = item.bidStatus === 'ended';
  const isActive = item.bidStatus === 'active';
  
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Image 
            source={{ uri: item.product.images[0]?.url }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
          {isActive && (
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
              <AuctionStatusBadge isActive={isActive} isEnded={isEnded} />
            </View>
          </View>
        </View>
      </View>
      
      {/* Additional auction details section */}
      <View style={styles.auctionDetails}>
        <View style={styles.auctionDetailRow}>
          <AuctionDetailItem 
            label="Starting Bid" 
            value={formatPrice(item.minBid || item.product.price)} 
          />
          
          <AuctionDetailItem 
            label="Current Bid" 
            value={item.currentBid ? formatPrice(item.currentBid) : 'No bids yet'} 
          />
          
          <AuctionDetailItem 
            label="Status" 
            value={isActive ? 'Active' : isEnded ? 'Ended' : 'Waiting'} 
            valueStyle={
              isActive ? styles.activeText : 
              isEnded ? styles.endedText : styles.waitingText
            }
          />
        </View>
        
        <BidWinnerInfo winner={item.bidWinner} formatPrice={formatPrice} />
        <CategoryInfo category={item.product.category} />
      </View>
    </View>
  );
});
AuctionCard.displayName = 'AuctionCard';

// Memoized animated AuctionCardItem wrapper 
const AnimatedAuctionCardItem = memo(({ 
  item, 
  index, 
  formatPrice 
}: { 
  item: StreamProduct, 
  index: number, 
  formatPrice: (price: number) => string 
}) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', delay: index * 100, duration: 500 }}
  >
    <AuctionCard item={item} formatPrice={formatPrice} />
  </MotiView>
));
AnimatedAuctionCardItem.displayName = 'AnimatedAuctionCardItem';

// Main component
function AuctionShopBottomSheet({ streamProducts, closeSheet, isLoading = false }: AuctionShopBottomSheetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Auctions');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Memoize the price formatter function
  const formatPrice = useCallback((price: number) => {
    return `₦${price.toLocaleString()}`;
  }, []);

  // Handle search query changes with debounce
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Handle search clear
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // In a real implementation, you might want to reload the data here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Memoize filtered auction products to avoid re-filtering on every render
  const filteredAuctionProducts = useMemo(() => 
    searchQuery 
      ? streamProducts.filter(item => 
          item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.product.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : streamProducts
  , [streamProducts, searchQuery]);

  // Memoize the categories empty state component
  const categoriesEmptyState = useMemo(() => (
    <EmptyStateComponent 
      icon={<MaterialIcons name="category" size={64} color="#444" />}
      title="Categories Coming Soon"
      description="Browse by categories feature is under development."
    />
  ), []);

  // Memoize renderItem function for BottomSheetFlatList
  const renderAuctionCardItem = useCallback(({ item, index }: { item: StreamProduct, index: number }) => (
    <AnimatedAuctionCardItem 
      item={item} 
      index={index} 
      formatPrice={formatPrice} 
    />
  ), [formatPrice]);

  // Memoize skeleton renderItem function
  const renderSkeletonItem = useCallback(({ item }: { item: number }) => (
    <AuctionSkeleton item={item} />
  ), []);

  // Optimize key extractor
  const keyExtractor = useCallback((item: StreamProduct) => item._id, []);
  const skeletonKeyExtractor = useCallback((item: number) => `auction-skeleton-${item}`, []);

  // Memoize RefreshControl component
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor="#16783A"
      colors={["#16783A"]}
      progressBackgroundColor="#1E1E1E"
    />
  ), [refreshing, handleRefresh]);

  // Memoize BottomSheetFlatList content container style
  const contentContainerStyle = useMemo(() => ({ padding: 16 }), []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={handleClearSearch}
      />

      {/*<View style={styles.tabContainer}>
        <TabButton 
          title="Auctions" 
          isActive={activeTab === 'Auctions'} 
          onPress={() => handleTabChange('Auctions')} 
        />
        <TabButton 
          title="Categories" 
          isActive={activeTab === 'Categories'} 
          onPress={() => handleTabChange('Categories')} 
        />
      </View>*/}

      <View style={styles.tabContent}>
        {activeTab === 'Auctions' && (
          <>
            {isLoading ? (
              <BottomSheetFlatList
                data={[1, 2, 3, 4, 5]}
                renderItem={renderSkeletonItem}
                keyExtractor={skeletonKeyExtractor}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={contentContainerStyle}
                removeClippedSubviews={true}
                maxToRenderPerBatch={5}
                initialNumToRender={3}
                windowSize={5}
              />
            ) : filteredAuctionProducts.length === 0 ? (
              searchQuery ? <SearchResult query={searchQuery} /> : <EmptyAuctions />
            ) : (
              <BottomSheetFlatList
                data={filteredAuctionProducts}
                renderItem={renderAuctionCardItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={contentContainerStyle}
                refreshControl={refreshControl}
                removeClippedSubviews={true}
                maxToRenderPerBatch={5}
                initialNumToRender={3}
                windowSize={5}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
}

// Apply memo to the function component after it's defined
const MemoizedAuctionShopBottomSheet = memo(AuctionShopBottomSheet);
MemoizedAuctionShopBottomSheet.displayName = 'AuctionShopBottomSheet';

// Export the memoized component
export default MemoizedAuctionShopBottomSheet;

const styles = StyleSheet.create({
  container: {
    height: "100%",
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