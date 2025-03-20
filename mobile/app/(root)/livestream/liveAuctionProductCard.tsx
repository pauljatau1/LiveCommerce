import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { Product } from '@/types/streams/livestreamStudio';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';

interface LiveAuctionProductCardProps {
    product: {
        name: string;
        description?: string;
        price: number;
        currentBid?: number;
        images: Array<{ url: string }>;
        productId: string;
    };
    onBid: (amount: number) => void;
    onCustom: () => void;
}

const LiveAuctionProductCard = ({ product, onBid, onCustom }: LiveAuctionProductCardProps) => {
    // Calculate the next bid amount (typically current bid + some increment)
    const nextBidAmount = 23; // Fixed at $23 to match the design

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
                            {product?.description || "Satisfy your buddy's cravings for summer grilling all year long..."}
                        </Text>
                    </View>
                </View>

                {/* Price and Timer Row */}
                <View style={styles.priceRow}>
                    <Text style={styles.priceText}>₦{product?.price}</Text>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>00:05</Text>
                    </View>
                </View>
            </View>

            {/* Shipping Text */}
            <View style={styles.shippingContainer}>
                <Text style={styles.shippingText}>+ Shipping + Taxes</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.customButton} onPress={onCustom}>
                    <Text style={styles.customButtonText}>Custom</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bidButton} onPress={() => onBid(nextBidAmount)}>
                    <View style={styles.bidButtonContent}>
                        <Text style={styles.bidButtonText}>Bid ₦{nextBidAmount}</Text>
                        <MaterialIcons name="keyboard-double-arrow-right" size={24} color="white" />    
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
        marginBottom: 10,
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
        alignItems: 'center',
        marginBottom: 5,
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    timerContainer: {
        //backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 3,
    },
    timerText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FF3B30', // Orange-red color like in the image
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
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    customButton: {
        width: "40%",
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
        width: "60%",
        height: 50,
        
        borderRadius: 30,
        paddingVertical: 4,
        paddingLeft: 4,
        borderWidth: 1,
        borderColor: '#16783A',
    },
    bidButtonContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '85%',
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