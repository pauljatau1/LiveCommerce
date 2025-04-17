import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, Animated, ScrollView } from 'react-native';
import React, { useRef, useEffect, useState } from 'react';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useLivestream } from '@/contexts/livestreamContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {LivestreamContextType } from "@/types/streams/livestreamStudio";
import GlassImage from '@/app/(root)/livestream/components/GlassImage';

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

const { width } = Dimensions.get('window');

const StreamOrders = ({ streamId, closeSheet }: StreamOrdersProps) => {
  const router = useRouter();
  const livestreamContext = useLivestream() as LivestreamContextType;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;

  // Fetch orders
  useEffect(() => {
    fetchOrders();
    startAnimations();
  }, [streamId]);

  const startAnimations = () => {
    // Breathing pulse animation
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

    // Auto-hide loading state after a timeout (in case the API is taking too long)
    const timer = setTimeout(() => {
      if (isLoading && orders?.length === 0) {
        setIsLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timer);
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (typeof livestreamContext.fetchStreamOrders === 'function') {
        console.log('Fetching stream orders using context function');
        const response = await livestreamContext.fetchStreamOrders(streamId);
        
        // Pretty print first order for debugging
        if (response?.orders?.[0]) {
          console.log('Sample order structure:', JSON.stringify({
            orderId: response.orders[0].orderId,
            buyer: response.orders[0].buyer,
            orderDetails: {
              ...response.orders[0].orderDetails,
              items: response.orders[0].orderDetails?.items?.map((item: OrderItem) => ({
                productName: item.productName,
                price: item.price,
                status: item.status,
                hasImages: !!item.productImages?.length
              })) || []
            }
          }, null, 2));
        }
        
        if (response && response.orders) {
          setOrders(response.orders);
          console.log('Stream orders count:', response.orders?.length);
        } else {
          setOrders([]);
        }
      } else {
        // Fallback implementation if the function is not available
        console.warn('fetchStreamOrders not available in context, using fallback');
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
          console.log('Successfully fetched stream orders via fallback');
          
          // Pretty print first order for debugging
          if (response?.data?.orders?.[0]) {
            console.log('Sample order structure:', JSON.stringify({
              orderId: response.data.orders[0].orderId,
              buyer: response.data.orders[0].buyer,
              orderDetails: {
                ...response.data.orders[0].orderDetails,
                items: response.data.orders[0].orderDetails?.items?.map((item: OrderItem) => ({
                  productName: item.productName,
                  price: item.price,
                  status: item.status,
                  hasImages: !!item.productImages?.length
                })) || []
              }
            }, null, 2));
          }
          
          setOrders(response.data.orders || []);
        }
      }
    } catch (error: any) {
      console.error('Error fetching stream orders:', error);
      setError(`Failed to load orders: ${error.message || 'Unknown error'}`);
    } finally {
      // Add a small delay to show the skeleton for at least a moment
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

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

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
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
      <Animated.View style={[styles.orderCard, pulseStyles]}>
        <Animated.View style={[styles.productImageContainer, pulseStyles]}>
          <Animated.View 
            style={[
              styles.productImage, 
              { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            ]}
          />
        </Animated.View>

        <View style={styles.orderContent}>
          <Animated.View style={[{
            height: 18,
            width: '70%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            marginBottom: 8
          }, pulseStyles]} />
          
          <Animated.View style={[{
            height: 14,
            width: '40%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            marginBottom: 8
          }, pulseStyles]} />
          
          <Animated.View style={[{
            height: 14,
            width: '60%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            marginBottom: 8
          }, pulseStyles]} />
          
          <Animated.View style={[{
            height: 14,
            width: '55%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 4
          }, pulseStyles]} />
        </View>

        <Animated.View 
          style={[{
            height: 28,
            width: 50,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 14,
            alignSelf: 'flex-start',
            marginRight: 10
          }, pulseStyles]} 
        />
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Orders Queue</Text>
          <View style={styles.orderCount}>
            <MaterialCommunityIcons name="package-variant-closed" size={16} color="#FFF" />
            <Text style={styles.orderCountText}>{orders?.length}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderOrderItem = ({ item, index }: { item: Order; index: number }) => {
    // Safety check for null/undefined item
    if (!item) {
      console.warn('Received null/undefined order item');
      return null;
    }

    try {
      // Get the product information from the first item in the order
      // Try to get items from orderDetails first, then fall back to direct items property
      const orderItems = item.orderDetails?.items || item.items;
      
      // If we don't have any items, show a warning and return null
      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        console.warn(`Order ${item.orderId} has no valid items array`);
        return null;
      }
      
      const product = orderItems[0];
      
      if (!product || typeof product !== 'object') {
        console.warn(`Order ${item.orderId} has invalid product data`);
        return null;
      }
      
      // Check if buyer is an object or just an ID
      const buyerInfo = typeof item.buyer === 'object' ? item.buyer : { _id: item.buyer };
      
      // Generate initials and avatar color for buyer
      const initials = getInitials(
        buyerInfo?.firstName, 
        buyerInfo?.lastName, 
        buyerInfo?.username
      );
      const avatarColor = getAvatarColor(typeof buyerInfo === 'string' ? buyerInfo : buyerInfo?._id || 'default');
      
      // Display name for buyer
      const displayName = buyerInfo?.username || 'Anonymous';

      // Determine status label and color
      let statusLabel = 'Sold';
      let statusColor = '#16783A'; // Green for sold
      
      if (product.status === 'pending') {
        statusLabel = 'Pending';
        statusColor = '#FFC107'; // Yellow for pending
      } else if (product.status === 'cancelled') {
        statusLabel = 'Cancelled';
        statusColor = '#FF5733'; // Red for cancelled
      }

      return (
        <View style={styles.orderCard}>
          <View style={styles.productImageContainer}>
            {/* If product has images, use the first one, otherwise show default icon */}
            {product.productImages && Array.isArray(product.productImages) && product.productImages[0]?.url ? (
              <GlassImage
                source={{ uri: product.productImages[0].url }} 
                imageStyle={styles.productImage}
                glassStyle={styles.productImage}
                placeholderColor="rgba(255, 255, 255, 0.1)"
                blurIntensity={20}
                tint="dark"
                showActivityIndicator={false}
              />
            ) : (
              <View style={styles.productImage}>
                <MaterialCommunityIcons name="package-variant" size={24} color="#AAA" />
              </View>
            )}
          </View>
          
          <View style={styles.orderContent}>
            <Text style={styles.productName} numberOfLines={1}>
              {product.productName || 'Unnamed Product'}
            </Text>
            
            <Text style={styles.priceText}>
              {formatPrice(product.price || 0)}
            </Text>
            
            <Text style={styles.quantityText}>
              Quantity: {product.quantity || 1}
            </Text>
            
            <View style={styles.buyerInfo}>
              <GlassImage source={{ uri: buyerInfo?.profileImage?.url }} imageStyle={styles.buyerImage} glassStyle={styles.buyerImage} placeholderColor="rgba(255, 255, 255, 0.1)" blurIntensity={20} tint="dark" showActivityIndicator={false} />
              <Text style={styles.buyerText}>
                {displayName} bought it
              </Text>
            </View>
          </View>
          
          <View style={styles.actionsContainer}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
            
            <View 
              style={styles.followButton}
            >
              <MaterialIcons name="verified" size={12} color="white" />
              <Text style={styles.followButtonText}>Verified</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
        </View>
      );
    } catch (error) {
      console.error('Error rendering order item:', error, item);
      return null;
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="package-variant"
        size={65}
        color="rgba(255,255,255,0.3)"
      />
      <Text style={styles.emptyStateText}>No orders yet</Text>
      <Text style={styles.emptyStateSubText}>
        Orders will appear here when viewers make purchases
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="error-outline" size={60} color="rgba(255,120,120,0.5)" />
      <Text style={styles.emptyStateText}>Something went wrong</Text>
      <Text style={styles.emptyStateSubText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={fetchOrders}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderHeader()}

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[...Array(5)].map((_, i) => (
            <SkeletonItem key={`skeleton-${i}`} index={i} />
          ))}
        </View>
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => `order-${item?.orderId}`}
          ListEmptyComponent={renderEmptyState}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 600,
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
  orderCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderCountText: {
    color: '#FFFFFF',
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
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderContent: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quantityText: {
    color: 'rgba(255,255,255,0.7)',
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
    color: 'rgba(255,255,255,0.6)',
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  followButton: {
    backgroundColor: '#16783A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginLeft: 4,
  },
  divider: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#16783A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default StreamOrders; 