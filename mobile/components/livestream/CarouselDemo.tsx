import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import CustomCarousel from './CustomCarousel';

const { width } = Dimensions.get('window');

// Define type for our demo items
interface DemoItem {
  id: string;
  title: string;
  image: string;
  price: string;
}

// Sample data for demonstration
const demoItems: DemoItem[] = [
  {
    id: '1',
    title: 'Product 1',
    image: 'https://via.placeholder.com/300x200/16783A/FFFFFF?text=Product+1',
    price: '₦15,000'
  },
  {
    id: '2',
    title: 'Product 2',
    image: 'https://via.placeholder.com/300x200/16783A/FFFFFF?text=Product+2',
    price: '₦25,000'
  },
  {
    id: '3',
    title: 'Product 3',
    image: 'https://via.placeholder.com/300x200/16783A/FFFFFF?text=Product+3',
    price: '₦18,500'
  },
  {
    id: '4',
    title: 'Product 4',
    image: 'https://via.placeholder.com/300x200/16783A/FFFFFF?text=Product+4',
    price: '₦32,000'
  },
  {
    id: '5',
    title: 'Product 5',
    image: 'https://via.placeholder.com/300x200/16783A/FFFFFF?text=Product+5',
    price: '₦45,000'
  },
  {
    id: '6',
    title: 'Product 6',
    image: 'https://via.placeholder.com/300x200/16783A/FFFFFF?text=Product+6',
    price: '₦19,200'
  },
];

// Memoized item component for optimal rendering
const CarouselItem = memo(({ item }: { item: DemoItem, index: number }) => (
  <View style={styles.itemContainer}>
    <Image
      source={{ uri: item.image }}
      style={styles.itemImage}
      resizeMode="cover"
    />
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemPrice}>{item.price}</Text>
    </View>
  </View>
));

const CarouselDemo = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPagination, setShowPagination] = useState(true);
  const [loop, setLoop] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  
  // Memoized callback for carousel navigation
  const handleSnapToItem = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Memoized render function
  const renderItem = useCallback(({ item, index }: { item: DemoItem; index: number }) => (
    <CarouselItem item={item} index={index} />
  ), []);

  // Toggle controls
  const togglePagination = useCallback(() => {
    setShowPagination(prev => !prev);
  }, []);

  const toggleLoop = useCallback(() => {
    setLoop(prev => !prev);
  }, []);
  
  const toggleAutoPlay = useCallback(() => {
    setAutoPlay(prev => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>FlatList Carousel</Text>
      <Text style={styles.subheader}>Item {currentIndex + 1} of {demoItems.length}</Text>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={[styles.controlButton, showPagination && styles.activeButton]} 
          onPress={togglePagination}
        >
          <Text style={styles.buttonText}>
            {showPagination ? "Hide Dots" : "Show Dots"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, loop && styles.activeButton]} 
          onPress={toggleLoop}
        >
          <Text style={styles.buttonText}>
            {loop ? "Disable Loop" : "Enable Loop"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, autoPlay && styles.activeButton]} 
          onPress={toggleAutoPlay}
        >
          <Text style={styles.buttonText}>
            {autoPlay ? "Stop Auto" : "Auto Play"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <CustomCarousel<DemoItem>
        data={demoItems}
        renderItem={renderItem}
        width={width - 40}
        height={160}
        loop={loop}
        autoPlay={autoPlay}
        scrollAnimationDuration={500}
        onSnapToItem={handleSnapToItem}
        defaultIndex={0}
        showPagination={showPagination}
      />
      
      <Text style={styles.description}>
        This carousel uses FlatList for native performance:
      </Text>
      <View style={styles.optimizationList}>
        <Text style={styles.optimizationItem}>• Native FlatList scrolling</Text>
        <Text style={styles.optimizationItem}>• Pagination and looping support</Text>
        <Text style={styles.optimizationItem}>• Item recycling for memory efficiency</Text>
        <Text style={styles.optimizationItem}>• Custom hook pattern for reusability</Text>
        <Text style={styles.optimizationItem}>• Optimized with memoization techniques</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 16,
    color: '#AAA',
    marginBottom: 12,
  },
  controlsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  controlButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  activeButton: {
    backgroundColor: '#16783A',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
  },
  itemContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 5,
  },
  itemImage: {
    width: '100%',
    height: 100,
  },
  itemContent: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#16783A',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 20,
  },
  optimizationList: {
    marginTop: 10,
  },
  optimizationItem: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 22,
  }
});

export default memo(CarouselDemo); 