import { View, Text, FlatList } from 'react-native'
import React from 'react'
import LiveCardTemp from '@/components/global/live-product-card/LiveCardTemp'

const SpotLight = () => {
    return (
        <View className='mt-[9px] w-[100%] bg-[#3A3A3A]   pb-[15.5px]'
        >
            <Text className='text-white text-[14px] font-LexendDecaBold px-[22px] pt-[12px]'>In the spotlight</Text>
            <View
                style={{
                    paddingHorizontal: 22
                }}
            >
                <FlatList
                    data={[1, 2, 3, 4, 5, 6]}
                    renderItem={(item) => (
                        <View className="w-1/2 p-2">
                            <LiveCardTemp 
                                item={item}
                            />
                        </View>
                    )}
                    keyExtractor={(item) => item.toString()}
                    numColumns={2}
                    contentContainerStyle="p-2"
                    columnWrapperStyle={{ justifyContent: 'space-between' }}
                />
            </View>

        </View>
    )
}

export default SpotLight
