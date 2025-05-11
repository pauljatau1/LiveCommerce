import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from "react-native";

// Logger utility for debugging
const logEvent = (eventName: string, details: Record<string, any>) => {
  console.log(`[CarouselHook] ${eventName}:`, details);
};

interface UseCustomCarouselOptions {
  dataLength: number;
  autoPlay?: boolean;
  loop?: boolean;
  autoPlayInterval?: number;
  defaultIndex?: number;
  onSnapToItem?: (index: number) => void;
  scrollAnimationDuration?: number;
  itemWidth?: number;
}

const useCustomCarousel = ({
  dataLength,
  autoPlay = false,
  loop = false,
  autoPlayInterval = 3000,
  defaultIndex = 0,
  onSnapToItem,
  scrollAnimationDuration = 500,
  itemWidth,
}: UseCustomCarouselOptions) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const flatListRef = useRef<FlatList>(null);
  const scrolling = useRef(false);
  const screenWidth = Dimensions.get("window").width;
  const actualItemWidth = itemWidth || screenWidth;
  
  // Log hook initialization
  useEffect(() => {
    logEvent("Initialized", {
      dataLength,
      defaultIndex,
      actualItemWidth,
      screenWidth,
      loop,
      autoPlay,
    });
  }, []);
  
  // Initialize to defaultIndex
  useEffect(() => {
    if (defaultIndex > 0 && defaultIndex < dataLength && flatListRef.current) {
      logEvent("ScrollToDefaultIndex", { defaultIndex });
      flatListRef.current.scrollToIndex({
        index: defaultIndex,
        animated: false,
      });
    }
  }, [defaultIndex, dataLength]);

  // Auto-play logic
  useEffect(() => {
    if (!autoPlay || dataLength <= 1) return;
    
    logEvent("AutoPlayStarted", { interval: autoPlayInterval });
    
    const interval = setInterval(() => {
      if (scrolling.current) {
        logEvent("AutoPlaySkipped", { reason: "Currently scrolling" });
        return;
      }
      
      let nextIndex;
      if (activeIndex === dataLength - 1) {
        nextIndex = loop ? 0 : activeIndex;
      } else {
        nextIndex = activeIndex + 1;
      }
      
      if (flatListRef.current && nextIndex !== activeIndex) {
        logEvent("AutoPlayAdvancing", { 
          from: activeIndex, 
          to: nextIndex, 
          isLoop: activeIndex === dataLength - 1 && loop 
        });
        
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewOffset: 0,
          viewPosition: 0,
        });
      }
    }, autoPlayInterval);
    
    return () => {
      logEvent("AutoPlayStopped", {});
      clearInterval(interval);
    };
  }, [activeIndex, autoPlay, autoPlayInterval, dataLength, loop]);

  // Handle scroll
  const lastIndexChangeTime = useRef(0);
  const MIN_INDEX_CHANGE_INTERVAL = 150; // ms to prevent rapid changes

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / actualItemWidth);
    
    // Log detailed scroll info at intervals to avoid log spam
    if (scrollPosition % 50 < 5) {
      logEvent("Scrolling", {
        position: scrollPosition,
        calculatedIndex: index,
        currentIndex: activeIndex,
        itemWidth: actualItemWidth,
      });
    }
    
    // Only allow index changes with a minimum interval between them
    // and don't change index during active scrolling - let handleScrollEnd do that
    const now = Date.now();
    if (!scrolling.current && 
        index !== activeIndex && 
        index >= 0 && 
        index < dataLength &&
        now - lastIndexChangeTime.current > MIN_INDEX_CHANGE_INTERVAL) {
      logEvent("IndexChanged", { from: activeIndex, to: index });
      lastIndexChangeTime.current = now;
      setActiveIndex(index);
      onSnapToItem?.(index);
    }
  }, [activeIndex, dataLength, onSnapToItem, actualItemWidth]);

  // Handle scroll begin
  const handleScrollBegin = useCallback(() => {
    scrolling.current = true;
    logEvent("ScrollBegan", { currentIndex: activeIndex });
  }, [activeIndex]);

  // Handle scroll end
  const handleScrollEnd = useCallback(() => {
    scrolling.current = false;
    
    // Get the current scroll position and calculate the correct index
    if (flatListRef.current) {
      const scrollNode = flatListRef.current.getScrollableNode();
      // @ts-ignore - This is a valid property but TypeScript doesn't know about it
      const scrollX = scrollNode.scrollLeft || 0;
      const finalIndex = Math.round(scrollX / actualItemWidth);
      
      logEvent("ScrollEnded", { finalIndex });
      
      // Only update if the index is valid and different from current
      if (finalIndex !== activeIndex && finalIndex >= 0 && finalIndex < dataLength) {
        setActiveIndex(finalIndex);
        onSnapToItem?.(finalIndex);
        lastIndexChangeTime.current = Date.now();
      }
    } else {
      logEvent("ScrollEnded", { finalIndex: activeIndex });
    }
  }, [activeIndex, actualItemWidth, dataLength, onSnapToItem]);

  // Expose method to scroll to a specific index
  const scrollToIndex = useCallback((index: number, animated = true) => {
    if (flatListRef.current && index >= 0 && index < dataLength) {
      logEvent("ManualScrollToIndex", { index, animated });
      flatListRef.current.scrollToIndex({ 
        index, 
        animated,
        viewOffset: 0,
        viewPosition: 0,
      });
    } else {
      logEvent("ScrollToIndexFailed", { 
        requestedIndex: index, 
        dataLength,
        reason: index < 0 || index >= dataLength ? "Index out of bounds" : "FlatList ref not ready"
      });
    }
  }, [dataLength]);

  // Handle scroll fail (when index is out of bounds)
  const handleScrollFail = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      // Try to recover by scrolling to a valid index
      logEvent("ScrollFailed", {
        requestedIndex: info.index,
        highestMeasuredIndex: info.highestMeasuredFrameIndex,
        averageItemLength: info.averageItemLength,
      });
      
      const recoveryIndex = Math.min(info.highestMeasuredFrameIndex, dataLength - 1);
      if (flatListRef.current && recoveryIndex >= 0) {
        logEvent("RecoveringScroll", { recoveryIndex });
        flatListRef.current.scrollToIndex({
          index: recoveryIndex,
          animated: false,
        });
      }
    },
    [dataLength]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => {
      const layout = {
        length: actualItemWidth,
        offset: actualItemWidth * index,
        index,
      };
      
      // Log item layout calculations (less frequently to avoid spam)
      if (index === 0 || index === dataLength - 1) {
        logEvent("ItemLayout", { index, layout });
      }
      
      return layout;
    },
    [actualItemWidth, dataLength]
  );

  return {
    activeIndex,
    flatListRef,
    handleScroll,
    handleScrollBegin,
    handleScrollEnd,
    scrollToIndex,
    handleScrollFail,
    getItemLayout,
    viewabilityConfig: {
      viewAreaCoveragePercentThreshold: 50,
    },
  };
};

export default useCustomCarousel; 