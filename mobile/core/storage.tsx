// import { MMKV } from 'react-native-mmkv';
import AsyncStorage from "@react-native-async-storage/async-storage";

// export const storage = new MMKV();

export async function getItem<T>(key: string) {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : "";
}

export async function setItem<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string) {
  await AsyncStorage.removeItem(key);
}

const getFromLocalStorage = async () => {
  const token = await AsyncStorage.getItem("token");
  return token;
};
