import React, { memo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const reactions = [
  { id: "like", emoji: "👍", label: "Like" },
  { id: "love", emoji: "❤️", label: "Love" },
  { id: "haha", emoji: "😂", label: "Haha" },
  { id: "wow", emoji: "😮", label: "Wow" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "angry", emoji: "😡", label: "Angry" },
];

interface Props {
  reactionCount: any;
  handleReactions: (reaction: any) => any;
}
const ReactionPicker = ({ reactionCount, handleReactions }: Props) => {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const bubbleVisible = useSharedValue(false);
  const bubblePosition = useSharedValue(-100); // Start offscreen

  // Animated styles for the bubble
  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bubblePosition.value - 40 }],
    opacity: bubbleVisible.value ? withTiming(1) : withTiming(0),
  }));

  // Handle long press to show the bubble
  const longPressGesture = Gesture.LongPress().onStart(() => {
    bubbleVisible.value = true;
    bubblePosition.value = withSpring(-120, { damping: 10, stiffness: 100 }); // Slide up
  });
  // .onEnd(() => {
  //   bubbleVisible.value = false;
  //   bubblePosition.value = withTiming(-100);
  // });

  // Handle reaction selection
  const handleReactionSelect = (reaction: any) => {
    console.log("picking");

    setSelectedReaction(reaction);
    bubbleVisible.value = false;
    bubblePosition.value = withTiming(-100); // Slide down
  };

  return (
    <View style={styles.container}>
      {/* Reaction Button */}
      <GestureDetector gesture={longPressGesture}>
        <TouchableOpacity style={styles.reactionButton}>
          <Text style={styles.reactionButtonText}>
            {selectedReaction ? selectedReaction.emoji : "Like"}
          </Text>
        </TouchableOpacity>
      </GestureDetector>

      {/* Reaction Bubble */}
      <Animated.View style={[styles.bubble, bubbleStyle]}>
        {reactions.map((reaction) => (
          <TouchableOpacity
            key={reaction.id}
            onPress={() => handleReactionSelect(reaction)}
            style={styles.reactionItem}
          >
            <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  reactionButton: {
    padding: 10,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
  },
  reactionButtonText: {
    fontSize: 16,
  },
  bubble: {
    position: "absolute",
    flexDirection: "row",
    backgroundColor: "white",
    flexGrow: 1,
    borderRadius: 25,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    bottom: -120, // Start below the button
  },
  reactionItem: {
    marginHorizontal: 5,
  },
  reactionEmoji: {
    fontSize: 24,
  },
});

export default memo(ReactionPicker);
