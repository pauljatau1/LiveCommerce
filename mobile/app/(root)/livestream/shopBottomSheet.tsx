import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions, Pressable, RefreshControl, TextInput } from 'react-native';
import { BottomSheetFlatList, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { AntDesign, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

// Types for the live stream products (Buy Now)
interface StreamProduct {
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
    id?: string;
  };
  currentBid?: number;
  bidStatus?: string;
  orderCreated?: boolean;
  _id: string;
}

interface ShopBottomSheetProps {
  streamProducts: StreamProduct[];
  closeSheet: () => void;
}

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

// Memoized Buy Now card component
const BuyNowCard = memo(({ item, closeSheet, router, formatPrice }: { 
  item: StreamProduct, 
  closeSheet: () => void, 
  router: any,
  formatPrice: (price: number) => string 
}) => {
  // Get simplified description without HTML markup
  const simplifiedDescription = useMemo(() => 
    extractPlainText(item.product.description),
    [item.product.description]
  );

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        router.push(`/product/${item.product.productId}`);
        closeSheet();
      }}
      activeOpacity={0.8}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Image 
            source={{ uri: item.product.images[0]?.url }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
          {item.product.quantity <= 0 && (
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
            <Text style={styles.cardTitle} numberOfLines={1}>{item.product.name}</Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{formatPrice(item.product.price)}</Text>
              {item.product.discountedPrice && item.product.discountedPrice > item.product.price && (
                <View style={styles.discount}>
                  <Text style={styles.discountText}>
                    {Math.round(((item.product.discountedPrice - item.product.price) / item.product.discountedPrice) * 100)}% off
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.metaInfo}>
              {item.product.quantity <= 0 ? (
                <View style={[styles.statusBadge, styles.soldOutBadge]}>
                  <Ionicons name="alert-circle-outline" size={12} color="#F44336" />
                  <Text style={[styles.statusText, styles.soldOutText]}>Sold out</Text>
                </View>
              ) : item.product.quantity <= 3 ? (
                <View style={[styles.statusBadge, styles.lowStockBadge]}>
                  <Ionicons name="alert-circle-outline" size={12} color="#FF9800" />
                  <Text style={[styles.statusText, styles.lowStockText]}>Only {item.product.quantity} left</Text>
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle-outline" size={12} color="#16783A" />
                  <Text style={styles.statusText}>In stock</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.actionButton, item.product.quantity <= 0 ? styles.disabledButton : {}]}
              onPress={() => {
                router.push(`/product/${item.product.productId}`);
                closeSheet();
              }}
              disabled={item.product.quantity <= 0}
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
              item.product.quantity <= 0 ? styles.soldOutText : 
              item.product.quantity <= 3 ? styles.lowStockText : 
              styles.inStockText
            ]}>
              {item.product.quantity <= 0 ? 'Out of stock' : `${item.product.quantity.toLocaleString()} available`}
            </Text>
          </View>
          
          {item.orderCreated && (
            <View style={styles.orderCreatedBadge}>
              <MaterialIcons name="local-shipping" size={12} color="#16783A" />
              <Text style={styles.orderCreatedText}>Order placed</Text>
            </View>
          )}
        </View>
        
        {item.product.seller && (
          <View style={styles.sellerInfo}>
            <MaterialIcons name="store" size={14} color="#888" />
            <Text style={styles.sellerName}>{item.product.seller.storeName || item.product.seller.businessName}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// Memoized empty state
const EmptyProducts = memo(() => (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons name="shopping-outline" size={64} color="#444" />
    <Text style={styles.emptyStateTitle}>No Products Available</Text>
    <Text style={styles.emptyStateDescription}>
      There are no products available to purchase directly.
    </Text>
  </View>
));

// Memoized skeleton loader
const ProductSkeleton = memo(({ item }: { item: number }) => (
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
          <Animatable.View 
            animation="pulse" 
            easing="ease-in-out" 
            iterationCount="infinite" 
            duration={1500}
            style={[styles.skeletonBox, { width: 70, height: 32, borderRadius: 8 }]} 
          />
        </View>
      </View>
    </View>
    
    {/* Skeleton for additional product details */}
    <View style={styles.productDetails}>
      <Animatable.View 
        animation="pulse" 
        easing="ease-in-out" 
        iterationCount="infinite" 
        duration={1500}
        style={[styles.skeletonBox, { width: '100%', height: 32, borderRadius: 4, marginBottom: 8 }]} 
      />
    </View>
  </View>
));

const ShopBottomSheet = memo(({ streamProducts, closeSheet }: ShopBottomSheetProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Memoize format price function to avoid recreating it on every render
  const formatPrice = useCallback((price: number) => {
    return `₦${price.toLocaleString()}`;
  }, []);

  // Memoize search handler
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  // Memoize clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Memoize the filtered data
  const filteredProducts = useMemo(() => 
    searchQuery && streamProducts
    ? streamProducts.filter(item => 
        item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : streamProducts
  , [streamProducts, searchQuery]);

  // Memoize render functions for FlatList
  const renderProductItem = useCallback(({ item, index }: { item: StreamProduct, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', delay: Math.min(index, 5) * 50, duration: 300 }}
      key={item.product.productId}
    >
      <BuyNowCard 
        item={item}
        closeSheet={closeSheet}
        router={router}
        formatPrice={formatPrice}
      />
    </MotiView>
  ), [closeSheet, router, formatPrice]);

  // Memoize keyExtractor function
  const productKeyExtractor = useCallback((item: StreamProduct) => item.product.productId, []);

  // FlatList optimization props
  const flatListOptimizationProps = {
    removeClippedSubviews: true,
    initialNumToRender: 4,
    maxToRenderPerBatch: 3,
    windowSize: 6,
    showsVerticalScrollIndicator: false,
    contentContainerStyle: { padding: 16 }
  };

  return (
    <View className='h-[100%] bg-[#121212] ' >
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
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <AntDesign name="close" size={16} color="#777" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.content}>
        {!streamProducts || streamProducts.length === 0 ? (
          <EmptyProducts />
        ) : filteredProducts?.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color="#888" />
            <Text style={styles.emptyStateText}>No products found for "{searchQuery}"</Text>
          </View>
        ) : (
          <BottomSheetFlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={productKeyExtractor}
            {...flatListOptimizationProps}
          />
        )}
      </View>
    </View>
  );
});

// Define styles outside the component to avoid recreation on each render
const styles = StyleSheet.create({
  container: {
    height: 900,
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
  content: {
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
});

export default ShopBottomSheet;