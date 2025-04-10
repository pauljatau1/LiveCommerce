import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS
} from 'react-native-reanimated';
import { AntDesign } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Heart {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
}

export interface FloatingHeartsAnimationProps {
  count?: number;
  color?: string;
}

export interface FloatingHeartsRef {
  generateHearts: () => void;
}

export const FloatingHeartsAnimation = forwardRef<FloatingHeartsRef, FloatingHeartsAnimationProps>(
  ({ count = 10, color = '#16783A' }, ref) => {
    const [hearts, setHearts] = useState<Heart[]>([]);
    
    const generateHearts = () => {
      const newHearts: Heart[] = [];
      const baseX = screenWidth - 80; // Starting position at bottom right
      
      for (let i = 0; i < count; i++) {
        newHearts.push({
          id: Date.now() + i,
          // Random horizontal position within a range from the right side
          x: baseX + Math.random() * 50 - 25,
          // Random size between 20 and 35
          size: 20 + Math.random() * 15,
          // Random duration between 2 and 3 seconds
          duration: 2000 + Math.random() * 1000,
          // Random delay before animation starts
          delay: Math.random() * 500,
        });
      }
      
      setHearts(newHearts);
      
      // Clear hearts after animation completes
      setTimeout(() => {
        setHearts([]);
      }, 4000); // 3 seconds for animation + max delay + buffer
    };

    // Expose methods to parent through ref
    useImperativeHandle(ref, () => ({
      generateHearts
    }));

    // Heart component that animates a single heart
    const Heart = ({ heart }: { heart: Heart }) => {
      // Animation values
      const opacity = useSharedValue(0);
      const translateY = useSharedValue(0);
      const translateX = useSharedValue(0);
      const scale = useSharedValue(0.5);
      const rotate = useSharedValue(0);
      
      useEffect(() => {
        // Start animation sequence
        opacity.value = withSequence(
          withDelay(heart.delay, withTiming(1, { duration: 300 })),
          withDelay(heart.duration - 500, withTiming(0, { duration: 500 }))
        );
        
        // Rise up with slight left/right variance
        translateY.value = withDelay(
          heart.delay,
          withTiming(-screenHeight / 2, {
            duration: heart.duration,
            easing: Easing.out(Easing.quad),
          })
        );
        
        // Horizontal sway animation
        translateX.value = withDelay(
          heart.delay,
          withTiming(Math.random() * 100 - 50, {
            duration: heart.duration,
            easing: Easing.inOut(Easing.ease),
          })
        );
        
        // Scale animation
        scale.value = withSequence(
          withDelay(heart.delay, withTiming(1.2, { duration: 300 })),
          withTiming(1, { duration: 200 })
        );
        
        // Slight rotation for natural movement
        rotate.value = withDelay(
          heart.delay,
          withTiming(Math.random() * 20 - 10, {
            duration: heart.duration,
          })
        );
        
        return () => {
          // Clean up animations when component unmounts
          cancelAnimation(opacity);
          cancelAnimation(translateY);
          cancelAnimation(translateX);
          cancelAnimation(scale);
          cancelAnimation(rotate);
        };
      }, []);
      
      const heartStyle = useAnimatedStyle(() => {
        return {
          opacity: opacity.value,
          transform: [
            { translateY: translateY.value },
            { translateX: translateX.value },
            { scale: scale.value },
            { rotate: `${rotate.value}deg` },
          ],
        };
      });
      
      return (
        <Animated.View
          style={[
            styles.heartContainer,
            {
              left: heart.x,
              bottom: 50,
            },
            heartStyle,
          ]}
        >
          <AntDesign name="heart" size={heart.size} color={color} />
        </Animated.View>
      );
    };
    
    return (
      <View style={styles.container} pointerEvents="none">
        {hearts.map((heart) => (
          <Heart key={heart.id} heart={heart} />
        ))}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  heartContainer: {
    position: 'absolute',
  },
}); 