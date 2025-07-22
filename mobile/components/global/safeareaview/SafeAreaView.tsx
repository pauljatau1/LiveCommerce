import { useCallback } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SafeAreaView = ({
  edges = ["top", "bottom", "left", "right"],
  children,
  style = {},
  ...props
}: any) => {
  const insets = useSafeAreaInsets();

  const generatePaddings = useCallback(() => {
    return {
      paddingTop: edges.includes("top")
        ? insets.top +
          (style.paddingTop || style.paddingVertical || style.padding || 0)
        : 0,
      paddingBottom: edges.includes("bottom")
        ? insets.bottom +
          (style.paddingBottom || style.paddingVertical || style.padding || 0)
        : 0,
      paddingLeft: edges.includes("left")
        ? insets.left +
          (style.paddingLeft || style.paddingHorizontal || style.padding || 0)
        : 0,
      paddingRight: edges.includes("right")
        ? insets.right +
          (style.paddingRight || style.paddingHorizontal || style.padding || 0)
        : 0,
    };
  }, [style, edges]);

  return (
    <View style={[style, generatePaddings()]} {...props}>
      {children}
    </View>
  );
};

export default SafeAreaView;
