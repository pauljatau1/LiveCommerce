import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import React, { useEffect, useRef, useCallback, useMemo, memo } from 'react';
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

// Memoized gradient background component
function GradientBackgroundComponent() {
  return (
    <LinearGradient
      colors={['rgba(22, 120, 58, 0.1)', 'rgba(22, 120, 58, 0.05)']}
      style={styles.gradientBackground}
    />
  );
}
const GradientBackground = React.memo(GradientBackgroundComponent);

// Memoized success icon component
function SuccessIconComponent() {
  return (
    <View style={styles.successIconContainer}>
      <View style={styles.successIconOuter}>
        <View style={styles.successIconInner}>
          <AntDesign name="check" size={28} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}
const SuccessIcon = React.memo(SuccessIconComponent);

// Memoized header component
function HeaderComponent({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={onClose}
        hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
      >
        <AntDesign name="close" size={20} color="#999999" />
      </TouchableOpacity>
    </View>
  );
}
const Header = React.memo(HeaderComponent);

// Memoized price row component
function PriceRowComponent({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}
const PriceRow = React.memo(PriceRowComponent);

// Memoized divider component
function DividerComponent() {
  return <View style={styles.divider} />;
}
const Divider = React.memo(DividerComponent);

// Memoized total row component
function TotalRowComponent({ total }: { total: string }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalLabel}>Total</Text>
      <Text style={styles.totalValue}>{total}</Text>
    </View>
  );
}
const TotalRow = React.memo(TotalRowComponent);

// Memoized action buttons component
function ActionButtonsComponent({ 
  onClose, 
  onViewOrder, 
  orderId 
}: { 
  onClose: () => void; 
  onViewOrder: (id: string) => void; 
  orderId: string;
}) {
  // Use callback to prevent recreation of this function on every render
  const handleViewOrder = useCallback(() => {
    onViewOrder(orderId);
  }, [onViewOrder, orderId]);

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={onClose}
      >
        <Text style={styles.secondaryButtonText}>Continue Bidding</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.primaryButton} 
        onPress={handleViewOrder}
      >
        <Text style={styles.primaryButtonText}>View Order</Text>
        <Feather name="arrow-right" size={18} color="#FFFFFF" style={styles.buttonIcon} />
      </TouchableOpacity>
    </View>
  );
}
const ActionButtons = React.memo(ActionButtonsComponent);

// Memoized bottom message component
function BottomMessageComponent() {
  return (
    <View style={styles.bottomMessage}>
      <MaterialIcons name="local-shipping" size={16} color="#16783A" style={styles.shippingIcon} />
      <Text style={styles.bottomMessageText}>
        Your order has been received and is being processed
      </Text>
    </View>
  );
}
const BottomMessage = React.memo(BottomMessageComponent);

// Memoized order info component
function OrderInfoComponent({ 
  productName, 
  orderId, 
  amount, 
  shippingFee, 
  total, 
  formatPrice 
}: { 
  productName: string; 
  orderId: string; 
  amount: number; 
  shippingFee: number; 
  total: number; 
  formatPrice: (price: number) => string;
}) {
  // Memoize formatted values to avoid recalculation
  const formattedAmount = useMemo(() => formatPrice(amount), [formatPrice, amount]);
  const formattedShippingFee = useMemo(() => formatPrice(shippingFee), [formatPrice, shippingFee]);
  const formattedTotal = useMemo(() => formatPrice(total), [formatPrice, total]);
  const truncatedOrderId = useMemo(() => orderId.substring(0, 8) + '...', [orderId]);

  return (
    <View style={styles.orderInfoContainer}>
      <View style={styles.orderInfoRow}>
        <Text style={styles.orderInfoLabel}>Product:</Text>
        <Text style={styles.orderInfoValue} numberOfLines={1}>
          {productName}
        </Text>
      </View>
      
      <View style={styles.orderInfoRow}>
        <Text style={styles.orderInfoLabel}>Order ID:</Text>
        <Text style={styles.orderInfoValue}>
          {truncatedOrderId}
        </Text>
      </View>
      
      <View style={styles.priceBreakdown}>
        <PriceRow label="Product Price" value={formattedAmount} />
        <PriceRow label="Shipping Fee" value={formattedShippingFee} />
        <Divider />
        <TotalRow total={formattedTotal} />
      </View>
    </View>
  );
}
const OrderInfo = React.memo(OrderInfoComponent);

function OrderCreatedNotification({ 
  order, 
  closeSheet, 
  onViewOrder,
  formatPrice = (price) => `₦${price.toLocaleString()}`
}: OrderCreatedNotificationProps) {
  // Animation values - memoized with useRef to prevent recreation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Memoize animation configuration to prevent recreation on each render
  const animationConfig = useMemo(() => ({
    timing: {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    },
    slide: {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    },
    scale: {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }
  }), []);

  // Start animations only once on mount
  useEffect(() => {
    const animations = [
      Animated.timing(fadeAnim, animationConfig.timing),
      Animated.timing(slideAnim, animationConfig.slide),
      Animated.timing(scaleAnim, animationConfig.scale)
    ];

    Animated.parallel(animations).start();

    // Clean up animations on unmount
    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [fadeAnim, slideAnim, scaleAnim, animationConfig]);

  // Memoize animated style to prevent recomputation
  const animatedStyle = useMemo(() => ({
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim }
    ]
  }), [fadeAnim, slideAnim, scaleAnim]);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <GradientBackground />
      <SuccessIcon />
      <Header title="Order Successful!" onClose={closeSheet} />
      <OrderInfo 
        productName={order.productName}
        orderId={order.orderId}
        amount={order.amount}
        shippingFee={order.shippingFee}
        total={order.total}
        formatPrice={formatPrice}
      />
      <ActionButtons 
        onClose={closeSheet} 
        onViewOrder={onViewOrder} 
        orderId={order.orderId} 
      />
      <BottomMessage />
    </Animated.View>
  );
}

// Add display name for easier debugging
OrderCreatedNotification.displayName = 'OrderCreatedNotification';

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

export default React.memo(OrderCreatedNotification); 