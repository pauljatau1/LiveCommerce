import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";

export const initializeSocket = (token) => {
  const socket = io(process.env.EXPO_PUBLIC_API_URL, {
    transports: ["websocket"],
    auth: {
      token: token,
    },
  });

  return socket;
};

// export const socket = io("https://03ec-102-216-201-44.ngrok-free.app", {
//   autoConnect: false,
//   transports: ["websocket"],
// });
