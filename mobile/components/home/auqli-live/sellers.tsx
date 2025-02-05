import { View, Text, FlatList } from 'react-native'
import React from 'react'
import SectionHeader from '@/components/global/section-header'
import SellersCard from '../../global/followers-card/followers-card'
import FollowCard from '../../global/followers-card/followers-card'

const Sellers = () => {
  return (
      <View className='pt-[15px] w-[100%]'>
          <SectionHeader title='Sellers to follow' btnText='View All'  />
          <FlatList
              data={[1, 2, 3, 4]}
              renderItem={({ item }) => (
                  <View className='space-x-4'>
                      <FollowCard item={item.toString()} data={[1,2,3,4]} />
                  </View>
              )}
              keyExtractor={item => item.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              className='pl-[22px]'
          />
      </View>
  )
}

export default Sellers
