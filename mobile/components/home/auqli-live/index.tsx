import { View, Text } from 'react-native'
import React from 'react'
import PopularCard from './popular-card'
import SpotLight from './spot-light'
import Sellers from './sellers'
import Favourite from './favourite'
import WatchCategory from './watch-category'
import WatchFriends from './watching-friends'
import ExploreMoreSection from './expore-more'

const AuqliLive = () => {
  return (
    <View className='w-full'>
          <PopularCard  />
          <SpotLight />
          <Sellers />
          <Favourite />
          <WatchCategory />
          <WatchFriends />
          <ExploreMoreSection />
    </View>
  )
}

export default AuqliLive
