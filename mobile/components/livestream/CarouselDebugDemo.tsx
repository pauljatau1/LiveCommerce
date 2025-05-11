import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView } from 'react-native';
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
];

// Create a log viewer component
const LogViewer = memo(({ logs }: { logs: string[] }) => (
  <ScrollView style={styles.logViewer}>
    {logs.map((log, index) => (
      <Text key={index} style={styles.logLine}>{log}</Text>
    ))}
  </ScrollView>
));

const CarouselDebugDemo = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [debugMode, setDebugMode] = useState(true);
  
  // Override console.log to capture logs
  React.useEffect(() => {
    const originalLog = console.log;
    
    console.log = (...args) => {
      originalLog(...args);
      
      // Only capture carousel logs
      const logStr = args.join(' ');
      if (logStr.includes('[Carousel')) {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${logStr}`]);
      }
    };
    
    return () => {
      console.log = originalLog;
    };
  }, []);
  
  // Memoized callback for carousel navigation
  const handleSnapToItem = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Memoized render function
  const renderItem = useCallback(({ item, index }: { item: DemoItem; index: number }) => (
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
  ), []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleDebugMode = useCallback(() => {
    setDebugMode(prev => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carousel Debug Demo</Text>
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.button, debugMode && styles.activeButton]} 
            onPress={toggleDebugMode}
          >
            <Text style={styles.buttonText}>
              {debugMode ? "Hide Debug UI" : "Show Debug UI"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={clearLogs}
          >
            <Text style={styles.buttonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.subtitle}>
        Item {currentIndex + 1} of {demoItems.length} | Log lines: {logs.length}
      </Text>
      
      <CustomCarousel<DemoItem>
        data={demoItems}
        renderItem={renderItem}
        width={width - 40}
        height={150}
        onSnapToItem={handleSnapToItem}
        defaultIndex={0}
        debug={debugMode}
      />
      
      <Text style={styles.logHeader}>
        Event Log (most recent first):
      </Text>
      
      <LogViewer logs={[...logs].reverse().slice(0, 50)} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 20,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeButton: {
    backgroundColor: '#16783A',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 12,
  },
  itemContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
  },
  itemImage: {
    width: '100%',
    height: 90,
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
  logHeader: {
    fontSize: 14,
    color: '#FFF',
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  logViewer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: 10,
  },
  logLine: {
    color: '#AAA',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default memo(CarouselDebugDemo); 