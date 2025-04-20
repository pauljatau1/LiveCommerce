import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface SkeletonLoaderProps {
    type: 'loading' | 'fallback';
}

/**
 * Skeleton loader component for the LivestreamStudioFeed
 * Provides visual placeholders while content is loading
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type }) => {
    const insets = useSafeAreaInsets();
    const breatheAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        // Start pulsing animation
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.ease,
                    useNativeDriver: false,
                }),
                Animated.timing(breatheAnim, {
                    toValue: 0,
                    duration: 1200,
                    easing: Easing.ease,
                    useNativeDriver: false,
                }),
            ])
        );
        
        animation.start();
        return () => animation.stop();
    }, []);
    
    // Create staggered skeleton items
    const SkeletonItem = ({ index = 0, style = {} }: { index?: number, style?: any }) => {
        // Stagger the animations slightly based on index
        const delayFactor = index * 0.2;
        const animatedOpacity = breatheAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.7]
        });

        const pulseStyles = {
            opacity: Animated.add(animatedOpacity, new Animated.Value(-delayFactor)).interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.7],
                extrapolate: 'clamp'
            })
        };

        return (
            <Animated.View style={[style, pulseStyles]} />
        );
    };

    if (type === 'loading') {
        return (
            <View style={styles.container}>
                {/* Top UI */}
                <View style={[styles.topBar, { marginTop: insets.top + 15 }]}>
                    <View style={styles.storeInfoContainer}>
                        <SkeletonItem index={0} style={styles.avatarPlaceholder} />
                        <View>
                            <SkeletonItem index={1} style={styles.storeName} />
                            <SkeletonItem index={2} style={styles.username} />
                        </View>
                    </View>
                    <SkeletonItem index={3} style={styles.followButton} />
                    <View style={styles.viewerCountContainer}>
                        <SkeletonItem index={4} style={styles.viewerCount} />
                    </View>
                </View>

                {/* Right Actions */}
                <View style={styles.rightActions}>
                    {[0, 1, 2, 3, 4].map((index) => (
                        <View key={index} style={styles.actionItem}>
                            <SkeletonItem index={5 + index} style={styles.actionButton} />
                            <SkeletonItem index={10 + index} style={styles.actionText} />
                        </View>
                    ))}
                </View>

                {/* Comments */}
                <View style={styles.comments}>
                    {[0, 1, 2, 3].map((index) => (
                        <View key={index} style={styles.commentItem}>
                            <SkeletonItem index={15 + index} style={styles.commentAvatar} />
                            <View style={styles.commentContent}>
                                <SkeletonItem index={19 + index} style={styles.commentUser} />
                                <SkeletonItem index={23 + index} style={styles.commentText} />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Bottom UI */}
                <View style={styles.bottomArea}>
                    {/* Comment Input */}
                    <View style={styles.commentInputContainer}>
                        <SkeletonItem index={27} style={styles.commentInput} />
                    </View>

                    {/* Product Card */}
                    <SkeletonItem index={28} style={styles.productCard} />
                </View>
            </View>
        );
    }

    // Fallback skeleton (simpler, focuses on empty state)
    return (
        <View style={styles.container}>
            {/* Video Placeholder */}
            <View style={styles.fallbackContainer}>
                <SkeletonItem index={0} style={styles.logoPlaceholder} />
                <SkeletonItem index={1} style={styles.fallbackText} />
                <SkeletonItem index={2} style={styles.fallbackSubtext} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        position: 'relative',
        height: '100%',
        width: '100%',
    },
    videoPlaceholder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#111111',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    storeInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    storeName: {
        width: 120,
        height: 16,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 6,
    },
    username: {
        width: 80,
        height: 12,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    followButton: {
        width: 80,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(22, 120, 58, 0.3)',
        marginLeft: 16,
    },
    viewerCountContainer: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewerCount: {
        width: 60,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    rightActions: {
        position: 'absolute',
        right: 16,
        bottom: 180,
        alignItems: 'center',
        zIndex: 10,
    },
    actionItem: {
        alignItems: 'center',
        marginBottom: 16,
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 4,
    },
    actionText: {
        width: 36,
        height: 10,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    comments: {
        position: 'absolute',
        bottom: 175,
        left: 16,
        width: '70%',
        zIndex: 10,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    commentAvatar: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginRight: 8,
    },
    commentContent: {
        flex: 1,
    },
    commentUser: {
        width: 80,
        height: 12,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 6,
    },
    commentText: {
        width: '90%',
        height: 10,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    bottomArea: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    commentInputContainer: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    commentInput: {
        height: 47,
        borderRadius: 23.5,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    productCard: {
        height: 90,
        marginHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    fallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111111',
    },
    logoPlaceholder: {
        width: 80,
        height: 56,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 20,
    },
    fallbackText: {
        width: 200,
        height: 20,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 12,
    },
    fallbackSubtext: {
        width: 240,
        height: 16,
        borderRadius: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
}); 