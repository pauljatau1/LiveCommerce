import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  visible: boolean;
  type?: ToastType;
  text1?: string;
  text2?: string;
  onHide?: () => void;
  duration?: number;
  topPosition?: number;
}

const CustomToast = ({
  visible,
  type = "success",
  text1,
  text2,
  onHide,
  duration = 3000,
  topPosition = 48,
}: ToastProps) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "info":
        return "information-circle";
      case "warning":
        return "warning";
      default:
        return "checkmark-circle";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "#16783A";
      case "error":
        return "#FF453A";
      case "info":
        return "#16783A";
      case "warning":
        return "#FF9500";
      default:
        return "#16783A";
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          paddingTop:
            Platform.OS == "android" ? topPosition : topPosition + insets.top,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={getIconName()} size={24} color={getIconColor()} />
        <View style={styles.textContainer}>
          {text1 && <Text style={styles.text1}>{text1}</Text>}
          {text2 && <Text style={styles.text2}>{text2}</Text>}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingHorizontal: 16,
  },
  content: {
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  text2: {
    color: "#8E8E93",
    fontSize: 14,
  },
});

export default CustomToast;
