import type { Middleware } from "@reduxjs/toolkit";
import { isRejectedWithValue } from "@reduxjs/toolkit";
import { initializeSocket } from "@/core/sockets";
import { products } from "@/services/products";

import { signOut } from "./features/auth/authSlice";
import { useSelector } from "react-redux";
import { RootState } from ".";
import { getToken } from "./features/auth/utils";

export const rtkQueryErrorLogger: Middleware =
  ({ dispatch }) =>
  (next) =>
  async (action) => {
    if (isRejectedWithValue(action)) {
      if ((action.payload as { status: number })?.status === 602) {
        dispatch(signOut());
      }
    }

    return next(action);
  };

export const socketMiddleware: Middleware =
  ({ dispatch }) =>
  (next) =>
  async (action) => {
    const token = await getToken();
    const socket = initializeSocket(token);
    socket.connect();

    // Listen for WebSocket events
    if (action.type === "socket/connect") {
      socket.on("connect", () => {
        console.log("Connected to WebSocket");
        dispatch({ type: "socket/joinAuction" });
      });

      socket.on("auction_lists_data", (data) => {
        console.log("Received auction update:", data);

        dispatch(
          products.util.updateQueryData(
            "getAllAuctionProducts",
            { page: 1 },
            (draft) => {
              const auctionIndex = draft.products.findIndex(
                (auction) => auction._id === data._id,
              );
              if (auctionIndex !== -1) {
                draft.products[auctionIndex] = {
                  ...draft.products[auctionIndex],
                  auction: data,
                };
              }
            },
          ),
        );
      });

      socket.on("auction_list_update", (data) => {
        console.log("Received auction update:", data);

        dispatch(
          products.util.updateQueryData(
            "getAllAuctionProducts",
            { page: 1 },
            (draft) => {
              const auctionIndex = draft.products.findIndex(
                (auction) => auction._id === data._id,
              );
              if (auctionIndex !== -1) {
                draft.products[auctionIndex] = {
                  ...draft.products[auctionIndex],
                  auction: data,
                };
              }
            },
          ),
        );
      });

      socket.on("auction_error", (error) => {
        console.log("Received auction error:", error);
      });
    }

    // Emit WebSocket events
    if (action.type === "socket/joinAuction") {
      console.log("joining auction");

      socket.emit("join_auction_lists", {});
    }

    if (action.type === "socket/leaveAuction") {
      socket.emit("leave_auction_lists", {});
    }

    if (action.type === "socket/disconnect") {
      socket.off("auction_lists_data");
      socket.off("auction_error");
      socket.disconnect();
    }

    return next(action);
  };
