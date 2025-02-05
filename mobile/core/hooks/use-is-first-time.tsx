// import { useMMKVBoolean } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';


// import { storage } from '../storage';

const IS_FIRST_TIME = 'IS_FIRST_TIME';

export const useIsFirstTime = async () => {
  const setIsFirstTime = () => {
    AsyncStorage.setItem(IS_FIRST_TIME, 'false');
  }
  // const [isFirstTime, setIsFirstTime] = useMMKVBoolean(IS_FIRST_TIME, storage);
  const isFirstTime = await AsyncStorage.getItem('IS_FIRST_TIME')
  if (isFirstTime === undefined) {
    return [true, setIsFirstTime] as const;
  }
  return [isFirstTime, setIsFirstTime] as const;
};
