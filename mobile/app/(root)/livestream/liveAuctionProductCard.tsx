import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useEffect } from 'react';
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
        bidStatus?: 'pending' | 'active' | 'ongoing' | 'ended';
    };
    tag: string | string[];
    category: string;
    onBid: (amount: number) => void;
    onCustom: () => void;
    formatPrice?: (price: number) => string;
    bidIncrement?: number;
    isBidSending?: boolean;
    bidTimeRemaining?: string;
}

const LiveAuctionProductCard = ({
    product,
    onBid,
    onCustom,
    formatPrice,
    tag,
    category,
    bidIncrement = 500,
    isBidSending = false,
    bidTimeRemaining = "00:30"
}: LiveAuctionProductCardProps) => {
    // Calculate the next bid amount with a fixed default increment of 500
    const currentBid = product.currentBid || product.minBid || product.price;
    const minBid = product.minBid || product.price;
    // Use the provided bidIncrement or default to 500
    const nextBidAmount = currentBid + bidIncrement;

    // Format the prices for display
    const formatPriceDisplay = (price: number) => {
        if (formatPrice) {
            return formatPrice(price);
        }
        return `₦${price.toLocaleString()}`;
    };

    // Determine if timer is in critical state (less than 10 seconds)
    const isTimerCritical = () => {
        if (!bidTimeRemaining) return false;
        
        // If format is MM:SS or MM.SS, convert to seconds
        if (bidTimeRemaining.includes(':') || bidTimeRemaining.includes('.')) {
            // Split on either : or . separator
            const separator = bidTimeRemaining.includes(':') ? ':' : '.';
            const [minutes, seconds] = bidTimeRemaining.split(separator).map(Number);
            return (minutes * 60 + seconds) < 10;
        }
        
        // If format is just seconds
        return Number(bidTimeRemaining) < 10;
    };
    
    console.log('current bid product image:', product?.images?.[0]?.url);
    console.log('using bid increment:', bidIncrement);
    console.log('bid time remaining:', bidTimeRemaining);
    console.log('product bid status:', product.bidStatus);
    console.log('timer critical status:', isTimerCritical());

    useEffect(() => {
        console.log('LiveAuctionProductCard received new bidTimeRemaining:', bidTimeRemaining);
        if (product.bidStatus === 'active') {
            console.log('Product is active, displaying timer:', bidTimeRemaining);
        }
    }, [bidTimeRemaining, product.bidStatus]);

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
                <Text style={[
                    styles.timerText,
                    isTimerCritical() && styles.criticalTimerText
                ]}>
                    {product.bidStatus === 'active' ? bidTimeRemaining : '00:30'}
                </Text>
    </View>

            {/* Category and Tags */}
            {
                tag && category && (
                    <View style={styles.categoryTagsContainer}>
                        <Text style={styles.categoryTagsText}>
                            {category} <Text style={styles.dotSeparator}>•</Text> {Array.isArray(tag) ? tag.join(', ') : tag}
                        </Text>
                    </View>)
            }

            {/* Action Buttons */}
            <View style={styles.buttonsRow}>
                {product.bidStatus === 'active' ? (
                    <>
                        <TouchableOpacity
                            style={styles.customButton}
                            onPress={onCustom}
                            disabled={isBidSending}
                        >
                            <Text style={[
                                styles.customButtonText,
                                isBidSending && styles.disabledButtonText
                            ]}>Custom bid</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.bidButton,
                                isBidSending && styles.disabledBidButton
                            ]}
                            onPress={() => onBid(nextBidAmount)}
                            disabled={isBidSending}
                        >
                            <View style={styles.bidButtonContent}>
                                <Text style={styles.bidButtonText}>Bid {formatPriceDisplay(nextBidAmount)}</Text>
                                {isBidSending ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="swap-horizontal" size={22} color="white" />
                                )}
                            </View>
                        </TouchableOpacity>
                    </>
                ) : product.bidStatus === 'ongoing' ? (
                    <TouchableOpacity style={styles.ongoingButton} disabled={true}>
                        <Text style={styles.ongoingButtonText}>Awaiting Next Item</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.awaitingButton} disabled={true}>
                        <Text style={styles.awaitingButtonText}>Awaiting Bid Start</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        paddingVertical: 6,
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
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    timerText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#16783A', // Orange-red color like in the image
    },
    criticalTimerText: {
        color: '#FF3B30', // Bright red for critical timer (< 10 seconds)
        fontSize: 14, // Slightly larger
        fontWeight: 'bold',
    },
    stockContainer: {
        //backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 2,
        borderRadius: 4,
    },
    stockText: {
        //backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Translucent glass-like effect for custom button
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
    disabledBidButton: {
        borderColor: '#0f4f26',
        opacity: 0.8,
    },
    disabledButtonText: {
        opacity: 0.7,
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
    categoryTagsContainer: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
        marginBottom: 12,
    },
    categoryTagsText: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    dotSeparator: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.7,
        marginHorizontal: 4,
    },
    awaitingButton: {
        flex: 1,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.6,
    },
    awaitingButtonText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    ongoingButton: {
        flex: 1,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.6,
    },
    ongoingButtonText: {
        fontWeight: 'bold',
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
    },
});

export default LiveAuctionProductCard;