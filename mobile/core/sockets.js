import { io } from "socket.io-client";

export const socket = io("https://03ec-102-216-201-44.ngrok-free.app", {
  autoConnect: false,
  transports: ["websocket"],
});
