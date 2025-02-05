import { View, Text, Image } from 'react-native'
import React from 'react'

const WatchCategoryCard = ({ item }: any) => {
    return (
        <View className="rounded-[4.15px] overflow-visible relative">
            <Image
                source={item.image}
                className=" rounded-[4.15px] w-full  h-full"
                resizeMode="cover"
            />
            <Text className="text-left font-LexendDecaMedium text-white absolute bottom-8 text-base px-[8.41px]">
                {item.title}
            </Text>
        </View>
    )
}

export default WatchCategoryCard
