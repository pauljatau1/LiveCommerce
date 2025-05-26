import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Product } from '@/types/streams/livestreamStudio';
import { GlassImage } from './components';

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
 * Optimized for performance while maintaining Tailwind CSS styling
 */
export const LiveShowProductCard = memo(function LiveShowProductCard({ 
    item, 
    index,
    onBuyNow,
    onPreview
}: LiveShowProductCardProps) {
    // Use memoized value for the product to prevent unnecessary recalculations
    const product = useMemo(() => item.product, [item.product]);
    
    // Memoize the image source to prevent object recreation on every render
    const imageSource = useMemo(() => ({ 
        uri: product?.images?.[0]?.url 
    }), [product?.images]);
    
    // Memoize the formatted price to prevent recalculation on every render
    const formattedPrice = useMemo(() => {
        if (typeof product.price !== 'number') return '₦0';
        return `₦${product.price.toLocaleString()}`;
    }, [product.price]);

    // Memoize event handlers to prevent recreation on every render
    const handleBuyNow = useCallback((e: any) => {
        e.stopPropagation(); // Prevent triggering the card's TouchableOpacity
        if (onBuyNow) onBuyNow(product);
    }, [onBuyNow, product]);

    const handleCardPress = useCallback(() => {
        if (onPreview) onPreview(product);
    }, [onPreview, product]);

    return (
        <TouchableOpacity 
            className="bg-white/10 backdrop-blur-lg p-3 rounded-lg flex-row items-center mx-1"
            onPress={handleCardPress}
            activeOpacity={0.7} // Prevent full opacity change for better performance
        >
            <GlassImage
                source={imageSource}
                imageClassName="w-16 h-16 rounded-lg"
                glassClassName="rounded-lg"
                placeholderColor="rgba(255, 255, 255, 0.1)"
                tint="dark"
                blurIntensity={25}
                resizeMode="cover"
            />
            <View className="flex-1 ml-3">
                <Text numberOfLines={2} className="text-white capitalize font-LexendDecaMedium w-[100px]">
                    {product.name}
                </Text>
                <Text className="text-white text-lg font-LexendDecaBold">
                    {formattedPrice}
                </Text>
            </View>
            <TouchableOpacity 
                className="bg-[#16783A] px-4 py-2 rounded-full"
                onPress={handleBuyNow}
                activeOpacity={0.8} // Prevent full opacity change for better performance
            >
                <Text className="text-white text-sm font-LexendDecaMedium">Buy Now</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
}); 