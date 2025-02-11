import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import { TouchableOpacity, View, Text } from "react-native";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(categories)" options={{ headerShown: false }} />
      <Stack.Screen
        name="product/[id]"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reviews/[id]"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="createReview/[id]"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="cart/cart"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="checkout/checkout"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="checkout/[id]"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="orders/orders"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="orders/[id]"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="addresses/addAddress"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="createPosts/createPost"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="(modals)/search"
        options={{
          // presentation: "fullScreenModal",
          animation: "fade",
          animationDuration: 300,
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="catalog/[id]"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="catalog/moreProducts"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="messageRoom/[id]"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="connectMore/MorePostInfo"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default Layout;
