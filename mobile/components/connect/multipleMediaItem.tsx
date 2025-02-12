import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Image } from "expo-image";
import { ResizeMode, Video } from "expo-av";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Octicons from "@expo/vector-icons/Octicons";

const { width, height } = Dimensions.get("window");

const multipleMediaItem = ({ items }: { items: any }) => {
  return (
    <View style={styles.multiMediaContainer}>
      <View style={styles.multiMediaItemLeft}>
        <MediaItem item={items[0]} />
      </View>
      <View style={styles.multiMediaItemRight}>
        <View style={styles.multiMediaItemTop}>
          <MediaItem item={items[1]} />
        </View>
        {items?.length > 2 && (
          <View style={styles.multiMediaItemDown}>
            <MediaItem item={items[2]} />
            {items?.length > 3 && (
              <View style={styles.more}>
                <Text style={styles.moreText}>+{items?.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const MediaItem = memo(({ item }: { item: any }) => {
  const videoRef = useRef<Video>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);

  const isVideo = useMemo(
    () => item?.public_id?.split("/")[1] === "videos",
    [],
  );

  const playPauseVideo = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pauseAsync();
        setPlaying(false);
      } else {
        videoRef.current?.playAsync();
        setPlaying(true);
      }
    }
  };

  const muteUnmuteVideo = () => {
    if (videoRef.current) {
      if (muted) {
        videoRef.current.setIsMutedAsync(false);
        setMuted(false);
      } else {
        videoRef.current?.setIsMutedAsync(true);
        setMuted(true);
      }
    }
  };

  const handlePlaybackStatusUpdate = useCallback(
    (status: any) => {
      if (status.didJustFinish) {
        setPlaying(false);
      }
    },
    [playing],
  );

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  if (isVideo) {
    return (
      <Pressable onPress={() => playPauseVideo()}>
        <Video
          ref={videoRef}
          source={{ uri: item.url }}
          style={[styles.mediaItem]}
          resizeMode={ResizeMode.COVER}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          isLooping
          shouldPlay={playing}
        />

        <Pressable style={styles.playVideo} onPress={() => playPauseVideo()}>
          {playing ? (
            <AntDesign name="pause" size={12} color="white" />
          ) : (
            <FontAwesome6 name="play" size={12} color="white" />
          )}
        </Pressable>

        <Pressable
          style={[styles.playVideo, { right: 8, left: "auto" }]}
          onPress={() => muteUnmuteVideo()}
        >
          {muted ? (
            <Octicons name="mute" size={12} color="white" />
          ) : (
            <Octicons name="unmute" size={12} color="white" />
          )}
        </Pressable>
      </Pressable>
    );
  }

  return (
    <Image
      source={{ uri: item?.url }}
      contentFit="cover"
      style={[styles.mediaItem]}
      cachePolicy="memory-disk"
    />
  );
});

const styles = StyleSheet.create({
  multiMediaContainer: {
    width: width - 32,
    height: 250,
    maxHeight: 250,
    position: "relative",
    backgroundColor: "#111",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  multiMediaItemLeft: {
    width: "100%",
    height: "100%",
    maxHeight: 250,
    // backgroundColor: "red",
    justifyContent: "center",
    flexDirection: "row",
    flexShrink: 1,
  },
  multiMediaItemRight: {
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
    flexShrink: 1,

    // backgroundColor: "blue",
    gap: 10,
  },
  multiMediaItemTop: {
    width: "100%",
    height: "100%",
    flexShrink: 1,
  },
  multiMediaItemDown: {
    width: "100%",
    height: "100%",
    flexShrink: 1,
  },
  multiMediaItem: {},
  mediaItem: {
    width: "100%",
    height: "100%",
    maxHeight: 250,
    borderRadius: 8,
  },
  more: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    maxHeight: 250,
    borderRadius: 8,
    backgroundColor: "rgba(24,24,24,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    fontSize: 24,
    color: "white",
  },
  playVideo: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: 30,
    height: 30,
    borderRadius: 30,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});

export default memo(multipleMediaItem);
