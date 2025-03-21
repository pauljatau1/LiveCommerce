import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform, Alert } from "react-native";
import { useRouter } from "expo-router";

export interface PushNotificationState {
  notification?: Notifications.Notification;
  expoPushToken?: Notifications.ExpoPushToken;
}

export const usePushNotifications = (): PushNotificationState => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const router = useRouter();

  const registerForPushNotification = async () => {
    let token;

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Notification failed",
          "Permission for notification was denied",
        );
      }

      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      if (Platform.OS === "android") {
        Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 0, 250, 250],
          enableVibrate: true,
          lightColor: "#292929",
          bypassDnd: true,
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
          sound: "default",
          enableLights: true,
        });
      }

      return token;
    } else {
      console.log("Error, please run on an actual physical device");
    }
  };

  {
    /*const storeNotification = async (notificationMessage: Notifications.Notification) => {
        try {
            const token = await AsyncStorage.getItem("token");

                const response = await axios.post(`${base_url}/user/add-notification`, {
                    title: notificationMessage.request.content.title,
                    body: notificationMessage.request.content.body,
                }, {
                    headers: {
                        Authorization: token
                    }
                });

                if (response.status === 201) {
                    console.log("Notification stored successfully");
                } else {
                    console.log("Notification not stored");
                }
        } catch (error) {
            console.log('Failed to store notification:', error);
        }
    };*/
  }

  useEffect(() => {
    registerForPushNotification().then((token) => setExpoPushToken(token));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
        //storeNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        setNotification(response.notification);
        router.push(response.notification.request.content.data.url);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current!,
      );
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  // console.log('expoPushToken', expoPushToken);
  // console.log('notification', notification)

  return {
    expoPushToken,
    notification,
  };
};
