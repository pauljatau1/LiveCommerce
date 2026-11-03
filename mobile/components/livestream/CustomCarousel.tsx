import React, { memo, useMemo, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Text,
  ViewabilityConfig,
  ViewabilityConfigCallbackPair,
} from 'react-native';
import useCustomCarousel from '@/hooks/useCustomCarousel';

const { width: screenWidth } = Dimensions.get('window');

// Logger utility for component debugging
const logEvent = (eventName: string, details: Record<string, any>) => {
  console.log(`[CarouselComponent] ${eventName}:`, details);
};

interface CustomCarouselProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode;
  width?: number;
  height?: number;
  loop?: boolean;
  autoPlay?: boolean;
  scrollAnimationDuration?: number;
  onSnapToItem?: (index: number) => void;
  defaultIndex?: number;
  style?: StyleProp<ViewStyle>;
  showPagination?: boolean;
  debug?: boolean; // New prop to enable/disable debug info display
  viewabilityConfig?: ViewabilityConfig;
  onViewableItemsChanged?: (info: { viewableItems: any[]; changed: any[] }) => void;
}

function CustomCarousel<T>({
  data,
  renderItem,
  width = screenWidth - 32,
  height = 110,
  loop = false,
  autoPlay = false,
  scrollAnimationDuration = 500,
  onSnapToItem,
  defaultIndex = 0,
  style,
  showPagination = true,
  debug = false,
  viewabilityConfig = { itemVisiblePercentThreshold: 80 },
  onViewableItemsChanged,
}: CustomCarouselProps<T>) {
  // Track renders for debugging
  const renderCount = useRef(0);
  
  // Track when data changes
  const prevDataLength = useRef(data.length);
  
  // Use our custom hook for carousel functionality
  const {
    activeIndex,
    flatListRef,
    handleScroll,
    handleScrollBegin,
    handleScrollEnd,
    handleScrollFail,
    getItemLayout,
  } = useCustomCarousel({
    dataLength: data.length,
    autoPlay,
    loop,
    defaultIndex,
    onSnapToItem,
    scrollAnimationDuration,
    itemWidth: width,
  });
  
  // Create a stable reference to the onViewableItemsChanged callback
  const onViewableItemsChangedRef = useRef(
    onViewableItemsChanged
      ? onViewableItemsChanged
      : ({ viewableItems }: { viewableItems: any[] }) => {
          if (viewableItems && viewableItems.length > 0) {
            const newIndex = viewableItems[0].index;
            logEvent("ViewableItemsChanged", { newIndex, previousIndex: activeIndex });
            if (onSnapToItem && typeof newIndex === 'number') {
              onSnapToItem(newIndex);
            }
          }
        }
  );

  // Create a stable reference to the viewability configuration
  const viewabilityConfigRef = useRef(viewabilityConfig);
  
  // Create a stable reference to the viewability callback pairs
  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig: viewabilityConfigRef.current, onViewableItemsChanged: onViewableItemsChangedRef.current }
  ]);

  // Log component lifecycle events
  useEffect(() => {
    renderCount.current += 1;
    
    logEvent("Mounted", {
      renderCount: renderCount.current,
      dataLength: data.length,
      width,
      height,
      defaultIndex,
      loop,
      autoPlay,
    });
    
    return () => {
      logEvent("Unmounted", {
        renderCount: renderCount.current,
        activeIndex,
      });
    };
  }, []);
  
  // Log when data changes
  useEffect(() => {
    if (prevDataLength.current !== data.length) {
      logEvent("DataChanged", {
        previousLength: prevDataLength.current,
        newLength: data.length,
        activeIndex,
      });
      prevDataLength.current = data.length;
    }
  }, [data.length, activeIndex]);
  
  // Log when active index changes
  useEffect(() => {
    logEvent("ActiveIndexChanged", {
      activeIndex,
      isInitial: renderCount.current === 1,
    });
  }, [activeIndex]);

  // Wrap the renderItem function to add proper item width
  const renderItemWithWidth = useMemo(
    () => 
      ({ item, index }: { item: T; index: number }) => {
        logEvent("RenderingItem", { index, isActive: index === activeIndex });
        return (
          <View style={{ width, height }}>
            {renderItem({ item, index })}
            
            {/* Optional debug overlay when debug mode is enabled */}
            {debug && (
              <View style={styles.debugOverlay}>
                <Text style={styles.debugText}>Item {index + 1}/{data.length}</Text>
                <Text style={styles.debugText}>
                  {index === activeIndex ? "ACTIVE" : "inactive"}
                </Text>
              </View>
            )}
          </View>
        );
      },
    [renderItem, width, height, activeIndex, data.length, debug]
  );

  // Memoized pagination dots to avoid re-renders
  const PaginationDots = useMemo(() => {
    if (!showPagination || data.length <= 1) return null;
    
    logEvent("RenderingPagination", { activeIndex, dotsCount: data.length });
    
    return (
      <View style={styles.pagination}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              activeIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  }, [activeIndex, data.length, showPagination]);

  // Spacing for snapping items exactly to the center
  const contentContainerStyle = useMemo(() => ({
    alignItems: 'center' as const,
  }), []);
  
  // Log key events during render
  logEvent("Rendering", {
    renderCount: renderCount.current + 1,
    activeIndex,
    dataLength: data.length,
    loop,
    autoPlay,
  });

  return (
    <View style={[styles.container, { width, height }, style]}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItemWithWidth}
        keyExtractor={(_, index) => `carousel-item-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        snapToAlignment="center"
        decelerationRate="fast"
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollToIndexFailed={handleScrollFail}
        getItemLayout={getItemLayout}
        initialScrollIndex={defaultIndex}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        bounces={false}
        contentContainerStyle={contentContainerStyle}
        snapToOffsets={data.map((_, index) => index * width)}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        disableIntervalMomentum={true}
        disableScrollViewPanResponder={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      />
      
      {PaginationDots}
      
      {/* Debug panel when debug mode is enabled */}
      {debug && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugPanelText}>
            Active: {activeIndex + 1}/{data.length} | 
            Width: {width}px | 
            Loop: {loop ? 'ON' : 'off'} | 
            Auto: {autoPlay ? 'ON' : 'off'}
          </Text>
        </View>
      )}
    </View>
  );
}

// Optimize with React.memo to prevent unnecessary re-renders
const MemoizedCarousel = memo(CustomCarousel) as typeof CustomCarousel;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#16783A',
  },
  // Debug styles
  debugOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  debugPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
    zIndex: 1000,
  },
  debugPanelText: {
    color: '#FFF',
    fontSize: 10,
    textAlign: 'center',
  },
});

export default MemoizedCarousel; 