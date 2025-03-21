import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Product } from '@/types/streams/livestreamStudio';

interface LiveShowProductCardProps {
    item: {
        product: Product;
        currentBid?: number;
        _id: string;
    };
    index: number;
    onBuyNow?: (product: Product) => void;
    onPreview?: (product: Product) => void;
}

/**
 * Product card component for live streams
 * Displays product image, name, price and buy now button
 */
export const LiveShowProductCard: React.FC<LiveShowProductCardProps> = ({ 
    item, 
    index,
    onBuyNow,
    onPreview
}) => {
    const product = item.product;

    const handleBuyNow = (e: any) => {
        e.stopPropagation(); // Prevent triggering the card's TouchableOpacity
        if (onBuyNow) {
            console.log("Buy nowproduct", product)
            onBuyNow(product);
        }
    };

    const handleCardPress = () => {
        if (onPreview) {
            console.log("Preview product", product)
            onPreview(product);
        }
    };

    return (
        <TouchableOpacity 
            className="bg-white/10 backdrop-blur-lg p-3 rounded-lg flex-row items-center mx-1"
            onPress={handleCardPress}
        >
            <Image
                source={{ uri: product.images[0]?.url }}
                className="w-16 h-16 rounded-lg"
                resizeMode="cover"
            />
            <View className="flex-1 ml-3">
                <Text numberOfLines={2} className="text-white capitalize font-LexendDecaMedium w-[100px] ">
                    {product.name}
                </Text>
                <Text className="text-white text-lg font-LexendDecaBold">
                    ₦{product?.price?.toLocaleString()}
                </Text>
            </View>
            <TouchableOpacity 
                className="bg-[#16783A] px-4 py-2 rounded-full"
                onPress={handleBuyNow}
            >
                <Text className="text-white text-sm font-LexendDecaMedium">Buy Now</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}; 