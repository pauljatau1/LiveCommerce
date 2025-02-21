import { View, Text } from 'react-native'
import React from 'react'
import PopularCard from './popular-card'
import SpotLight from './spot-light'
import Sellers from './sellers'
import Favourite from './favourite'
import WatchCategory from './watch-category'
import WatchFriends from './watching-friends'
import ExploreMoreSection from './expore-more'
import { useLivestream } from '../../../contexts/livestreamContext'
import { useEffect, useState } from 'react'

const AuqliLive = () => {
  const { isDataReady, activeLivestream, fetchAllActiveLiveStreams } = useLivestream();
  const [filteredActiveLivestream, setFilteredActiveLivestream] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetchAllActiveLiveStreams();
      setFilteredActiveLivestream(response);
    }
    
    fetchData();
  }, []);

  return (
    <View className='w-full pt-3'>
      {filteredActiveLivestream.length > 0 && <PopularCard />}
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
