import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image, Dimensions, Pressable, RefreshControl, TextInput, InteractionManager } from 'react-native';
import { AntDesign, Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MotiView } from 'moti';
import { Tabs } from 'expo-router';
import * as Animatable from 'react-native-animatable';
const { width } = Dimensions.get('window');

// Types for the auction products
interface AuctionProduct {
  _id: string;
  name: string;
  description: string;
  images: {
    url: string;
    _id: string;
    id: string;
  }[];
  auction: {
    currentHighestBid: {
      amount: number | null;
      buyer: string | null;
    };
    winner: {
      buyer: string | null;
      bidAmount: number | null;
      winningDate: string | null;
    };
    minBid: number;
    maxBid: number;
    endOnMaxBid: boolean;
    startDate: string;
    endDate: string;
    status: string;
    daysLeft: number;
    bids: any[];
  };
  seller: {
    _id: string;
    storeName: string;
    storeAvatar?: {
      url: string;
    };
  };
  id: string;
}

// Types for the live stream products (Buy Now)
interface StreamProduct {
  _id: string;
  productDetails: {
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
  };
  bidInfo?: {
    minBid: number;
    maxBid: number;
    currentBid: number;
    currentBidder: string;
    bidStatus: string;
  };
  winner?: {
    buyer: string;
    bidAmount: number;
    winningTime: string;
  } | null;
  orderInfo?: {
    orderCreated: boolean;
    orderId: string | null;
  };
}

interface ShopBottomSheetProps {
  sellerId: string;
  streamId: string;
  closeSheet: () => void;
}

// Adding animation to the components when they appear
// const AnimatedCard = Animatable.createAnimatableComponent(TouchableOpacity);

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
            <View style={[styles.skeletonButton, { width: 80, height: 32 }]} />
          </View>
        </View>
      </MotiView>
    ))}
  </View>
));

// Helper function to extract plain text from HTML markup
const extractPlainText = (htmlString?: string): string => {
  if (!htmlString) return "";

  // First, try to get the first heading or paragraph content
  const firstTagMatch = htmlString.match(/<(h[1-6]|p)[^>]*>([^<]+)<\/\1>/);
  if (firstTagMatch && firstTagMatch[2]) {
    return firstTagMatch[2].trim();
  }
  
  // Second approach: extract text between any tags
  const textMatch = htmlString.match(/<[^>]*>([^<]+)<\/[^>]*>/);
  if (textMatch && textMatch[1]) {
    return textMatch[1].trim();
  }
  
  // Last resort: strip all HTML tags
  return htmlString.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

// Define memoized card components outside the main component
const AuctionCard = memo(({ item, closeSheet, router, formatPrice }: { 
  item: AuctionProduct, 
  closeSheet: () => void, 
  router: any,
  formatPrice: (price: number) => string 
}) => {
  // Pre-calculate derived values outside of render
  const hasActiveBids = item.auction.bids && item.auction.bids.length > 0;
  const isAuctionEnded = item.auction.status === 'ended';
  const currentPrice = item.auction.currentHighestBid?.amount || item.auction.minBid;
  const hasDiscount = item.auction.maxBid > 0 && item.auction.maxBid > item.auction.minBid;
  const discountPercentage = hasDiscount 
    ? Math.round(((item.auction.maxBid - item.auction.minBid) / item.auction.maxBid) * 100)
    : 0;
  const isEndingSoon = item.auction.daysLeft <= 0;
  
  // Handle navigation with useCallback to avoid recreations
  const handlePress = useCallback(() => {
    router.push(`/product/${item._id}`);
    closeSheet();
  }, [item._id, router, closeSheet]);
  
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Image 
            source={{ uri: item.images[0]?.url }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
          {hasActiveBids && (
            <View style={styles.bidBadge}>
              <MaterialCommunityIcons name="gavel" size={13} color="white" />
              <Text style={styles.bidBadgeText}>{item.auction.bids.length}</Text>
            </View>
          )}
          {isAuctionEnded && (
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
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{formatPrice(currentPrice)}</Text>
              {hasDiscount && (
                <View style={styles.discount}>
                  <Text style={styles.discountText}>
                    {discountPercentage}% off
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.metaInfo}>
              {!isEndingSoon ? (
                <View style={styles.statusBadge}>
                  <Ionicons name="time-outline" size={12} color="#16783A" />
                  <Text style={styles.statusText}>{item.auction.daysLeft}d left</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.urgentBadge]}>
                  <Ionicons name="time-outline" size={12} color="#FF9800" />
                  <Text style={[styles.statusText, styles.urgentText]}>Ends today</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handlePress}
            >
              <Text style={styles.actionButtonText}>Bid Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Additional auction details section */}
      <View style={styles.auctionDetails}>
        <View style={styles.auctionDetailRow}>
          <View style={styles.auctionDetailItem}>
            <Text style={styles.auctionDetailLabel}>Starting Bid</Text>
            <Text style={styles.auctionDetailValue}>{formatPrice(item.auction.minBid)}</Text>
          </View>
          
          <View style={styles.auctionDetailItem}>
            <Text style={styles.auctionDetailLabel}>Current Bid</Text>
            <Text style={styles.auctionDetailValue}>
              {item.auction.currentHighestBid?.amount 
                ? formatPrice(item.auction.currentHighestBid.amount) 
                : 'No bids yet'}
            </Text>
          </View>
          
          <View style={styles.auctionDetailItem}>
            <Text style={styles.auctionDetailLabel}>Bids</Text>
            <Text style={styles.auctionDetailValue}>{item.auction.bids?.length || 0}</Text>
          </View>
        </View>
        
        {item.seller && (
          <View style={styles.sellerInfo}>
            <MaterialIcons name="store" size={14} color="#888" />
            <Text style={styles.sellerName}>{item.seller.storeName}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const BuyNowCard = memo(({ item, closeSheet, router, formatPrice }: { 
  item: StreamProduct, 
  closeSheet: () => void, 
  router: any,
  formatPrice: (price: number) => string 
}) => {
  // Pre-calculate derived values outside of render
  const isOutOfStock = item.productDetails.quantity <= 0;
  const isLowStock = !isOutOfStock && item.productDetails.quantity <= 3;
  const hasDiscount = item.productDetails.discountedPrice && 
                     item.productDetails.discountedPrice > item.productDetails.price;
  const discountPercentage = hasDiscount
    ? Math.round(((item.productDetails.discountedPrice! - item.productDetails.price) / 
                 item.productDetails.discountedPrice!) * 100)
    : 0;
    
  // Get simplified description without HTML markup - memoized
  const simplifiedDescription = useMemo(() => 
    extractPlainText(item.productDetails.description),
    [item.productDetails.description]
  );
  
  // Handle navigation with useCallback to avoid recreations
  const handlePress = useCallback(() => {
    router.push(`/product/${item.productDetails.productId}`);
    closeSheet();
  }, [item.productDetails.productId, router, closeSheet]);

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={isOutOfStock}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Image 
            source={{ uri: item.productDetails.images[0]?.url }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
          {isOutOfStock && (
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
              style={styles.cardOverlay}
            >
              <Text style={styles.overlayLabel}>SOLD OUT</Text>
            </LinearGradient>
          )}
        </View>
        
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.productDetails.name}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{formatPrice(item.productDetails.price)}</Text>
              {hasDiscount && (
                <View style={styles.discount}>
                  <Text style={styles.discountText}>
                    {discountPercentage}% off
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.metaInfo}>
              {isOutOfStock ? (
                <View style={[styles.statusBadge, styles.soldOutBadge]}>
                  <Ionicons name="alert-circle-outline" size={12} color="#F44336" />
                  <Text style={[styles.statusText, styles.soldOutText]}>Sold out</Text>
                </View>
              ) : isLowStock ? (
                <View style={[styles.statusBadge, styles.lowStockBadge]}>
                  <Ionicons name="alert-circle-outline" size={12} color="#FF9800" />
                  <Text style={[styles.statusText, styles.lowStockText]}>Only {item.productDetails.quantity} left</Text>
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle-outline" size={12} color="#16783A" />
                  <Text style={styles.statusText}>In stock</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.actionButton, isOutOfStock ? styles.disabledButton : {}]}
              onPress={handlePress}
              disabled={isOutOfStock}
            >
              <Text style={styles.actionButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Additional product details section */}
      <View style={styles.productDetails}>
        {simplifiedDescription ? (
          <View style={styles.productDescription}>
            <Text 
              style={styles.descriptionText} 
              numberOfLines={2} 
              ellipsizeMode="tail"
            >
              {simplifiedDescription}
            </Text>
          </View>
        ) : null}
        
        <View style={styles.productDetailRow}>
          <View style={styles.productDetailItem}>
            <Text style={styles.productDetailLabel}>Stock</Text>
            <Text style={[
              styles.productDetailValue, 
              isOutOfStock ? styles.soldOutText : 
              isLowStock ? styles.lowStockText : 
              styles.inStockText
            ]}>
              {isOutOfStock ? 'Out of stock' : `${item.productDetails.quantity.toLocaleString()} available`}
            </Text>
          </View>
          
          {item.orderInfo?.orderCreated && (
            <View style={styles.orderCreatedBadge}>
              <MaterialIcons name="local-shipping" size={12} color="#16783A" />
              <Text style={styles.orderCreatedText}>Order placed</Text>
            </View>
          )}
        </View>
        
        {item.productDetails.seller && (
          <View style={styles.sellerInfo}>
            <MaterialIcons name="store" size={14} color="#888" />
            <Text style={styles.sellerName}>
              {item.productDetails.seller.storeName || item.productDetails.seller.businessName}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// Memoize the empty states
const EmptyAuctions = memo(() => (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons name="gavel" size={64} color="#444" />
    <Text style={styles.emptyStateTitle}>No Auctions Available</Text>
    <Text style={styles.emptyStateDescription}>
      The seller doesn't have any active offline auctions at the moment.
    </Text>
  </View>
));

const EmptyBuyNow = memo(() => (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons name="shopping-outline" size={64} color="#444" />
    <Text style={styles.emptyStateTitle}>No Products Available</Text>
    <Text style={styles.emptyStateDescription}>
      There are no products available to purchase directly.
    </Text>
  </View>
));

const CategoriesEmptyState = memo(() => (
    <View style={styles.emptyState}>
      <MaterialIcons name="category" size={64} color="#444" />
      <Text style={styles.emptyStateTitle}>Categories Coming Soon</Text>
      <Text style={styles.emptyStateDescription}>
        Browse by categories feature is under development.
      </Text>
    </View>
));

// Memoized skeleton loaders with optimized performance
const AuctionSkeleton = memo(({ item }: { item: number }) => {
  // Only use pulse animation for visible items (first few)
  const isPriority = item < 3;
  
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Animatable.View 
            animation={isPriority ? "pulse" : undefined}
            easing="ease-in-out" 
            iterationCount={isPriority ? "infinite" : undefined}
            duration={2000}
            style={[styles.cardImage, styles.skeletonBox]} 
          />
        </View>
        <View style={styles.cardContent}>
          <View>
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '80%', height: 18, borderRadius: 4 }]} 
            />
            <View style={{ height: 8 }} />
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '50%', height: 16, borderRadius: 4 }]} 
            />
          </View>
          
          <View style={styles.cardFooter}>
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '40%', height: 16, borderRadius: 8 }]} 
            />
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: 70, height: 32, borderRadius: 8 }]} 
            />
          </View>
        </View>
      </View>
      
      {/* Skeleton for additional auction details */}
      <View style={styles.auctionDetails}>
        <View style={styles.auctionDetailRow}>
          <View style={styles.auctionDetailItem}>
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '70%', height: 12, borderRadius: 4, marginBottom: 4 }]} 
            />
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '50%', height: 14, borderRadius: 4 }]} 
            />
          </View>
          
          <View style={styles.auctionDetailItem}>
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '70%', height: 12, borderRadius: 4, marginBottom: 4 }]} 
            />
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '50%', height: 14, borderRadius: 4 }]} 
            />
          </View>
          
          <View style={styles.auctionDetailItem}>
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '70%', height: 12, borderRadius: 4, marginBottom: 4 }]} 
            />
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '50%', height: 14, borderRadius: 4 }]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
});

const BuyNowSkeleton = memo(({ item }: { item: number }) => {
  // Only use pulse animation for visible items (first few)
  const isPriority = item < 3;
  
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Animatable.View 
            animation={isPriority ? "pulse" : undefined}
            easing="ease-in-out" 
            iterationCount={isPriority ? "infinite" : undefined}
            duration={2000}
            style={[styles.cardImage, styles.skeletonBox]} 
          />
        </View>
        <View style={styles.cardContent}>
          <View>
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '80%', height: 18, borderRadius: 4 }]} 
            />
            <View style={{ height: 8 }} />
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '50%', height: 16, borderRadius: 4 }]} 
            />
          </View>
          
          <View style={styles.cardFooter}>
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: '40%', height: 16, borderRadius: 8 }]} 
            />
            <Animatable.View 
              animation={isPriority ? "pulse" : undefined}
              easing="ease-in-out" 
              iterationCount={isPriority ? "infinite" : undefined}
              duration={1500}
              style={[styles.skeletonBox, { width: 70, height: 32, borderRadius: 8 }]} 
            />
          </View>
        </View>
      </View>
      
      {/* Skeleton for additional product details */}
      <View style={styles.productDetails}>
        <Animatable.View 
          animation={isPriority ? "pulse" : undefined}
          easing="ease-in-out" 
          iterationCount={isPriority ? "infinite" : undefined}
          duration={1500}
          style={[styles.skeletonBox, { width: '100%', height: 32, borderRadius: 4, marginBottom: 8 }]} 
        />
      </View>
    </View>
  );
});

const ShopBottomSheet = memo(({ sellerId, streamId, closeSheet }: ShopBottomSheetProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Auction');
  const [auctionProducts, setAuctionProducts] = useState<AuctionProduct[]>([]);
  const [streamProducts, setStreamProducts] = useState<StreamProduct[]>([]);
  const [streamProductsPage, setStreamProductsPage] = useState(1);
  const [streamProductsLoading, setStreamProductsLoading] = useState(true);
  const [noMoreStreamProducts, setNoMoreStreamProducts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [auctionProductsPage, setAuctionProductsPage] = useState(1);
  const [auctionProductsLoading, setAuctionProductsLoading] = useState(true);
  const [noMoreAuctionProducts, setNoMoreAuctionProducts] = useState(false);
  
  // Add refs for FlatLists to enable scrollToOffset and other imperative methods
  const auctionListRef = useRef<FlatList<AuctionProduct>>(null);
  const buyNowListRef = useRef<FlatList<StreamProduct>>(null);
  
  // Track if component is mounted to avoid state updates after unmount
  const isMounted = useRef(true);
  
  // Optimize the skeleton loaders rendering - MOVED INSIDE COMPONENT
  const renderAuctionLoading = useCallback(() => {
    const skeletonData = [1, 2, 3, 4, 5];
    
    return (
      <FlatList
        data={skeletonData}
        renderItem={({ item, index }) => <AuctionSkeleton item={index} />}
        keyExtractor={(item) => `auction-skeleton-${item}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        getItemLayout={(data, index) => ({
          length: 232,
          offset: 232 * index,
          index,
        })}
      />
    );
  }, []);
  
  const renderBuyNowLoading = useCallback(() => {
    const skeletonData = [1, 2, 3, 4, 5];
    
    return (
      <FlatList
        data={skeletonData}
        renderItem={({ item, index }) => <BuyNowSkeleton item={index} />}
        keyExtractor={(item) => `buynow-skeleton-${item}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        getItemLayout={(data, index) => ({
          length: 232,
          offset: 232 * index,
          index,
        })}
      />
    );
  }, []);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Memoize format price function to avoid recreating it on every render
  const formatPrice = useCallback((price: number) => {
    return `₦${price.toLocaleString()}`;
  }, []);

  // Fetch stream products with pagination - OPTIMIZED
  const fetchStreamProducts = useCallback(async (page = 1, refresh = false) => {
    if (!streamId || !isMounted.current) return;
    
    try {
      setStreamProductsLoading(true);
      if (refresh) {
        setError(null);
      }
      
      const token = await AsyncStorage.getItem('token');
      const userToken = JSON.parse(token || '""');
      
      if (!userToken) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}api/streams/${streamId}/products?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`
          }
        }
      );

      // Use InteractionManager to ensure UI thread is not blocked
      InteractionManager.runAfterInteractions(() => {
        if (!isMounted.current) return;
        
        if (response.status === 200) {
          const newProducts = response.data.products || [];
          
          if (newProducts.length === 0) {
            setNoMoreStreamProducts(true);
          } else {
            if (refresh || page === 1) {
              setStreamProducts(newProducts);
            } else {
              setStreamProducts(prev => [...prev, ...newProducts]);
            }
            setStreamProductsPage(page + 1);
          }
        }
        
        setStreamProductsLoading(false);
        if (refresh) {
          setIsLoading(false);
        }
      });
    } catch (error: any) {
      console.error('Error fetching stream products:', error);
      if (isMounted.current) {
        setError(error.message || 'Failed to load products');
        setStreamProductsLoading(false);
        if (refresh) {
          setIsLoading(false);
        }
      }
    }
  }, [streamId]);

  // Function to load more stream products - OPTIMIZED
  const fetchMoreStreamProducts = useCallback(() => {
    if (!streamProductsLoading && !noMoreStreamProducts && activeTab === 'Buy Now') {
      // Use requestAnimationFrame to ensure UI updates before network request
      requestAnimationFrame(() => {
        fetchStreamProducts(streamProductsPage);
      });
    }
  }, [streamProductsLoading, noMoreStreamProducts, activeTab, streamProductsPage, fetchStreamProducts]);

  // Optimized fetch function for auctions - OPTIMIZED
  const fetchOfflineAuctions = useCallback(async (page = 1, refresh = false) => {
    if (!isMounted.current) return;
    
    try {
      if (refresh) {
        setIsLoading(true);
        setError(null);
        setAuctionProductsPage(1);
        setNoMoreAuctionProducts(false);
      } else {
        setAuctionProductsLoading(true);
      }
      
      const token = await AsyncStorage.getItem('token');
      const userToken = JSON.parse(token || '""');
      
      if (!userToken) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}api/products/seller/${sellerId}/auctions?status=ongoing&sort=startDate&page=${page}&limit=10`
      );

      // Use InteractionManager to ensure UI thread is not blocked
      InteractionManager.runAfterInteractions(() => {
        if (!isMounted.current) return;
        
        if (response.status === 200) {
          const newProducts = response.data.products || [];
          if (newProducts.length === 0) {
            setNoMoreAuctionProducts(true);
          } else {
            if (refresh || page === 1) {
              setAuctionProducts(newProducts);
            } else {
              setAuctionProducts(prev => [...prev, ...newProducts]);
            }
            setAuctionProductsPage(page + 1);
          }
        }
        
        setAuctionProductsLoading(false);
        if (refresh) {
          setIsLoading(false);
        }
      });
    } catch (error: any) {
      console.error('Error fetching offline auctions:', error);
      if (isMounted.current) {
        setError(error.message || 'Failed to load auctions');
        setAuctionProductsLoading(false);
        if (refresh) {
          setIsLoading(false);
        }
      }
    }
  }, [sellerId]);

  // Function to load more auction products - OPTIMIZED
  const fetchMoreAuctionProducts = useCallback(() => {
    if (!auctionProductsLoading && !noMoreAuctionProducts && activeTab === 'Auction') {
      // Use requestAnimationFrame to ensure UI updates before network request
      requestAnimationFrame(() => {
        fetchOfflineAuctions(auctionProductsPage, false);
      });
    }
  }, [auctionProductsLoading, noMoreAuctionProducts, activeTab, auctionProductsPage, fetchOfflineAuctions]);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'Auction') {
      fetchOfflineAuctions(1, true);
    } else if (activeTab === 'Buy Now') {
      fetchStreamProducts(1, true);
    }
  }, [activeTab, sellerId, streamId, fetchOfflineAuctions, fetchStreamProducts]);

  // Reset pagination and refetch when streamId changes
  useEffect(() => {
    if (streamId && activeTab === 'Buy Now') {
      setStreamProductsPage(1);
      setNoMoreStreamProducts(false);
      fetchStreamProducts(1, true);
    }
  }, [streamId, fetchStreamProducts]);

  // Memoize tab change handler
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Memoize refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'Auction') {
      await fetchOfflineAuctions(1, true);
    } else if (activeTab === 'Buy Now') {
      setStreamProductsPage(1);
      setNoMoreStreamProducts(false);
      await fetchStreamProducts(1, true);
    }
    setRefreshing(false);
  }, [activeTab, fetchOfflineAuctions, fetchStreamProducts]);

  // Memoize search handler
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Memoize clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Memoize the filtered data
  const filteredAuctionProducts = useMemo(() => 
    searchQuery 
    ? auctionProducts.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : auctionProducts
  , [auctionProducts, searchQuery]);

  const filteredBuyNowProducts = useMemo(() => 
    searchQuery 
    ? streamProducts.filter(item => 
        item.productDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productDetails.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : streamProducts
  , [streamProducts, searchQuery]);

  // Memoize the error view for auction products
  const AuctionErrorView = useMemo(() => (
    <View style={styles.emptyState}>
      <MaterialIcons name="error-outline" size={48} color="#888" />
      <Text style={styles.emptyStateText}>Failed to load auctions</Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={() => {
          fetchOfflineAuctions(1, true);
        }}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ), [fetchOfflineAuctions]);

  // Memoize the error view for stream products
  const StreamProductsErrorView = useMemo(() => (
    <View style={styles.emptyState}>
      <MaterialIcons name="error-outline" size={48} color="#888" />
      <Text style={styles.emptyStateText}>Failed to load products</Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={() => {
          fetchStreamProducts(1, true);
        }}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ), [fetchStreamProducts]);

  // Memoize the empty search view
  const EmptySearchView = useMemo(() => (
    <View style={styles.emptyState}>
      <MaterialIcons name="search-off" size={48} color="#888" />
      <Text style={styles.emptyStateText}>No auctions found for "{searchQuery}"</Text>
    </View>
  ), [searchQuery]);

  // Memoize the empty auctions view
  const EmptyAuctionsView = useMemo(() => (
    <View style={styles.emptyState}>
      <MaterialIcons name="local-offer" size={48} color="#888" />
      <Text style={styles.emptyStateText}>No auctions available</Text>
    </View>
  ), []);

  // Optimized renderItem functions for FlatList
  const renderAuctionItem = useCallback(({ item, index }: { item: AuctionProduct, index: number }) => {
    // Only animate the first 5 items to reduce animation overhead
    const shouldAnimate = index < 5;
    
    if (shouldAnimate) {
      return (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: index * 50, duration: 300 }}
          key={item._id}
        >
          <AuctionCard 
            item={item}
            closeSheet={closeSheet}
            router={router}
            formatPrice={formatPrice}
          />
        </MotiView>
      );
    }
    
    // Don't animate items outside the initial viewport for better performance
    return (
      <AuctionCard 
        item={item}
        closeSheet={closeSheet}
        router={router}
        formatPrice={formatPrice}
      />
    );
  }, [closeSheet, router, formatPrice]);

  const renderBuyNowItem = useCallback(({ item, index }: { item: StreamProduct, index: number }) => {
    // Only animate the first 5 items to reduce animation overhead
    const shouldAnimate = index < 5;
    
    if (shouldAnimate) {
      return (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', delay: index * 50, duration: 300 }}
          key={item.productDetails.productId}
        >
          <BuyNowCard 
            item={item}
            closeSheet={closeSheet}
            router={router}
            formatPrice={formatPrice}
          />
        </MotiView>
      );
    }
    
    // Don't animate items outside the initial viewport for better performance
    return (
      <BuyNowCard 
        item={item}
        closeSheet={closeSheet}
        router={router}
        formatPrice={formatPrice}
      />
    );
  }, [closeSheet, router, formatPrice]);

  // Create stable memoized getItemLayout functions with proper types
  const getAuctionItemLayout = useCallback((data: ArrayLike<any> | null | undefined, index: number) => ({
    length: 232, // Fixed height for auction items
    offset: 232 * index,
    index,
  }), []);
  
  const getBuyNowItemLayout = useCallback((data: ArrayLike<any> | null | undefined, index: number) => ({
    length: 232, // Fixed height for buy now items
    offset: 232 * index,
    index,
  }), []);

  // Optimized FlatList props for better performance
  const optimizedFlatListProps = useMemo(() => ({
    removeClippedSubviews: true,
    initialNumToRender: 3, // Reduce initial render batch 
    maxToRenderPerBatch: 3, // Render smaller batches
    windowSize: 7, // Smaller window size to improve memory usage
    updateCellsBatchingPeriod: 50, // More frequent updates
    showsVerticalScrollIndicator: false,
    maintainVisibleContentPosition: { minIndexForVisible: 0 }, // Keep track of visible items
    onEndReachedThreshold: 0.5, // Load more data earlier
  }), []);

  // More efficient keyExtractor functions to prevent unnecessary re-renders
  const auctionKeyExtractor = useCallback((item: AuctionProduct) => 
    `auction-${item._id}-${item.auction.status}-${item.auction.currentHighestBid?.amount || 0}`,
  []);
  
  const buyNowKeyExtractor = useCallback((item: StreamProduct, index: number) => 
    item.productDetails.productId + index.toString(),
  []);

  const commonRefreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#16783A"
      colors={["#16783A"]}
      progressBackgroundColor="#1E1E1E"
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Shop</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <AntDesign name="search1" size={18} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <AntDesign name="close" size={16} color="#777" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Auction' && styles.activeTab]}
          onPress={() => handleTabChange('Auction')}
        >
          <Text style={[styles.tabText, activeTab === 'Auction' && styles.activeTabText]}>Auction</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Buy Now' && styles.activeTab]}
          onPress={() => handleTabChange('Buy Now')}
        >
          <Text style={[styles.tabText, activeTab === 'Buy Now' && styles.activeTabText]}>Buy Now</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={[styles.tab, activeTab === 'Categories' && styles.activeTab]}
          onPress={() => handleTabChange('Categories')}
        >
          <Text style={[styles.tabText, activeTab === 'Categories' && styles.activeTabText]}>Categories</Text>
        </TouchableOpacity> */}
      </View>

      <View style={styles.tabContent}>
        {activeTab === 'Auction' && (
          <>
            {isLoading ? (
              renderAuctionLoading()
            ) : error ? (
              AuctionErrorView
            ) : filteredAuctionProducts.length === 0 ? (
              searchQuery ? EmptySearchView : EmptyAuctionsView
            ) : (
              <FlatList<AuctionProduct>
                ref={auctionListRef}
                data={filteredAuctionProducts}
                renderItem={renderAuctionItem}
                keyExtractor={auctionKeyExtractor}
                refreshControl={commonRefreshControl}
                onEndReached={fetchMoreAuctionProducts}
                getItemLayout={getAuctionItemLayout}
                // Use optimized loading indicator to reduce re-renders
                ListFooterComponent={
                  auctionProductsLoading && !refreshing ? (
                    <View style={styles.loadingIndicator}>
                      <ActivityIndicator size="small" color="#16783A" />
                      <Text style={styles.loadingText}>Loading more auctions...</Text>
                    </View>
                  ) : null
                }
                {...optimizedFlatListProps}
                contentContainerStyle={{ padding: 16 }}
                // Add performance improvements for large lists
                disableVirtualization={false}
                legacyImplementation={false}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={16}
                directionalLockEnabled={true}
              />
            )}
          </>
        )}

        {activeTab === 'Buy Now' && (
          <>
            {isLoading ? (
              renderBuyNowLoading()
            ) : error ? (
              StreamProductsErrorView
            ) : (filteredBuyNowProducts?.length === 0 || !filteredBuyNowProducts) ? (
              <View style={styles.emptyState}>
                {searchQuery ? (
                  <>
                    <MaterialIcons name="search-off" size={48} color="#888" />
                    <Text style={styles.emptyStateText}>No products found for "{searchQuery}"</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="shopping-bag" size={48} color="#888" />
                    <Text style={styles.emptyStateText}>No products available</Text>
                  </>
                )}
              </View>
            ) : (
              <FlatList<StreamProduct>
                ref={buyNowListRef}
                data={filteredBuyNowProducts}
                renderItem={renderBuyNowItem}
                keyExtractor={buyNowKeyExtractor}
                refreshControl={commonRefreshControl}
                onEndReached={fetchMoreStreamProducts}
                getItemLayout={getBuyNowItemLayout}
                // Use optimized loading indicator to reduce re-renders
                ListFooterComponent={
                  streamProductsLoading && !refreshing ? (
                    <View style={styles.loadingIndicator}>
                      <ActivityIndicator size="small" color="#16783A" />
                      <Text style={styles.loadingText}>Loading more products...</Text>
                    </View>
                  ) : null
                }
                {...optimizedFlatListProps}
                contentContainerStyle={{ padding: 16 }}
                // Add performance improvements for large lists
                disableVirtualization={false}
                legacyImplementation={false}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={16}
                directionalLockEnabled={true}
              />
            )}
          </>
        )}

        {/* {activeTab === 'Categories' && <CategoriesEmptyState />} */}
      </View>
    </View>
  );
});

// Define styles outside the component to avoid recreation on each render
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
  urgentBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  urgentText: {
    color: '#FF9800',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  soldOutText: {
    color: '#F44336',
  },
  lowStockBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  lowStockText: {
    color: '#FF9800',
  },
  bidBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'LexendDecaBold',
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
    fontSize: 14,
    fontFamily: 'LexendDecaBold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
  },
  actionButton: {
    backgroundColor: '#16783A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'LexendDecaBold',
  },
  disabledButton: {
    backgroundColor: '#444',
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
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sellerName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'LexendDecaMedium',
  },
  productDetails: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  productDescription: {
    marginBottom: 8,
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'LexendDecaRegular',
  },
  productDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productDetailItem: {
    flex: 1,
  },
  productDetailLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'LexendDecaMedium',
  },
  productDetailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'LexendDecaSemiBold',
  },
  orderCreatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 120, 58, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  orderCreatedText: {
    color: '#16783A',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'LexendDecaMedium',
  },
  inStockText: {
    color: '#16783A',
  },
  loadingIndicator: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
  },
  loadingText: {
    color: '#16783A',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    fontFamily: 'LexendDecaMedium',
  },
});

export default ShopBottomSheet; 