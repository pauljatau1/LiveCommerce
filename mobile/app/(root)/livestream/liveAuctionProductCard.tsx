import { Product } from '@/types/streams/livestreamStudio';
import { GlassImage } from './components';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useMemo } from 'react';

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

function LiveAuctionProductCard({
    product,
    onBid,
    onCustom,
    formatPrice,
    tag,
    category,
    bidIncrement = 500,
    isBidSending = false,
    bidTimeRemaining = "00:30"
}: LiveAuctionProductCardProps) {
    // Memoize all calculations to prevent recalculating on every render
    const currentBid = useMemo(() =>
        product.currentBid || product.minBid || product.price,
        [product.currentBid, product.minBid, product.price]
    );

    const nextBidAmount = useMemo(() =>
        currentBid + bidIncrement,
        [currentBid, bidIncrement]
    );

    // Memoize the price formatting function
    const formatPriceDisplay = useMemo(() =>
        (price: number) => {
            if (formatPrice) {
                return formatPrice(price);
            }
            return `₦${price.toLocaleString()}`;
        },
        [formatPrice]
    );

    // Memoize the timer critical state calculation
    const isTimerCritical = useMemo(() => {
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
    }, [bidTimeRemaining]);

    // Improved function to extract and simplify description with proper memoization
    const simplifiedDescription = useMemo(() => {
        if (!product?.description) return "";

        // First, try to get the first heading or paragraph content
        const firstTagMatch = product.description.match(/<(h[1-6]|p)[^>]*>([^<]+)<\/\1>/);
        if (firstTagMatch && firstTagMatch[2]) {
            return firstTagMatch[2].trim();
        }

        // Second approach: extract text between any tags
        const textMatch = product.description.match(/<[^>]*>([^<]+)<\/[^>]*>/);
        if (textMatch && textMatch[1]) {
            return textMatch[1].trim();
        }

        // Last resort: strip all HTML tags
        return product.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }, [product?.description]);

    return (
        <View style={styles.container}>
            <View style={styles.topContainer}>
                <View style={styles.contentRow}>
                    {/* Product Image */}
                    <GlassImage
                        source={product?.images?.[0]?.url ? { uri: product?.images[0].url } : require('@/assets/icons/animoji.png')}
                        imageStyle={styles.productImage}
                        glassStyle={styles.productImage}
                        placeholderColor="rgba(255, 255, 255, 0.1)"
                        blurIntensity={20}
                        tint="dark"
                        resizeMode="cover"
                    />

                    {/* Product Info Section */}
                    <View style={styles.infoSection}>
                        <Text numberOfLines={2} style={styles.productName}>
                            {product?.name}
                        </Text>
                        <View style={styles.descriptionContainer}>
                            <Text
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={styles.productDescription}
                            >
                                {simplifiedDescription}
                            </Text>
                        </View>
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
                    isTimerCritical && styles.criticalTimerText
                ]}>
                    {product.bidStatus === 'active' ? bidTimeRemaining : '00:30'}
                </Text>
            </View>

            {/* Category and Tags */}
            {tag && category && (
                <View style={styles.categoryTagsContainer}>
                    <Text style={styles.categoryTagsText}>
                        {category} <Text style={styles.dotSeparator}>•</Text> {Array.isArray(tag) ? tag.join(', ') : tag}
                    </Text>
                </View>
            )}

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
                            onPress={() => {
                                if (isBidSending) return;
                                onBid(nextBidAmount);
                            }}
                            disabled={isBidSending}
                        >
                            <View style={[styles.bidButtonContent, { backgroundColor: isBidSending ? "#444444" : "#16783A" }]}>
                                {
                                    isBidSending ? (
                                        <Text style={styles.bidButtonText}>Waiting...</Text>
                                    ) : (
                                        <Text style={styles.bidButtonText}>Bid {formatPriceDisplay(nextBidAmount)}</Text>
                                    )
                                }
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
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        paddingVertical: 6,
        marginVertical: 8,
    },
    topContainer: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    contentRow: {
        flexDirection: 'row',
    },
    productImage: {
        width: 60,
        height: 60,
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
        color: '#AAAAAA',
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
        paddingVertical: 2,
        borderRadius: 4,
    },
    stockText: {
        fontWeight: 'bold',
        color: '#16783A', // Green color
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
        borderRadius: 30
    },
    bidButtonText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: 'white',
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
    descriptionContainer: {
        marginVertical: 2,
    },
});

// Create a memoized version of the component
export default React.memo(LiveAuctionProductCard);