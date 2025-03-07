import { View, Text, TouchableOpacity, Animated, Dimensions, Image } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AllPostsList from "@/components/profile/myPostsList";

const { height, width } = Dimensions.get("window");

const HEADER_HEIGHT = 60;  // Fixed header height
const PROFILE_SECTION_HEIGHT = 200;  // Profile section height
const TAB_HEIGHT = 50;  // Tab header height

const Profile = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const scrollY = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  
  // Transform values for sticky headers
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, PROFILE_SECTION_HEIGHT],
    outputRange: [0, -PROFILE_SECTION_HEIGHT],
    extrapolate: 'clamp'
  });

  const tabBarTranslateY = scrollY.interpolate({
    inputRange: [0, PROFILE_SECTION_HEIGHT],
    outputRange: [0, HEADER_HEIGHT],
    extrapolate: 'clamp'
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      {/* Fixed Header */}
      <Animated.View 
        style={{
          height: HEADER_HEIGHT,
          backgroundColor: '#121212',
          borderBottomWidth: 1,
          borderBottomColor: '#333',
          justifyContent: 'center',
          zIndex: 100,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        <Text style={{ color: 'white', fontSize: 18, textAlign: 'center' }}>
          Profile
        </Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        style={{ flex: 1, marginTop: HEADER_HEIGHT }}
      >
        {/* Profile Section */}
        <Animated.View
          style={{
            height: PROFILE_SECTION_HEIGHT,
            backgroundColor: '#121212',
            padding: 20,
            transform: [{ translateY: headerTranslateY }]
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{ uri: '/api/placeholder/100/100' }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
            <View style={{ marginLeft: 20 }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>
                John Doe
              </Text>
              <Text style={{ color: '#666', marginTop: 5 }}>
                @johndoe
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-around' }}>
            <View>
              <Text style={{ color: 'white', fontSize: 18, textAlign: 'center' }}>250</Text>
              <Text style={{ color: '#666' }}>Posts</Text>
            </View>
            <View>
              <Text style={{ color: 'white', fontSize: 18, textAlign: 'center' }}>10.5k</Text>
              <Text style={{ color: '#666' }}>Followers</Text>
            </View>
            <View>
              <Text style={{ color: 'white', fontSize: 18, textAlign: 'center' }}>1.2k</Text>
              <Text style={{ color: '#666' }}>Following</Text>
            </View>
          </View>
        </Animated.View>

        {/* Sticky Tab Header */}
        <Animated.View
          style={{
            height: TAB_HEIGHT,
            backgroundColor: '#121212',
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: '#333',
            transform: [{ translateY: tabBarTranslateY }],
            zIndex: 99,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'posts' ? '#16783A' : 'transparent'
            }}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={{ color: activeTab === 'posts' ? '#16783A' : 'white' }}>
              Posts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'favorites' ? '#16783A' : 'transparent'
            }}
            onPress={() => setActiveTab('favorites')}
          >
            <Text style={{ color: activeTab === 'favorites' ? '#16783A' : 'white' }}>
              Favorites
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Content Section */}
        <View style={{ minHeight: height - HEADER_HEIGHT }}>
          {activeTab === 'posts' ? (
            <AllPostsList
            scrollEnabled={false}
              listRef={listRef}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
            />
          ) : (
            <View>
              <Text className="text-white">Favorites</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default Profile;