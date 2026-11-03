import { View, Text, FlatList, Image } from 'react-native'
import React from 'react'
import SectionHeader from '@/components/global/section-header'
import { data, images } from '@/constants'

const WatchFriends = () => {
    return (
        <View className="w-[100%]">
            <SectionHeader title="Your Friends Are watching" />
            <View style={{
                paddingLeft: 22
            }}>
                <FlatList
                    data={data.watchCategories}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View className='w-[312px] h-[386px] mr-[8.43px]'>
                            <View className='flex-row items-center pb-[6px]  '>
                                <Image
                                    source={images.smiley_womanImage}
                                    resizeMode='cover'
                                    className=' rounded-[8px] border-[1.831px] border-[#94A3B1]'
                                />
                            </View>

                        </View>
                    )}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className='pt-[14px]'
                />
            </View>
        </View>
    )
}

export default WatchFriends
