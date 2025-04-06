import { getToken } from "@/store/features/auth/utils";
import { useToast } from '@/contexts/ToastContext';
import { createContext, useContext, useReducer } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LivestreamContext = createContext({});

export const LivestreamProvider = ({ children }) => {
  const { show } = useToast();
  const initialState = {
    activeLivestream: [],
    isLoading: false,
    activeStreamDetails: null,
    isDataReady: false,
  };

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case "SET_ACTIVE_LIVESTREAM":
        return { ...state, activeLivestream: action.payload };
      case "SET_IS_LOADING":
        return { ...state, isLoading: action.payload };
      case "SET_ACTIVE_STREAM_DETAILS":
        return { ...state, activeStreamDetails: action.payload };
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
      const token = await AsyncStorage.getItem("token");
      const userToken = JSON.parse(token);

      if (!userToken) {
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
        return response.data;
      }
    } catch (error) {
      console.error("Error joining stream:", error);
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
        }
      );

      if (response.status === 200) {
        console.log("Successfully left stream:", response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error leaving stream:", error);
      throw new Error(
        error?.response?.data?.message || "Failed to leave stream"
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
        process.env.EXPO_PUBLIC_API_URL + `api/buyer/follow/${sellerId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );
      if (response.status === 200) {
        console.log("Successfully followed seller through stream:", response.data);
        show({
          title: "Success",
          description: `You are now following ${sellerName}`,
          type: "success",
        });
        return response.data;
      }
    } catch (error) {
      console.error("Error following seller through stream:", error);
      throw new Error(
        error?.response?.data?.message || "Failed to follow seller through stream"
      );
    }
  }

  const unfollowSellerThroughStream = async (sellerId, sellerName) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userToken = JSON.parse(token);
      if (!userToken) {
        throw new Error("No authentication token found");
      }

      const response = await axios.delete(
        process.env.EXPO_PUBLIC_API_URL + `api/buyer/follow/${sellerId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );
      if (response.status === 200) {
        console.log("Successfully unfollowed seller through stream:", response.data);
        show({
          title: "Success",
          description: `You are now unfollowing ${sellerName}`,
          type: "success",
        });
        return response.data;
      }
    } catch (error) {
      console.error("Error unfollowing seller through stream:", error);
      throw new Error(
        error?.response?.data?.message || "Failed to unfollow seller through stream"
      );
    }
  }

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
        console.log("Successfully checked if seller is followed:", response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error checking if seller is followed:", error);
      throw new Error(
        error?.response?.data?.message || "Failed to check if seller is followed"
      );
    }
  }

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
        dispatch,
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
