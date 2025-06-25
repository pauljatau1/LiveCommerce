import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import React, { useRef, useEffect, useCallback, useMemo, memo, useReducer } from 'react';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useLivestream } from '@/contexts/livestreamContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LivestreamContextType } from "@/types/streams/livestreamStudio";
import GlassImage from '@/app/(root)/livestream/components/GlassImage';
import { BottomSheetScrollView, BottomSheetFlatList, BottomSheetFlatListMethods } from '@gorhom/bottom-sheet';

// Define interface for order item
interface OrderItem {
  product: string;
  productName: string;
  seller: string;
  quantity: number;
  price: number;
  status: string;
  productImages?: Array<{url: string, _id: string}>;
  specifications?: {
    color?: string;
    size?: string;
    material?: string;
  };
  _id?: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    _id: string;
  }>;
}

// Define interface for order buyer
interface OrderBuyer {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImage?: {
    url: string;
    public_id?: string;
  };
}

// Define interface for order
interface Order {
  orderId: string;
  buyer: OrderBuyer | string; // Can be an object with user details or just a string ID
  orderDetails: {
    _id: string;
    order_id: string;
    itemsCount: number;
    totalAmount: number;
    shippingFee: number;
    orderTotal: number;
    seller: string;
    fezOrderNo?: string;
    items: OrderItem[]; // Items are in orderDetails, not directly on order
  };
  product?: string;
  amount?: number;
  _id: string;
  createdAt?: string;
  items?: OrderItem[]; // Keep for backward compatibility
  statusHistory?: any[];
}

interface StreamOrdersProps {
  streamId: string;
  closeSheet: () => void;
}

// Pre-define constants to avoid recreating them on each render
const SKELETON_ARRAY = Array(5).fill(null);
const DEFAULT_AVATAR_URL = 'placeholder';

// Pre-define colors for better performance
const COLORS = {
  primary: '#16783A',
  danger: '#FF5733',
  warning: '#FFC107',
  white: '#FFFFFF',
  dark: '#121212',
  darkGray: '#2A2A2A',
  gray: '#AAA',
  border: 'rgba(255,255,255,0.1)',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.7)',
  textQuaternary: 'rgba(255,255,255,0.5)',
  backgroundLight: 'rgba(255,255,255,0.1)',
  errorColor: 'rgba(255,120,120,0.5)',
};

// Pre-define avatar colors for consistent references
const AVATAR_COLORS = [
  '#FF5733', '#33A1FF', '#33FF57', '#BD33FF',
  '#FFD133', '#33FFBD', '#FF33BD', '#7D33FF',
  '#FF7D33', '#33FF7D', '#FF3333', '#33A8FF'
];

// Pre-calculate dimensions once
const { width } = Dimensions.get('window');

// State type definitions for reducer
type StreamOrdersState = {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
};

type StreamOrdersAction =
  | { type: 'SET_LOADING', payload: boolean }
  | { type: 'SET_ERROR', payload: string | null }
  | { type: 'SET_ORDERS', payload: Order[] };

// Reducer for more efficient state management
const ordersReducer = (state: StreamOrdersState, action: StreamOrdersAction): StreamOrdersState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    default:
      return state;
  }
};

// Memoized utility functions
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

// Fast and optimized function to generate a consistent avatar color
const getAvatarColor = (id: string) => {
  if (!id) return AVATAR_COLORS[0]; // Default color if id is missing

  // Use a simple hash function to get a consistent color (optimized to compute less)
  let sum = 0;
  const len = Math.min(id.length, 8); // Only use first 8 chars for better performance
  for (let i = 0; i < len; i++) {
    sum += id.charCodeAt(i);
  }

  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

// Memoized price formatter
const formatPrice = (price: number) => {
  return `₦${price.toLocaleString()}`;
};

// Memoized skeleton item component
const SkeletonItem = memo(({ 
  index = 0,
  breatheAnim
}: { 
  index?: number,
  breatheAnim: Animated.Value
}) => {
  // Memoize animation calculations
  const delayFactor = useMemo(() => index * 0.1, [index]);
  
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
    <Animated.View style={[styles.orderCard, pulseStyles]}>
      <Animated.View style={[styles.productImageContainer, pulseStyles]}>
        <Animated.View 
          style={[
            styles.productImage, 
            { backgroundColor: COLORS.backgroundLight }
          ]}
        />
      </Animated.View>

      <View style={styles.orderContent}>
        <Animated.View style={[styles.skeletonTitle, pulseStyles]} />
        <Animated.View style={[styles.skeletonPrice, pulseStyles]} />
        <Animated.View style={[styles.skeletonQuantity, pulseStyles]} />
        <Animated.View style={[styles.skeletonBuyer, pulseStyles]} />
      </View>

      <Animated.View style={[styles.skeletonBadge, pulseStyles]} />
    </Animated.View>
  );
});

// Memoized header component
const Header = memo(({ count }: { count: number }) => (
  <View style={styles.header}>
    <View style={styles.headerContent}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Orders Queue</Text>
        <View style={styles.orderCount}>
          <MaterialCommunityIcons name="package-variant-closed" size={16} color={COLORS.white} />
          <Text style={styles.orderCountText}>{count}</Text>
        </View>
      </View>
    </View>
  </View>
));

// Memoized empty state component
const EmptyState = memo(() => (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons
      name="package-variant"
      size={65}
      color={COLORS.textQuaternary}
    />
    <Text style={styles.emptyStateText}>No orders yet</Text>
    <Text style={styles.emptyStateSubText}>
      Orders will appear here when viewers make purchases
    </Text>
  </View>
));

// Memoized error state component
const ErrorState = memo(({ error, onRetry }: { error: string | null, onRetry: () => void }) => (
  <View style={styles.emptyState}>
    <MaterialIcons name="error-outline" size={60} color={COLORS.errorColor} />
    <Text style={styles.emptyStateText}>Something went wrong</Text>
    <Text style={styles.emptyStateSubText}>{error}</Text>
    <TouchableOpacity 
      style={styles.retryButton}
      onPress={onRetry}
      activeOpacity={0.8}
    >
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
  </View>
));

// Memoized status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
  // Memoize status calculations
  const { statusLabel, statusColor } = useMemo(() => {
    let label = 'Sold';
    let color = COLORS.primary; // Green for sold
    
    if (status === 'pending') {
      label = 'Pending';
      color = COLORS.warning; // Yellow for pending
    } else if (status === 'cancelled') {
      label = 'Cancelled';
      color = COLORS.danger; // Red for cancelled
    }
    
    return { statusLabel: label, statusColor: color };
  }, [status]);
  
  return (
    <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
      <Text style={[styles.statusText, { color: statusColor }]}>
        {statusLabel}
      </Text>
    </View>
  );
});

// Memoized order item component
const OrderItemComponent = memo(({ 
  item,
  index
}: { 
  item: Order;
  index: number;
}) => {
  // Early return for invalid items
  if (!item) return null;
  
  // Get the product and buyer information
  const { product, buyerInfo, displayName } = useMemo(() => {
    try {
      // Get items from orderDetails first, then fall back to direct items property
      const orderItems = item.orderDetails?.items || item.items;
      
      // If no items, return empty values
      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return { product: null, buyerInfo: null, displayName: 'Anonymous' };
      }
      
      const firstProduct = orderItems[0];
      
      if (!firstProduct || typeof firstProduct !== 'object') {
        return { product: null, buyerInfo: null, displayName: 'Anonymous' };
      }
      
      // Check if buyer is an object or just an ID
      const buyer = typeof item.buyer === 'object' ? item.buyer : { _id: item.buyer };
      
      return { 
        product: firstProduct,
        buyerInfo: buyer,
        displayName: buyer?.username || 'Anonymous'
      };
    } catch (error) {
      return { product: null, buyerInfo: null, displayName: 'Anonymous' };
    }
  }, [item]);
  
  // If there's no valid product data, don't render anything
  if (!product) return null;
  
  // Determine if we have a product image
  const hasImage = useMemo(() => {
    return product.productImages && 
           Array.isArray(product.productImages) && 
           product.productImages[0]?.url;
  }, [product.productImages]);
  
  // Memoize product values
  const productName = useMemo(() => product.productName || 'Unnamed Product', [product.productName]);
  const formattedPrice = useMemo(() => formatPrice(product.price || 0), [product.price]);
  const quantity = useMemo(() => product.quantity || 1, [product.quantity]);
  
  return (
    <View style={styles.orderCard}>
      <View style={styles.productImageContainer}>
        {hasImage ? (
          <GlassImage
            source={{ uri: product.productImages![0].url }} 
            imageStyle={styles.productImage}
            glassStyle={styles.productImage}
            placeholderColor={COLORS.backgroundLight}
            blurIntensity={20}
            tint="dark"
            showActivityIndicator={false}
          />
        ) : (
          <View style={styles.productImage}>
            <MaterialCommunityIcons name="package-variant" size={24} color={COLORS.gray} />
          </View>
        )}
      </View>
      
      <View style={styles.orderContent}>
        <Text style={styles.productName} numberOfLines={1}>
          {productName}
        </Text>
        
        <Text style={styles.priceText}>
          {formattedPrice}
        </Text>
        
        <Text style={styles.quantityText}>
          Quantity: {quantity}
        </Text>
        
        <View style={styles.buyerInfo}>
          <GlassImage 
            source={{ uri: buyerInfo?.profileImage?.url }} 
            imageStyle={styles.buyerImage} 
            glassStyle={styles.buyerImage} 
            placeholderColor={COLORS.backgroundLight} 
            blurIntensity={20} 
            tint="dark" 
            showActivityIndicator={false} 
          />
          <Text style={styles.buyerText}>
            {displayName} bought it
          </Text>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <StatusBadge status={product.status} />
        
        <View style={styles.followButton}>
          <MaterialIcons name="verified" size={12} color={COLORS.white} />
          <Text style={styles.followButtonText}>Verified</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
    </View>
  );
}, (prevProps, nextProps) => {
  // Implement custom equality check to prevent unnecessary re-renders
  return prevProps.item._id === nextProps.item._id;
});

// Main component
const StreamOrdersComponent = ({ streamId, closeSheet }: StreamOrdersProps) => {
  const router = useRouter();
  const livestreamContext = useLivestream() as LivestreamContextType;
  
  // Use reducer for more efficient state management
  const [state, dispatch] = useReducer(ordersReducer, {
    orders: [],
    isLoading: true,
    error: null
  });
  
  const { orders, isLoading, error } = state;

  // Animation values with useRef to prevent unnecessary re-renders
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const animationsStarted = useRef(false);
  
  // Ref for tracking mounted state
  const isMounted = useRef(true);
  
  // FlatList ref to prevent recreation
  const listRef = useRef<BottomSheetFlatListMethods>(null);

  // Setup animations
  const startAnimations = useCallback(() => {
    if (animationsStarted.current) return;
    
    animationsStarted.current = true;
    
    // Breathing pulse animation
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

    // Auto-hide loading state after a timeout
    const timer = setTimeout(() => {
      if (isMounted.current && isLoading && orders.length === 0) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 10000);

    return () => {
      pulseAnimation.stop();
      breatheAnimation.stop();
      clearTimeout(timer);
  };
  }, []);

  // Optimized function to fetch orders
  const fetchOrders = useCallback(async () => {
    if (!isMounted.current) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      let fetchedOrders: Order[] = [];
      
      if (typeof livestreamContext.fetchStreamOrders === 'function') {
        const response = await livestreamContext.fetchStreamOrders(streamId);
        
        if (response && response.orders) {
          fetchedOrders = response.orders;
        }
      } else {
        // Fallback implementation
        const token = await AsyncStorage.getItem('token');
        const userToken = JSON.parse(token || '""');
        
        if (!userToken) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(
          process.env.EXPO_PUBLIC_API_URL + `api/streams/${streamId}/orders`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          },
        );

        if (response.status === 200) {
          fetchedOrders = response.data.orders || [];
        }
      }
      
      if (isMounted.current) {
        dispatch({ type: 'SET_ORDERS', payload: fetchedOrders });
      }
    } catch (error: any) {
      if (isMounted.current) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: `Failed to load orders: ${error.message || 'Unknown error'}` 
        });
      }
    } finally {
      // Small delay to show the skeleton for at least a moment for better UX
      if (isMounted.current) {
      setTimeout(() => {
          dispatch({ type: 'SET_LOADING', payload: false });
        }, 1000);
    }
    }
  }, [streamId, livestreamContext]);

  // Run initial fetch and setup
  useEffect(() => {
    isMounted.current = true;
    fetchOrders();
    const cleanupAnimations = startAnimations();
    
    return () => {
      isMounted.current = false;
      if (cleanupAnimations) cleanupAnimations();
    };
  }, [streamId]);

  // Memoized render function for order items
  const renderOrderItem = useCallback(({ item, index }: { item: Order; index: number }) => (
    <OrderItemComponent item={item} index={index} />
  ), []);

  // Memoized keyExtractor for FlatList
  const keyExtractor = useCallback((item: Order) => 
    `order-${item?.orderId || item?._id || Math.random().toString()}`, 
  []);

  // Memoized function to render skeleton loader
  const renderSkeletonLoader = useMemo(() => (
    <View style={styles.skeletonContainer}>
      {SKELETON_ARRAY.map((_, i) => (
        <SkeletonItem 
          key={`skeleton-${i}`} 
          index={i} 
          breatheAnim={breatheAnim} 
        />
      ))}
    </View>
  ), [breatheAnim]);

  return (
    <BottomSheetScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Header count={orders?.length || 0} />

      {isLoading ? renderSkeletonLoader : 
       error ? <ErrorState error={error} onRetry={fetchOrders} /> : (
        <BottomSheetFlatList
          ref={listRef}
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={EmptyState}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          initialNumToRender={7}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 110, // Fixed height for items
            offset: 110 * index,
            index,
          })}
        />
      )}
    </BottomSheetScrollView>
  );
};

// Precomputed styles
const styles = StyleSheet.create({
  container: {
    height: 600,
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
  orderCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderCountText: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 4,
  },
  skeletonContainer: {
    paddingTop: 10,
  },
  listContent: {
    paddingBottom: 30,
  },
  orderCard: {
    flexDirection: 'row',
    padding: 15,
    height: 110,
    position: 'relative',
    overflow: 'hidden',
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 70,
    height: "100%",
    borderRadius: 4,
    backgroundColor: COLORS.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quantityText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    marginBottom: 4,
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyerImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  buyerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  actionsContainer: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewProfileButton: {
    marginBottom: 8,
  },
  viewProfileText: {
    color: COLORS.textTertiary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  followButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  followButtonText: {
    color: COLORS.white,
    fontSize: 11,
    marginLeft: 4,
  },
  divider: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 0,
    height: 1,
    backgroundColor: COLORS.border,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    color: COLORS.textTertiary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubText: {
    color: COLORS.textQuaternary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Skeleton specific styles
  skeletonTitle: {
    height: 18,
    width: '70%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
    marginBottom: 8
  },
  skeletonPrice: {
    height: 14,
    width: '40%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
    marginBottom: 8
  },
  skeletonQuantity: {
    height: 14,
    width: '60%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
    marginBottom: 8
  },
  skeletonBuyer: {
    height: 14,
    width: '55%',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4
  },
  skeletonBadge: {
    height: 28,
    width: 50,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginRight: 10
  },
});

// Export memoized component
const StreamOrders = memo(StreamOrdersComponent);
export default StreamOrders; 