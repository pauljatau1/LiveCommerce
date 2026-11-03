import { useIsFocused } from "@react-navigation/native";
import { useColorScheme } from "nativewind";
import * as React from "react";
// import { StatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";

type Props = React.ComponentProps<typeof StatusBar>;
export const FocusAwareStatusBar = (props: any) => {
  const isFocused = useIsFocused();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const barStyle = isDark ? "dark" : "light";

  return isFocused ? (
    <StatusBar
      style={props?.barStyle?.split("-")[0]}
      {...props}
      backgroundColor=""
    />
  ) : // <StatusBar translucent barStyle={barStyle} {...props} />
  null;
};
