import React, { useCallback, useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { Platform, View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
  useAnimatedReaction,
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { AntDesign } from '@expo/vector-icons';

// Create a globally unique ID generator that doesn't rely on external packages
const generateUniqueId = (() => {
  // Counter to ensure uniqueness even if timestamps are identical
  let counter = 0;
  // Last timestamp to detect collisions
  let lastTimestamp = 0;
  // Node IDs to ensure uniqueness across component instances
  let nodeId = Math.floor(Math.random() * 1000000);
  
  return () => {
    const timestamp = Date.now();
    
    // If we're generating IDs within the same millisecond, increment counter
    if (timestamp === lastTimestamp) {
      counter++;
    } else {
      // Reset counter for new millisecond
      counter = 0;
      lastTimestamp = timestamp;
    }
    
    // Use a combination of timestamp, counter, nodeId and random string for guaranteed uniqueness
    return `${timestamp}-${counter}-${nodeId}-${Math.random().toString(36).substring(2, 10)}`;
  };
})();

// Create a completely collision-proof ID generator that handles extreme rapid tapping
const createSequentialIdGenerator = () => {
  // Start with current timestamp for uniqueness across app restarts
  const startTime = Date.now();
  // Global counter that only increments, never resets
  let counter = 0;
  // Instance ID to guarantee uniqueness across different component instances
  const instanceId = Math.floor(Math.random() * 1000000).toString(36);
  
  // Map to track all generated IDs to guarantee no collisions
  const generatedIds = new Set();
  
  return () => {
    counter++;
    
    // Create base ID from key components that should be unique
    let id = `heart-${startTime}-${instanceId}-${counter}`;
    
    // Add randomness if needed to ensure uniqueness
    if (generatedIds.has(id)) {
      // If collision detected (shouldn't happen), add randomness
      id = `${id}-${Math.random().toString(36).substring(2, 6)}`;
    }
    
    // Track this ID
    generatedIds.add(id);
    
    // Clean up set periodically to prevent memory growth
    if (generatedIds.size > 1000) {
      // When we reach 1000 IDs, clean up the oldest ones
      // This is safe because hearts are typically removed quickly
      const idsArray = Array.from(generatedIds);
      const toRemove = idsArray.slice(0, 500);
      toRemove.forEach(oldId => generatedIds.delete(oldId));
    }
    
    return id;
  };
};

// Create our sequential ID generator instance
const heartIdGenerator = createSequentialIdGenerator();

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Interface for heart data with minimal properties
interface Heart {
  id: string;
  x: number;
  size: number;
  duration: number;
  created: number;
}

export interface FloatingHeartsAnimationProps {
  count?: number;
  color?: string;
  maxHearts?: number;
}

export interface FloatingHeartsRef {
  generateHearts: () => void;
  startContinuousHearts: () => void;
  stopContinuousHearts: () => void;
}

// Pool of pre-allocated heart positions for ultra-fast allocation
const POSITION_POOL_SIZE = 100;
const POSITION_POOL = Array.from({ length: POSITION_POOL_SIZE }).map(() => ({
  x: screenWidth - 80 + Math.random() * 50 - 25,
  size: 20 + Math.random() * 15,
  duration: 2000 + Math.random() * 800
}));

// Ultra-optimized heart component with direct hardware acceleration and error prevention
const HeartAnimated = React.memo(({ heart, color, onComplete }: { 
  heart: Heart;
  color: string;
  onComplete: (id: string) => void;
}) => {
  // Use platform-specific optimizations
  const useNativeDriver = Platform.OS !== 'web';
  
  // Setup animation values with pre-computed initial values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const rotate = useSharedValue(0);
  
  // Ensure no memory leaks
  const mounted = useRef(true);
  const animationComplete = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Safety timeout to ensure heart is always removed, even if animation fails
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (mounted.current && !animationComplete.current) {
        // Backup cleanup in case animation completion callback doesn't fire
        safeCallback();
      }
    }, heart.duration + 1000); // Duration + buffer
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [heart.duration]);
  
  // Safe callback that checks mounted state with multiple safety checks
  const safeCallback = useCallback(() => {
    if (mounted.current && !animationComplete.current) {
      animationComplete.current = true;
      // Call completion immediately to free up resources faster
      onComplete(heart.id);
    }
  }, [heart.id, onComplete]);
  
  // Setup and start all animations immediately
  useEffect(() => {
    // Pre-calculate animation values for optimization
    const rotateVal = (Math.random() * 10 - 5);
    const translateXVal = (Math.random() * 60 - 30);
    
    // Fast fade-in, slower fade-out with short delays to stagger animations
    opacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(
        heart.duration - 300,
        withTiming(0, { 
          duration: 300,
          easing: Easing.out(Easing.ease),
        }, (finished) => {
          if (finished) {
            runOnJS(safeCallback)();
          }
        })
      )
    );
    
    // Rise up smoothly
    translateY.value = withTiming(-screenHeight * 0.3, {
      duration: heart.duration,
      easing: Easing.out(Easing.quad),
    });
    
    // Simple horizontal movement (reduced complexity)
    translateX.value = withTiming(translateXVal, {
      duration: heart.duration,
      easing: Easing.linear,
    });
    
    // Simple scaling animation (reduced complexity)
    scale.value = withTiming(0.9, { 
      duration: heart.duration,
      easing: Easing.linear,
    });
    
    // Simple rotation (reduced complexity) - fixed small value to reduce GPU load
    rotate.value = withTiming(rotateVal, {
      duration: heart.duration,
      easing: Easing.linear,
    });
    
    // Cleanup all animations when unmounted
    return () => {
      mounted.current = false;
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(scale);
      cancelAnimation(rotate);
    };
  }, []);
  
  // Create optimized animated style with hardware acceleration
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }), []);
  
  return (
    <Animated.View
      style={[
        styles.heartContainer,
        { left: heart.x, bottom: 50 },
        animatedStyle,
      ]}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      <AntDesign name="heart" size={heart.size} color={color} />
    </Animated.View>
  );
}, (prev, next) => prev.heart.id === next.heart.id); // Only re-render if ID changes

export const FloatingHeartsAnimation = forwardRef<FloatingHeartsRef, FloatingHeartsAnimationProps>(
  ({ count = 10, color = '#16783A', maxHearts = 40 }, ref) => {
    // Use a buffer for heart rendering to improve performance
    const [heartBuffer, setHeartBuffer] = useState<Heart[]>([]);
    const [visibleHearts, setVisibleHearts] = useState<Heart[]>([]);
    
    // Performance flags and counters
    const isContinuousMode = useRef(false);
    const continuousIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const idCounterRef = useRef(0);
    const lastBatchTime = useRef(0);
    const pendingHeartCount = useRef(0);
    const bufferUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
    const isAddingToBuffer = useRef(false);
    const heartLimitPerMS = useRef(3); // Maximum hearts to process per millisecond
    const animationFrameRef = useRef<number | null>(null);
    const queuedTaps = useRef(0);
    
    // Function to get a unique ID efficiently
    const getNextId = useCallback(() => {
      return heartIdGenerator();
    }, []);
    
    // Pool index for faster generation
    const poolIndex = useRef(0);
    
    // Get position from pre-computed pool
    const getNextPosition = useCallback(() => {
      poolIndex.current = (poolIndex.current + 1) % POSITION_POOL_SIZE;
      return POSITION_POOL[poolIndex.current];
    }, []);
    
    // Cleanup function to avoid memory leaks
    useEffect(() => {
      return () => {
        if (continuousIntervalRef.current) {
          clearInterval(continuousIntervalRef.current);
          continuousIntervalRef.current = null;
        }
        if (bufferUpdateTimeout.current) {
          clearTimeout(bufferUpdateTimeout.current);
          bufferUpdateTimeout.current = null;
        }
        pendingHeartCount.current = 0;
        isAddingToBuffer.current = false;
        setHeartBuffer([]);
        setVisibleHearts([]);
      };
    }, []);
    
    // Cleanup function to avoid memory leaks
    useEffect(() => {
      // Safety flag to prevent operations after unmount
      let isMounted = true;
      
      // Safety timer to periodically clean up old hearts that didn't get removed properly
      const safetyCleanupInterval = setInterval(() => {
        if (isMounted) {
          const now = Date.now();
          
          // Remove hearts older than 5 seconds (should have completed animation already)
          setVisibleHearts(prev => 
            prev.filter(heart => now - heart.created < 5000)
          );
          
          // Limit total heart count under stress
          if (pendingHeartCount.current > 100) {
            pendingHeartCount.current = 20; // Reset to reasonable value
          }
        }
      }, 2000);
      
      return () => {
        isMounted = false;
        
        // Clear all timers and intervals
        if (continuousIntervalRef.current) {
          clearInterval(continuousIntervalRef.current);
          continuousIntervalRef.current = null;
        }
        if (bufferUpdateTimeout.current) {
          clearTimeout(bufferUpdateTimeout.current);
          bufferUpdateTimeout.current = null;
        }
        clearInterval(safetyCleanupInterval);
        
        // Cancel any animation frames
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Reset all counters
        pendingHeartCount.current = 0;
        isAddingToBuffer.current = false;
        queuedTaps.current = 0;
        
        // Clear state (may be unnecessary if component is unmounting)
        setHeartBuffer([]);
        setVisibleHearts([]);
      };
    }, []);
    
    // Efficient heart removal with batch processing
    const removeHeart = useCallback((id: string) => {
      setVisibleHearts(prev => {
        // Use filter for individual heart removal as it's more efficient
        // for single item removal than creating new arrays with splice
        return prev.filter(h => h.id !== id);
      });
    }, []);
    
    // Apply buffered hearts to visible state efficiently using non-blocking operations
    const applyHeartBuffer = useCallback(() => {
      if (heartBuffer.length === 0) return;
      
      // Use functional updates to avoid state conflicts
      setVisibleHearts(prev => {
        // Create a new array without mutating the previous state
        const newHearts = [...prev];
        
        // Process buffer hearts in chunks for better performance
        const toAdd = [...heartBuffer];
        
        // If adding would exceed max, remove oldest hearts first (more efficient than sorting)
        if (newHearts.length + toAdd.length > maxHearts) {
          const excessCount = newHearts.length + toAdd.length - maxHearts;
          newHearts.splice(0, excessCount);
        }
        
        // Add all new hearts
        return [...newHearts, ...toAdd];
      });
      
      // Clear buffer after applying
      setHeartBuffer([]);
    }, [heartBuffer, maxHearts]);
    
    // Use requestAnimationFrame for smooth buffer updates
    useEffect(() => {
      if (heartBuffer.length > 0) {
        // Use RAF for smoother updates aligned with frame rate
        requestAnimationFrame(applyHeartBuffer);
      }
    }, [heartBuffer, applyHeartBuffer]);
    
    // Enhanced heart creation with better error handling and performance
    const createNewHearts = useCallback((count: number) => {
      try {
        // Validate input to prevent errors
        if (count <= 0 || count > 100) {
          console.warn(`Invalid heart count: ${count}, using safe value.`);
          count = Math.max(1, Math.min(count, 15)); // Clamp to safe range
        }
        
        const now = Date.now();
        
        // Determine safe batch size based on system conditions
        const currentHeartCount = visibleHearts.length;
        const systemStressed = currentHeartCount > maxHearts * 0.6;
        
        // Limit batch size more aggressively when system is stressed
        const safeBatchSize = systemStressed ? 
          Math.min(5, count) : 
          Math.min(count, currentHeartCount > maxHearts / 3 ? 8 : 15);
        
        // Pre-generate IDs to ensure uniqueness - this is critical
        const uniqueIds = Array(safeBatchSize).fill(0).map(() => getNextId());
        
        // Create hearts with pre-determined IDs
        const newHearts: Heart[] = Array(safeBatchSize).fill(0).map((_, index) => {
          const position = getNextPosition();
          return {
            id: uniqueIds[index], // Use pre-generated unique ID
            x: position.x,
            size: position.size,
            duration: position.duration,
            created: now
          };
        });
        
        // Verify no duplicate IDs (only in development)
        if (process.env.NODE_ENV === 'development') {
          const idSet = new Set();
          for (const heart of newHearts) {
            if (idSet.has(heart.id)) {
              console.warn(`Duplicate heart ID detected: ${heart.id}`);
            }
            idSet.add(heart.id);
          }
        }
        
        // Update heart buffer with functional update
        setHeartBuffer(prevBuffer => {
          // Safe concatenation
          if (prevBuffer.length + newHearts.length > maxHearts) {
            // Drop some of the older hearts in buffer to make room
            return [...prevBuffer.slice(-(maxHearts - newHearts.length)), ...newHearts];
          }
          return [...prevBuffer, ...newHearts];
        });
        
        // Handle any remaining hearts that couldn't be processed in this batch
        const remaining = count - safeBatchSize;
        if (remaining > 0) {
          pendingHeartCount.current += remaining;
        }
      } catch (error) {
        // Recover from any possible errors
        console.warn('Error in createNewHearts:', error);
      }
    }, [getNextPosition, getNextId, visibleHearts.length, maxHearts]);
    
    // Super-optimized heart creation with crash protection and performance optimization
    const createHearts = useCallback((numHearts: number) => {
      try {
        // Get high-resolution timestamp if available
        const now = typeof performance !== 'undefined' && performance.now ? 
          performance.now() : Date.now();
        
        // Detect system stress based on current visible hearts and pending count
        const systemStress = visibleHearts.length > maxHearts * 0.7 || pendingHeartCount.current > 50;
        
        // Determine appropriate throttling based on system conditions
        const timeThreshold = systemStress ? 50 : 16; // Drop framerate under stress
        const timeSinceLastBatch = now - lastBatchTime.current;
        
        // Apply throttling when under high load
        if (timeSinceLastBatch < timeThreshold) {
          // Add to pending count with safety cap
          const newPendingCount = pendingHeartCount.current + numHearts;
          pendingHeartCount.current = Math.min(newPendingCount, systemStress ? 30 : 60);
          
          // If we already have a frame scheduled, just exit
          if (animationFrameRef.current) return;
          
          // Schedule processing for next frame using RAF for better performance
          animationFrameRef.current = requestAnimationFrame(() => {
            // Get appropriate batch size based on system conditions
            const batchSize = Math.min(
              pendingHeartCount.current,
              systemStress ? 5 : 15
            );
            
            if (batchSize > 0) {
              // Update counters before processing
              pendingHeartCount.current -= batchSize;
              lastBatchTime.current = performance.now ? performance.now() : Date.now();
              
              // Create the hearts with error handling
              try {
                createNewHearts(batchSize);
              } catch (err) {
                console.warn('Error creating hearts batch:', err);
                // Error recovery - clear pending state
                pendingHeartCount.current = 0;
              }
              
              // If we have more pending hearts, schedule next batch immediately
              if (pendingHeartCount.current > 0) {
                // Small delay before next batch to let system breathe
                setTimeout(() => {
                  animationFrameRef.current = null;
                  requestAnimationFrame(() => createHearts(0)); // Just process pending
                }, systemStress ? 50 : 16);
              } else {
                animationFrameRef.current = null;
              }
            } else {
              animationFrameRef.current = null;
            }
          });
          
          return;
        }
        
        // Direct processing (no throttling needed)
        lastBatchTime.current = now;
        createNewHearts(Math.min(numHearts, systemStress ? 5 : 15));
        
      } catch (error) {
        // Global error handler to prevent app crashes
        console.warn('Error in heart creation:', error);
        pendingHeartCount.current = 0;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    }, [createNewHearts, visibleHearts.length, maxHearts]);
    
    // Public API: Generate hearts
    const generateHearts = useCallback(() => {
      createHearts(count);
    }, [count, createHearts]);
    
    // Public API: Stop continuous hearts
    const stopContinuousHearts = useCallback(() => {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
        continuousIntervalRef.current = null;
      }
      isContinuousMode.current = false;
    }, []);
    
    // Enhanced continuous hearts generation with advanced stability features
    const startContinuousHearts = useCallback(() => {
      try {
        // Clean up any existing interval for safety
        if (continuousIntervalRef.current) {
          clearInterval(continuousIntervalRef.current);
          continuousIntervalRef.current = null;
        }
        isContinuousMode.current = false; // Reset first
        
        // Now start the new continuous mode
        isContinuousMode.current = true;
        
        // Initial burst with controlled size to give immediate feedback
        createHearts(Math.min(8, count));
        
        // Calculate appropriate interval based on device performance
        // Higher-end devices can handle more frequent updates
        const interval = Platform.OS === 'ios' ? 80 : 100; // iOS can usually handle faster updates
        
        // Use a more careful approach with controlled bursts and monitoring
        let burstCount = 0;
        const maxBursts = 50; // Safety limit
        
        // Safer implementation that can be stopped reliably
        continuousIntervalRef.current = setInterval(() => {
          // Only continue if we're still in continuous mode
          if (!isContinuousMode.current) {
            // Stop the animation
            if (continuousIntervalRef.current) {
              clearInterval(continuousIntervalRef.current);
              continuousIntervalRef.current = null;
            }
            return;
          }
          
          // Increment our safety counter
          burstCount++;
          
          // Detect system strain by checking the current hearts count
          const currentHeartCount = visibleHearts.length;
          const systemStrained = currentHeartCount > maxHearts * 0.7;
          
          // Adaptive batch size based on system strain
          const batchSize = systemStrained ? 3 : Math.min(5, count);
          
          try {
            // Generate hearts with error handling
            createHearts(batchSize);
            
            // Safety check - stop if we've done too many bursts
            // This prevents any potential memory leaks
            if (burstCount >= maxBursts) {
              // Stop the animation
              if (continuousIntervalRef.current) {
                clearInterval(continuousIntervalRef.current);
                continuousIntervalRef.current = null;
              }
              isContinuousMode.current = false;
            }
          } catch (err) {
            console.warn('Error during continuous hearts:', err);
            // Recover from any errors by stopping
            if (continuousIntervalRef.current) {
              clearInterval(continuousIntervalRef.current);
              continuousIntervalRef.current = null;
            }
            isContinuousMode.current = false;
          }
        }, interval);
        
        // Safer auto-stop with multiple backup mechanisms
        const stopTimeout = setTimeout(() => {
          // Stop the animation
          if (continuousIntervalRef.current) {
            clearInterval(continuousIntervalRef.current);
            continuousIntervalRef.current = null;
          }
          isContinuousMode.current = false;
        }, 5000);
        
        // Store the timeout for cleanup
        const timeoutRef = stopTimeout;
        
        // Ensure timeout is cleared if component unmounts
        return () => {
          clearTimeout(timeoutRef);
        };
      } catch (error) {
        console.warn('Error starting continuous hearts:', error);
        // Emergency recovery
        if (continuousIntervalRef.current) {
          clearInterval(continuousIntervalRef.current);
          continuousIntervalRef.current = null;
        }
        isContinuousMode.current = false;
      }
    }, [count, createHearts, visibleHearts.length, maxHearts]);
    
    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      generateHearts,
      startContinuousHearts,
      stopContinuousHearts
    }), [generateHearts, startContinuousHearts, stopContinuousHearts]);
    
    return (
      <View style={styles.container} pointerEvents="none">
        {visibleHearts.map(heart => (
          <HeartAnimated
            key={heart.id}
            heart={heart}
            color={color}
            onComplete={removeHeart}
          />
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