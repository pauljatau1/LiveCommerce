import { View, Text, Dimensions, SafeAreaView, Animated, useWindowDimensions, FlatList } from "react-native";
import React, { useState, useRef } from "react";
import { TabView, TabBar } from 'react-native-tab-view';
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";

const HEADER_HEIGHT = 200;
const MAIN_HEADER_HEIGHT = 60;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const CollapsibleHeader = ({ scrollY }) => {
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View 
      style={{ 
        height: HEADER_HEIGHT,
        position: 'absolute',
        top: MAIN_HEADER_HEIGHT,
        left: 0,
        right: 0,
        transform: [{ translateY: headerTranslateY }],
        backgroundColor: '#121212',
        zIndex: 1,
      }}
    >
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 24 }}>Profile Header</Text>
        <Text style={{ color: 'white', marginTop: 10 }}>This header will scroll away</Text>
      </View>
    </Animated.View>
  );
};

const ListItem = ({ index }) => (
  <View style={{ marginVertical: 10, padding: 15, backgroundColor: '#2a2a2a', borderRadius: 8, marginHorizontal: 20 }}>
    <Text style={{ color: 'white' }}>Item {index + 1}</Text>
    <Text style={{ color: '#888', marginTop: 5 }}>Additional content for scrolling</Text>
  </View>
);

const TabScene = ({ route, scrollY }) => {
  const data = Array.from({ length: 50 }, (_, index) => ({ id: String(index) }));

  const renderItem = ({ item, index }) => (
    <ListItem index={index} />
  );

  const ListHeaderComponent = () => (
    <View style={{ padding: 20 }}>
      <Text style={{ color: 'white', fontSize: 18 }}>{route.title} Content</Text>
    </View>
  );

  return (
    <AnimatedFlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={{
        paddingTop: HEADER_HEIGHT + MAIN_HEADER_HEIGHT,
        minHeight: Dimensions.get('window').height + HEADER_HEIGHT,
      }}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
    />
  );
};

const Profile = () => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Tab A' },
    { key: 'second', title: 'Tab B' },
  ]);

  const scrollY = useRef(new Animated.Value(0)).current;

  const renderScene = ({ route }) => (
    <TabScene route={route} scrollY={scrollY} />
  );

  const renderTabBar = props => (
    <Animated.View
      style={{
        zIndex: 2,
        position: 'absolute',
        top: MAIN_HEADER_HEIGHT,
        left: 0,
        right: 0,
        transform: [{
          translateY: scrollY.interpolate({
            inputRange: [0, HEADER_HEIGHT],
            outputRange: [HEADER_HEIGHT, 0],
            extrapolate: 'clamp',
          })
        }]
      }}
    >
      <TabBar
        {...props}
        style={{ backgroundColor: '#121212' }}
        indicatorStyle={{ backgroundColor: 'white' }}
        activeColor="white"
        inactiveColor="gray"
      />
    </Animated.View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Fixed Main Header */}
      <View style={{ 
        height: MAIN_HEADER_HEIGHT, 
        padding: 20, 
        backgroundColor: '#121212',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        justifyContent: 'center',
      }}>
        <Text style={{ color: 'white' }}>Main Header</Text>
      </View>

      <View style={{ flex: 1 }}>
        {/* Collapsible Header */}
        <CollapsibleHeader scrollY={scrollY} />

        {/* Tab View */}
        <TabView
          style={{ marginTop: MAIN_HEADER_HEIGHT }}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
        />
      </View>
    </SafeAreaView>
  );
};

export default Profile;