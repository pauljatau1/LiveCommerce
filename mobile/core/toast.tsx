import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import React from "react";
import { View } from "react-native";
import { MessageOptions, showMessage } from "react-native-flash-message";

class Toast {
  error(message: string = "") {
    showMessage({
      message,
      type: "info",
      backgroundColor: "#F04438",
      duration: 3000,
      icon: "info",
    });
  }
  info(message: string = "") {
    showMessage({
      message,
      type: "info",
      backgroundColor: "#258FE6",
      duration: 3000,
      icon: "info",
    });
  }
  success(message: string = "") {
    showMessage({
      message,
      type: "success",
      backgroundColor: "#2FB01A",
      duration: 3000,
      icon: "success",
    });
  }
  custom(props: MessageOptions) {
    showMessage({
      ...props,
      titleStyle: {
        fontFamily: "LexendDeca",
      },
      textStyle: {
        fontFamily: "LexendDeca-Light",
      },
    });
  }

  customSuccess(props: MessageOptions) {
    showMessage({
      ...props,
      titleStyle: {
        fontFamily: "LexendDeca",
        letterSpacing: -0.22,
      },
      textStyle: {
        fontFamily: "LexendDeca-Light",
      },
      style: {
        backgroundColor: "#090D0B",
        alignItems: "center",
        gap: 10,
        borderRadius: 16,
        borderCurve: "continuous",
        boxShadow: "0 4px 4px 0 rgba(0, 0, 0, 0.25)",
      },
      icon: () => <FontAwesome6 name="circle-check" size={20} color="green" />,
      hideOnPress: true,
    });
  }
}

const toast = new Toast();

export { toast };
