import { useEffect, useRef, useState } from "react";
import { FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from "react-native";


interface UseCarouselOptions {
    dataLength: number;
    autoScroll?: boolean;
    autoScrollInterval?: number;
}

const useCarousel = ({ dataLength, autoScroll = false, autoScrollInterval = 2000 }: UseCarouselOptions) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatlistRef = useRef<FlatList>(null);
    const screenWidth = Dimensions.get("window").width;

    // Auto-scroll logic
    useEffect(() => {
        if (!autoScroll) return;

        const interval = setInterval(() => {
            if (activeIndex === dataLength - 1) {
                flatlistRef.current?.scrollToIndex({ index: 0, animated: true });
            } else {
                flatlistRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
            }
        }, autoScrollInterval);

        return () => clearInterval(interval);
    }, [activeIndex, autoScroll, autoScrollInterval, dataLength]);

    // Handle manual scroll
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / screenWidth);
        setActiveIndex(index);
    };

    return { activeIndex, flatlistRef, handleScroll };
};

export default useCarousel;
