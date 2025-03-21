import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { Product } from '@/types/streams/livestreamStudio';
import { FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';

interface LiveAuctionProductCardProps {
    product: {
        name: string;
        description?: string;
        price: number;
        currentBid?: number;
        minBid?: number;
        maxBid?: number;
        images: Array<{ url: string }>;
        productId: string;
        quantity: number;
    };
    onBid: (amount: number) => void;
    onCustom: () => void;
    formatPrice?: (price: number) => string;
}

const LiveAuctionProductCard = ({ product, onBid, onCustom, formatPrice }: LiveAuctionProductCardProps) => {
    // Calculate the next bid amount with a fixed default increment of 500
    const currentBid = product.currentBid || product.minBid || product.price;
    const minBid = product.minBid || product.price;
    const DEFAULT_BID_INCREMENT = 500; // Fixed default increment of 500
    const nextBidAmount = currentBid + DEFAULT_BID_INCREMENT;

    // Format the prices for display
    const formatPriceDisplay = (price: number) => {
        if (formatPrice) {
            return formatPrice(price);
        }
        return `₦${price.toLocaleString()}`;
    };

    // Calculate remaining time (placeholder for now)
    const remainingTime = "00:05";

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={styles.contentRow}>
                    {/* Product Image */}
                    <Image
                        source={product?.images?.[0]?.url ? { uri: product?.images[0].url } : require('@/assets/icons/animoji.png')}
                        style={styles.productImage}
                        resizeMode="cover"
                    />

                    {/* Product Info Section */}
                    <View style={styles.infoSection}>
                        <Text numberOfLines={2} style={styles.productName}>
                            {product?.name}
                        </Text>
                        <Text numberOfLines={1} style={styles.productDescription}>
                            {product?.description || "No description available"}
                        </Text>
                    </View>
                </View>

                {/* Price and stock Row */}
                <View style={styles.priceRow}>
                    <Text style={styles.priceText}>{formatPriceDisplay(currentBid)}</Text>
                    <View style={styles.stockContainer}>
                        <Text style={styles.stockText}>{product?.quantity} left</Text>
                    </View>
                </View>
            </View>

            {/* Timer */}
            <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{remainingTime}</Text>
            </View>

            {/* Shipping Text */}
            <View style={styles.shippingContainer}>
                <Text style={styles.shippingText}>+ Shipping + Taxes</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.customButton} onPress={onCustom}>
                    <Text style={styles.customButtonText}>Custom bid</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bidButton} onPress={() => onBid(nextBidAmount)}>
                    <View style={styles.bidButtonContent}>
                        <Text style={styles.bidButtonText}>Bid {formatPriceDisplay(nextBidAmount)}</Text>
                        <Ionicons name="swap-horizontal" size={22} color="white" />           
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        paddingVertical: 12,
        marginVertical: 8,
    },
    contentRow: {
        flexDirection: 'row',
    },
    productImage: {
        width: 70,
        height: '100%',
        borderRadius: 6,
        marginRight: 12,
    },
    infoSection: {
        justifyContent: 'center',
        maxWidth: 150,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#FFFFFF',
    },
    productDescription: {
        fontSize: 13,
        color: '#AAAAAA', // Lighter gray for better visibility on dark background
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        marginBottom: 5,
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    timerContainer: {
        //backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    timerText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FF3B30', // Orange-red color like in the image
    },
    stockContainer: {
        //backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 2,
        borderRadius: 4,

    },
    stockText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#16783A', // Green color
    },
    bidRangeContainer: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Translucent glass-like effect
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    bidRangeText: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    shippingContainer: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Translucent glass-like effect
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    shippingText: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    buttonsRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
    },
    customButton: {
        flex: 1,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Translucent glass-like effect for custom button
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customButtonText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: 'white',
    },
    bidButton: {
        flex: 1.5,
        height: 50,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#16783A',
    },
    bidButtonContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%',
        paddingHorizontal: 5,
        borderRadius: 30,
        backgroundColor: '#16783A',
    },
    bidButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: 'white',
    },
    bidArrow: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
    },
});

export default LiveAuctionProductCard;