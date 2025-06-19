import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import  GlassImage  from '@/app/(root)/livestream/components/GlassImage';

interface AnnouncementViewProps {
  announcement: {
    id: string;
    type: string;
    user: string;
    avatar?: any;
    content: string;
    timestamp: Date | string;
    data?: any;
  } | null;
  closeSheet: () => void;
}

const AnnouncementView = React.memo(({ announcement, closeSheet }: AnnouncementViewProps) => {
  if (!announcement) return null;
  
  // Convert timestamp to readable date/time
  const timestamp = announcement.timestamp instanceof Date 
    ? announcement.timestamp 
    : new Date(announcement.timestamp);
  const formattedTime = timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <ScrollView className="h-[100vh] py-4" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center mb-4">
        {announcement.avatar ? (
          <GlassImage
            source={typeof announcement.avatar === 'string'
              ? { uri: announcement.avatar }
              : announcement.avatar}
            containerClassName="w-12 h-12 rounded-full"
            imageClassName="w-full h-full rounded-full"
            glassClassName="w-full h-full rounded-full"
            placeholderColor="rgba(255, 255, 255, 0.1)"
            blurIntensity={20}
            tint="dark"
            showActivityIndicator={false}
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-[#16783A] items-center justify-center">
            <Text className="text-white font-bold text-lg">
              {announcement.user?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View className="ml-3">
          <View className="flex-row items-center w-[120px]">
            <Text numberOfLines={1} className="text-white text-base font-LexendDecaMedium">{announcement.user}</Text>
            <View className="ml-2 bg-[#16783A] px-2 py-0.5 rounded">
              <Text className="text-white text-xs font-bold">Host</Text>
            </View>
          </View>
          <Text className="text-gray-400 text-xs">{formattedTime}</Text>
        </View>
      </View>
      
      <View className="bg-[rgba(255,255,255,0.05)] px-4 py-5 rounded-lg">
        <Text className="text-white text-base leading-6">{announcement.content}</Text>
      </View>
    </ScrollView>
  );
});

export default AnnouncementView; 