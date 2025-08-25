import useInitializeAuthState from "@/hooks/useInitializeAuthState";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, Stack } from "expo-router";
import { TouchableOpacity, View, Text } from "react-native";

const Layout = () => {
  useInitializeAuthState();
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(categories)" options={{ headerShown: false }} />

      <Stack.Screen
        name="s/[id]"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        getId={({ params }) => Math.random().toString(36).substring(7)}
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
        name="reviews/details"
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
        name="createReview/sellerReview"
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
        name="orders/returns"
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
        name="(modals)/popup"
        options={{
          presentation: "transparentModal",
          animation: "slide_from_bottom",
          animationDuration: 150,
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
        name="catalog/subCategoriesCatalog"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="catalog/subCategoriesStreams"
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
      <Stack.Screen
        name="editProfile/index"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profileStats/stats"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="livestream/feed"
        options={{
          headerShown: false,
        }}
      />
      {/* <Stack.Screen
        name="livestream/livestreamStudio"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="livestream/liveAuctionStudio"
        options={{
          headerShown: false,
        }}
      /> */}
      <Stack.Screen
        name="sellerProfile/index"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="notifications/index"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/index"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/activityStatus"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/blockedUsers"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/addresses"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/updateCategories"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/communityActivity"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/liveStreamAlerts"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/newMessages"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/orderUpdates"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/promotionSales"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings/support-chat"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="wallet/index"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="wallet/transactions"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="singleBlip/index"
        options={{
          headerTitle: "",
          headerShadowVisible: false,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="singleBlip/feed"
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
