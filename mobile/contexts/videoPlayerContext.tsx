import { View, Text, Platform } from "react-native";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
} from "react";
import { createVideoPlayer, VideoPlayer } from "expo-video";

type Props = {
  children: ReactNode;
};

type ContextState = {
  players: VideoPlayer[] | null;
  key: string;
};

type ContextAction = {
  type: string;
  payload: {
    sources: string[];
    key: string;
  };
};

type ContextType = {
  players: VideoPlayer[] | null;
  createThreePlayers: (payload: ContextAction["payload"]) => void;
  clearPlayers: () => void;
};

const initialState = {
  players: null,
  key: "",
} as ContextState;

const VideoPlayerContext = createContext<ContextType>({
  players: null,
  createThreePlayers: (payload: any) => null,
  clearPlayers: () => null,
});

const createVideoPlayers = useCallback((sources: string[]) => {
  const bufferOptions = {
    preferredForwardBufferDuration: Platform.select({
      ios: 2, // Reduce from 5 to 3
      android: 3,
    }),
  };
  const player1 = createVideoPlayer(sources?.[0]);
  player1.loop = true;
  player1.bufferOptions = bufferOptions;
  const player2 = createVideoPlayer(sources?.[1]);
  player2.loop = true;
  player2.bufferOptions = bufferOptions;
  const player3 = createVideoPlayer(sources?.[2]);
  player3.loop = true;
  player3.bufferOptions = bufferOptions;
  return [player1, player2, player3];
}, []);

const handleCreatePlayers = useCallback(
  (state: ContextState, action: ContextAction) => {
    if (state?.players?.length && state.key !== action?.payload?.key) {
      state.players?.forEach((player) => {
        try {
          player.pause();
          player.replace(""); // Clear the source first
          player.release();
        } catch (e) {
          console.log("Error releasing player:", e);
        }
      });
      console.log("🚀🚀🚀 PLAYERS RELEASED");
    }
    const newPlayers = createVideoPlayers(action.payload?.sources);
    console.log("🚀🚀🚀 3 new players created");

    return newPlayers;
  },
  [],
);

const videoPlayerReducer = (state: ContextState, action: ContextAction) => {
  switch (action.type) {
    case "CREATE_PLAYERS":
      return {
        players: handleCreatePlayers(state, action),
        key: action.payload?.key,
      };
    case "CLEAR_PLAYERS":
      return { ...state, players: null };
    default:
      return state;
  }
};

export const VideoPlayerProvider = ({ children }: Props) => {
  const [playerPool, dispatch] = useReducer(videoPlayerReducer, initialState);

  const createThreePlayers = useCallback(
    (payload: ContextAction["payload"]) => {
      dispatch({ type: "CREATE_PLAYERS", payload });
    },
    [],
  );

  const clearPlayers = useCallback(() => {
    dispatch({ type: "CLEAR_PLAYERS", payload: { sources: [""], key: "" } });
  }, []);

  const videoPlayerProviderValue = useMemo(() => {
    return { players: playerPool.players, createThreePlayers, clearPlayers };
  }, [playerPool, createThreePlayers, clearPlayers]);
  return (
    <VideoPlayerContext.Provider value={videoPlayerProviderValue}>
      {children}
    </VideoPlayerContext.Provider>
  );
};

export const useCreateVideoPlayers = () => {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error(
      "useCreateVideoPlayers must be used within a VideoPlayerProvider",
    );
  }
  return context;
};
