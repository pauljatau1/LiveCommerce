import { View, Text, FlatList } from 'react-native'
import React from 'react'
import LiveProductCardTemplate from '@/components/global/live-product-card/LiveProductCardTemplate'

const SpotLight = () => {
    return (
        <View className='mt-[9px] w-[100%] bg-[#3A3A3A] mx-[24px]  pb-[15.5px]'
        >
            <Text className='text-white text-[14px] font-LexendDecaBold px-[22px] pt-[12px]'>In the spotlight</Text>
            <View
                style={{
                    paddingHorizontal: 22
                }}
            >
                <FlatList
                    data={[1, 2, 3, 4, 5, 6, 7]}
                    renderItem={(item) => (

                        <LiveProductCardTemplate {...item} showBtn={false} />
                    )}
                    keyExtractor={item => item.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className='pt-[14px]'
                    pagingEnabled

                />
            </View>

        </View>
    )
}

export default SpotLight
