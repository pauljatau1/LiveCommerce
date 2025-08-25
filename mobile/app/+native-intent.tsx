import { handleDeepLink } from "@/utils/handleDeepLinks";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import DeviceInfo from "react-native-device-info";

export async function redirectSystemPath({ path, initial }:any) {
    console.log("inside native intent ",{
        initial,
        path 
    });
    
  try {
      let url = new URL(path, 'myapp://app.auqli.live')
      const referrer = DeviceInfo.getInstallReferrerSync();
      const isFirstTime = await AsyncStorage.getItem('isFirstTime')

      if(initial && referrer?.includes("deep_link") && !isFirstTime && Platform.OS === "android")
      {
        const rawParams = decodeURIComponent(referrer)
        const deepLink = rawParams?.split('deep_link=')[1]?.split('&')[0]
        url = new URL(decodeURIComponent(deepLink),'myapp://app.auqli.live')
      }

      if ((url.hostname === 'app.auqli.live' || url.hostname === 'app.staging.auqli.live') && url.pathname.includes('/products/')) {
        return handleDeepLink(url.pathname)
      }
      console.log({path,host:url.hostname});
      
      if(url.hostname)
      {
        return path.split(url.hostname)?.[1]
      }
      return path;
  } catch {
    return '/blips';
  }
}