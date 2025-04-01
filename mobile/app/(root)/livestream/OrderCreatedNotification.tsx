import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuctionOrderCreated } from './socketHandler';

interface OrderCreatedNotificationProps {
  order: AuctionOrderCreated;
  closeSheet: () => void;
  onViewOrder: (orderId: string) => void;
  formatPrice?: (price: number) => string;
}

const { width } = Dimensions.get('window');

const OrderCreatedNotification = ({ 
  order, 
  closeSheet, 
  onViewOrder,
  formatPrice = (price) => `₦${price.toLocaleString()}`
}: OrderCreatedNotificationProps) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(22, 120, 58, 0.1)', 'rgba(22, 120, 58, 0.05)']}
        style={styles.gradientBackground}
      />
      
      {/* Success Icon */}
      <View style={styles.successIconContainer}>
        <View style={styles.successIconOuter}>
          <View style={styles.successIconInner}>
            <AntDesign name="check" size={28} color="#FFFFFF" />
          </View>
        </View>
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Order Successful!</Text>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={closeSheet}
          hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
        >
          <AntDesign name="close" size={20} color="#999999" />
        </TouchableOpacity>
      </View>
      
      {/* Order Details */}
      <View style={styles.orderInfoContainer}>
        <View style={styles.orderInfoRow}>
          <Text style={styles.orderInfoLabel}>Product:</Text>
          <Text style={styles.orderInfoValue} numberOfLines={1}>
            {order.productName}
          </Text>
        </View>
        
        <View style={styles.orderInfoRow}>
          <Text style={styles.orderInfoLabel}>Order ID:</Text>
          <Text style={styles.orderInfoValue}>
            {order.orderId.substring(0, 8)}...
          </Text>
        </View>
        
        <View style={styles.priceBreakdown}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Product Price</Text>
            <Text style={styles.priceValue}>{formatPrice(order.amount)}</Text>
          </View>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping Fee</Text>
            <Text style={styles.priceValue}>{formatPrice(order.shippingFee)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={closeSheet}
        >
          <Text style={styles.secondaryButtonText}>Continue Bidding</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => onViewOrder(order.orderId)}
        >
          <Text style={styles.primaryButtonText}>View Order</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
      
      {/* Bottom Message */}
      <View style={styles.bottomMessage}>
        <MaterialIcons name="local-shipping" size={16} color="#16783A" style={styles.shippingIcon} />
        <Text style={styles.bottomMessageText}>
          Your order has been received and is being processed
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#121212',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 300,
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(22, 120, 58, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16783A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderInfoContainer: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  orderInfoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    maxWidth: width * 0.5,
  },
  priceBreakdown: {
    marginTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#BBBBBB',
  },
  priceValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16783A',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#16783A',
    borderRadius: 30,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  bottomMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shippingIcon: {
    marginRight: 6,
  },
  bottomMessageText: {
    color: '#AAAAAA',
    fontSize: 12,
  }
});

export default OrderCreatedNotification; 