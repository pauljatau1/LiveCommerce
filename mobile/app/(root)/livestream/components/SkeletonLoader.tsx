import React from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface SkeletonLoaderProps {
    type: 'loading' | 'fallback';
}

/**
 * Skeleton loader component for the LivestreamStudioFeed
 * Simple, industry-standard loading screen similar to popular streaming platforms
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type }) => {
    // Brand color
    const brandGreen = '#16783A';
    
    return (
        <View style={styles.container}>
            {/* Simple gradient background */}
            <LinearGradient
                colors={['#000000', '#101010', '#121212']}
                style={styles.gradientBackground}
            >
                {/* Centered loading animation */}
                <View style={styles.lottieContainer}>
                    <LottieView
                        source={require('@/assets/lottie/dots-loading.json')}
                        autoPlay
                        loop
                        style={styles.lottieAnimation}
                    />
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        height: '100%',
        width: '100%',
        backgroundColor: 'black',
        zIndex: 10,
    },
    gradientBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottieContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottieAnimation: {
        width: 80,
        height: 80,
    },
    fallbackLoader: {
        position: 'absolute',
        opacity: 0.2, // Only shows if Lottie fails to load
    }
}); 