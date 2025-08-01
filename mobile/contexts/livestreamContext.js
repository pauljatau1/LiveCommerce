import { getToken } from "@/store/features/auth/utils";
import { useToast } from "@/contexts/ToastContext";
import { createContext, useContext, useReducer } from "react";
import { useRouter } from "expo-router";
import { trackEvent } from "@/utils/analytics";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LivestreamContext = createContext({});

export const LivestreamProvider = ({ children }) => {
  const { show } = useToast();
  const router = useRouter();
  const initialState = {
    activeLivestream: [],
    isLoading: false,
    activeStreamDetails: null,
    isDataReady: false,
    isStreamEnded: false,
    isStreamScheduled: false,
    scheduledStreamDetails: null,
  };

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case "SET_ACTIVE_LIVESTREAM":
        return { ...state, activeLivestream: action.payload };
      case "SET_IS_LOADING":
        return { ...state, isLoading: action.payload };
      case "SET_ACTIVE_STREAM_DETAILS":
        return { ...state, activeStreamDetails: action.payload };
      case "SET_STREAM_ENDED":
        return { ...state, isStreamEnded: action.payload };
      case "SET_IS_DATA_READY":
        return { ...state, isDataReady: action.payload };
      case "RESET_STREAM_ENDED":
        return { ...state, isStreamEnded: false };
      case "SET_IS_STREAM_SCHEDULED":
        return {
          ...state,
          isStreamScheduled: action.isStreamScheduled,
          scheduledStreamDetails: action.scheduledStreamDetails,
        };
      default:
        return state;
    }
  }, initialState);

  const fetchAllActiveLiveStreams = async () => {
    try {
      dispatch({ type: "SET_IS_LOADING", payload: true });
      dispatch({ type: "SET_IS_DATA_READY", payload: false });
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/streams/active`,
      );
      if (response.status === 200) {
        dispatch({ type: "SET_ACTIVE_LIVESTREAM", payload: response.data });
        // console.log("active live streams", response.data);
        return response.data;
      }
    } catch (error) {
      console.log(error);
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
      dispatch({ type: "SET_IS_DATA_READY", payload: true });
    }
  };

  const joinStream = async (streamId) => {
    try {
      dispatch({ type: "SET_IS_LOADING", payload: true });
      // Reset the stream ended state when joining a new stream
      dispatch({ type: "SET_STREAM_ENDED", payload: false });
      dispatch({
        type: "SET_IS_STREAM_SCHEDULED",
        isStreamScheduled: false,
        scheduledStreamDetails: null,
      });
      const token = await AsyncStorage.getItem("token");
      const userToken = JSON.parse(token);

      if (!userToken) {
        router.push("/(root)/(auth)/sign-in");
        show({
          text1: "Error",
          text2: "You must be logged in to join a stream",
          type: "error",
          topPosition: 18,
        });
        throw new Error("No authentication token found");
      }

      console.log("Token being used:", userToken);

      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + `api/streams/${streamId}/join`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      if (response.status === 200) {
        dispatch({ type: "SET_ACTIVE_STREAM_DETAILS", payload: response.data });
        console.log("joined stream", response.data);
        // Track event for buyer joining stream
        try {
          const userData = await AsyncStorage.getItem("user");
          const user = JSON.parse(userData || "{}");

          trackEvent("buyer_joined_stream", {
            userId: user?._id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
            username: user?.username,
            sellerId: response.data.stream.seller._id,
            sellerName: response.data.stream.seller.storeName,
            streamId: response.data.stream._id,
            streamTitle: response.data.stream.title,
            streamDescription: response.data.stream.description,
            streamStartTime: response.data.stream.startTime,
            streamCategory: response.data.stream.category,
            streamSubCategory: response.data.stream.subCategory,
            timestamp: new Date().toISOString(),
          });
        } catch (trackError) {
          console.log("Customer.io stream join tracking error:", trackError);
        }
        return response.data;
      }
    } catch (error) {
      console.error("Error joining stream:", error);

      // Check if the error is a 404 error (stream ended)
      if (error?.response?.data?.message === "Stream has already ended") {
        console.log("Stream ended or not found, setting stream ended state");
        dispatch({ type: "SET_STREAM_ENDED", payload: true });
      } else if (
        error?.response?.data?.message === "Stream has not started yet"
      ) {
        console.log("Stream is not active, setting stream scheduled state");
        console.log("Scheduled stream details", error?.response?.data?.stream);
        dispatch({
          type: "SET_IS_STREAM_SCHEDULED",
          isStreamScheduled: true,
          scheduledStreamDetails: error?.response?.data?.stream,
        });
      }

      throw new Error(
        error?.response?.data?.message || "Failed to join stream",
      );
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  };

  const fetchActiveStreamDetails = async (streamId) => {
    try {
      dispatch({ type: "SET_IS_LOADING", payload: true });
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/streams/${streamId}`,
      );
      if (response.status === 200) {
        console.log("active stream details", response.data);
        dispatch({ type: "SET_ACTIVE_STREAM_DETAILS", payload: response.data });
        return response.data;
      }
    } catch (error) {
      console.log("error fetching active stream details", error.response);
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  };

  const leaveStream = async (streamId) => {
    try {
      dispatch({ type: "SET_IS_LOADING", payload: true });
      const token = await AsyncStorage.getItem("token");
      const userToken = JSON.parse(token);

      if (!userToken) {
        throw new Error("No authentication token found");
      }

      console.log("Leaving stream with ID:", streamId);

      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + `api/streams/${streamId}/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      if (response.status === 200) {
        console.log("Successfully left stream:", response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error leaving stream:", error);
      throw new Error(
        error?.response?.data?.message || "Failed to leave stream",
      );
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  };

  const followSellerThroughStream = async (sellerId, sellerName) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userToken = JSON.parse(token);
      if (!userToken) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + `api/v2/buyers/follow/${sellerId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );
      if (response.status === 200) {
        console.log(
          "Successfully followed seller through stream:",
          response.data,
        );
        show({
          text1: "Success",
          text2: `You are now following ${sellerName}`,
          type: "success",
          topPosition: 18,
        });
        return response.data.data;
      }
    } catch (error) {
      console.error("Error following seller through stream:", error);
      throw new Error(
        error?.response?.data?.message ||
          "Failed to follow seller through stream",
      );
    }
  };

  const unfollowSellerThroughStream = async (sellerId, sellerName) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userToken = JSON.parse(token);
      if (!userToken) {
        throw new Error("No authentication token found");
      }

      const response = await axios.delete(
        process.env.EXPO_PUBLIC_API_URL + `api/v2/buyers/follow/${sellerId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );
      if (response.status === 200) {
        console.log(
          "Successfully unfollowed seller through stream:",
          response.data,
        );
        show({
          text1: "Success",
          text2: `You unfollowed ${sellerName}`,
          type: "success",
          topPosition: 18,
        });
        return response.data.data;
      }
    } catch (error) {
      console.error("Error unfollowing seller through stream:", error);
      throw new Error(
        error?.response?.data?.message ||
          "Failed to unfollow seller through stream",
      );
    }
  };

  const checkIfSellerIsFollowedFromSellerProfile = async (sellerId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userToken = JSON.parse(token);
      if (!userToken) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/buyer/seller/${sellerId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );
      if (response.status === 200) {
        console.log(
          "Successfully checked if seller is followed:",
          response.data,
        );
        return response.data;
      }
    } catch (error) {
      console.error("Error checking if seller is followed:", error);
      throw new Error(
        error?.response?.data?.message ||
          "Failed to check if seller is followed",
      );
    }
  };

  const fetchStreamOrders = async (streamId) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userToken = JSON.parse(token);
      if (!userToken) {
        throw new Error("No authentication token found");
      }

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/streams/${streamId}/orders`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      if (response.status === 200) {
        console.log("Successfully fetched stream orders:", response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error fetching stream orders:", error);
      throw new Error(
        error?.response?.data?.message || "Failed to fetch stream orders",
      );
    }
  };

  return (
    <LivestreamContext.Provider
      value={{
        ...state,
        fetchAllActiveLiveStreams,
        fetchActiveStreamDetails,
        joinStream,
        leaveStream,
        followSellerThroughStream,
        unfollowSellerThroughStream,
        checkIfSellerIsFollowedFromSellerProfile,
        fetchStreamOrders,
        dispatch,
        isStreamEnded: state.isStreamEnded,
      }}
    >
      {children}
    </LivestreamContext.Provider>
  );
};

export const useLivestream = () => {
  const context = useContext(LivestreamContext);
  if (!context) {
    throw new Error("useLivestream must be used within a LivestreamProvider");
  }
  return context;
};
