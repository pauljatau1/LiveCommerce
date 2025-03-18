import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { router, useGlobalSearchParams } from "expo-router";
import { useGetSingleProductQuery } from "@/services/products";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import Entypo from "@expo/vector-icons/Entypo";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Pressable, TextInput } from "react-native-gesture-handler";
import axios from "axios";
import SectionHeader from "@/components/global/section-header";
import ProductCard from "@/components/global/product-card";
import ReviewCard from "@/components/reviews";
import BottomSheet from "@/components/global/bottom-sheet";
import Carousel from "react-native-reanimated-carousel";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "@/core/toast";
import moment from "moment";
import { useIsFocused } from "@react-navigation/native";
import { formatNumber, getProductSpecifications } from "@/helpers/helpers";
import { getToken, getUser, setToken } from "@/store/features/auth/utils";
import AuthSheet from "@/components/auth/authSheet";
import CheckoutNow from "@/components/blips/checkoutNow";
import { initializeSocket } from "@/core/sockets";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import AuctionRulesSheet from "@/components/product/auctionRulesSheet";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

const { width, height } = Dimensions.get("window");

const ProductDescription = () => {
  const token = useSelector((state: RootState) => state.authState.token);
  const userLocal = useSelector((state: RootState) => state.authState.user);
  const socket = initializeSocket(token);
  socket.connect();
  const isFocused = useIsFocused();
  const scrollViewRef = useRef<ScrollView>(null);
  const { id } = useGlobalSearchParams();
  const [productDetails, setProductDetails] = useState<any>({});
  const {
    data: product,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useGetSingleProductQuery(id);
  const [sellerInfo, setSellerInfo] = useState<any>({});
  const [isReviewDropDownShow, setIsReviewDropDownShow] = useState(false);
  const [isShippingDropDownShow, setIsShippingDropDownShow] = useState(false);
  const [isBuyerProtectionShow, setIsBuyerProtectionShow] = useState(false);
  const [isProductDetailsShow, setIsProductDetailsShow] = useState(false);
  const [isProductSpecsShow, setIsProductSpecsShow] = useState(false);
  const [moreProductsData, setMoreProductsData] = useState<any>([]);
  const [similarProductsData, setSimilarProductsData] = useState<any>([]);
  const [similarProductsLoading, setSimilarProductsLoading] = useState<any>([]);
  const [isMoreProductsLoading, setIsMoreProductsLoading] =
    useState<boolean>(true);
  const [productReviews, setProductReviews] = useState<any>([]);
  const [isProductReviewsLoading, setIsProductReviewsLoading] =
    useState<boolean>(true);
  const [showCartSheet, setShowCartSheet] = useState<boolean>(false);
  const [showAddedToCartSheet, setShowAddedToCartSheet] =
    useState<boolean>(false);
  const [cartNumber, setCartNumber] = useState<number>(0);
  const [cartData, setCartData] = useState<any[]>([]);
  const [productSpecifications, setProductSpecifications] = useState<{}>({});
  const [user, setUser] = useState<any>(null);
  const [userToken, setUserToken] = useState<string>("");
  const [conversations, setConversations] = useState<any[]>([]);
  const [showAuthSheet, setShowAuthSheet] = useState<boolean>(false);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [auctionData, setAuctionData] = useState<any>();
  const [showRules, setShowRules] = useState<boolean>(false);
  const [shippingFee, setShippingFee] = useState<any>();

  const handleCloseRules = useCallback(() => {
    setShowRules(false);
  }, []);

  const getUserInfo = async () => {
    const token = await getToken();
    if (!token) {
      return setShowAuthSheet(true);
    }
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + `api/buyer/profile`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setUser(response.data);
      setToken(token);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const getSellerInfo = async (sellerId: string) => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/public/sellers/" + sellerId,
      );
      setSellerInfo(response.data);
    } catch (e) {
      console.log(e);
    }
  };

  const getShippingFee = async () => {
    const payload = [
      {
        pickUpState:
          sellerInfo?.warehouseDetails?.state ||
          sellerInfo?.warehouseDetails?.address?.state ||
          sellerInfo?.warehouse?.address?.state ||
          sellerInfo?.contactInformation?.sellerAddress?.state ||
          sellerInfo?.addresses?.sellerAddress?.state ||
          sellerInfo?.addresses?.warehouseAddress?.state,
        weight: productDetails?.weight,
        sellerId: sellerInfo?._id,
      },
    ];

    console.log({
      state: user?.shippingAddresses[0]?.state,
      pickupLocations: payload,
    });

    try {
      const token = await getToken();
      const response = await axios.post(
        process.env.EXPO_PUBLIC_API_URL + "api/order/delivery-cost",
        {
          state: user?.shippingAddresses[0]?.state,
          pickupLocations: payload,
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setShippingFee(response.data?.totalCost);
    } catch (e) {
      console.log("error fetching delivery fee ", e);
    }
  };

  const handleGetConversations = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/conversations",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      setConversations(response.data.conversations);
    } catch (e) {
      console.log("unable to get conversations in product details page", e);
    }
  };

  const getMoreProductsData = async (sellerId: string) => {
    try {
      setIsMoreProductsLoading(true);
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          "api/products/seller/" +
          sellerId +
          "?page=1&limit=10",
      );
      setMoreProductsData(
        response.data.products.filter((item: any) => item._id !== id),
      );
    } catch (e) {
      console.log(e);
    } finally {
      setIsMoreProductsLoading(false);
    }
  };

  const getSimilarProductsData = async () => {
    try {
      setSimilarProductsLoading(true);
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/all/?category=${productDetails.category}&limit=10`,
      );
      setSimilarProductsData(
        response.data.data.products.filter((item: any) => item._id !== id),
      );
    } catch (e) {
      console.log(e);
    } finally {
      setSimilarProductsLoading(false);
    }
  };

  const getProductReviews = async () => {
    try {
      setIsProductReviewsLoading(false);

      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL +
          `api/products/${id}/reviews?page=1&limit=5`,
      );

      if (response.status == 200) {
        setProductReviews(response.data.reviews);
      }
    } catch (e: any) {
      if (e.response) {
        console.log("error returning product reviews", e.response.data);
      }
    } finally {
      setIsProductReviewsLoading(false);
    }
  };

  const handleAddToCart = async (cartItem: any) => {
    console.log("got here");

    try {
      const cartItems = await AsyncStorage.getItem("cart");

      if (cartItems) {
        const cart = JSON.parse(cartItems);
        const item = cart.find((item: any) => item._id === cartItem._id);
        if (item) {
          return toast.info("Item already in cart");
        }
        const newCart = [...cart, cartItem];
        await AsyncStorage.setItem("cart", JSON.stringify(newCart));
        setShowCartSheet(false);
        setShowAddedToCartSheet(true);
        setCartNumber(newCart.length);
      } else {
        await AsyncStorage.setItem("cart", JSON.stringify([cartItem]));
        setShowCartSheet(false);
        setShowAddedToCartSheet(true);
        setCartNumber(1);
      }
    } catch (e) {
      console.log(e);
      toast.error("error adding item to cart");
    }
  };

  const constructSpecifications = () => {
    const specs = getProductSpecifications(
      productDetails!,
      productDetails?.category?.toLowerCase(),
    );
    setProductSpecifications(specs);
  };

  const formattedStoreName = useMemo(() => {
    return (
      sellerInfo?.storeName ||
      sellerInfo?.personalInfo?.firstName +
        " " +
        sellerInfo?.personalInfo?.lastName ||
      sellerInfo?.businessInfo?.businessName
    );
  }, [sellerInfo]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to auctions");
    });

    return () => {
      socket.off("connect");
    };
  }, []);

  useEffect(() => {
    if (productDetails?._id) {
      socket.emit("join_auction", productDetails?._id);

      socket.on("bid_error", (error) => {
        console.log("Bid error:", error);
      });

      socket.on("auction_data", (data) => {
        setAuctionData(data);
        // console.log("listening to auction data ", data);
      });

      socket.on("bid_update", (data) => {
        setAuctionData(data);
        console.log("gotten bid update", data);
      });

      socket.on("bid_placed", (data) => {
        console.log("Bid successfully placed:", data);
      });

      socket.on("auction_ended", (data) => {
        // Handle auction end
      });
      return () => {
        console.log("leaving");

        socket.emit("leave_auction", productDetails?._id);
        socket.off("auction_data");
        socket.off("bid_update");
        socket.off("auction_timer_update");
        socket.off("auction_ended");
        socket.off("bid_placed");
        socket.off("bid_error");
      };
    }
  }, [productDetails, id]);

  useEffect(() => {
    // refetch();
    getUserInfo();
  }, []);

  useEffect(() => {
    setProductDetails(product);
    if (product?.auction) {
      setAuctionData(product?.auction);
    }
  }, [id, product]);

  useEffect(() => {
    if (isFocused) {
      async function getCartNumber() {
        const cart = await AsyncStorage.getItem("cart");
        if (cart) {
          const cartItems = JSON.parse(cart);
          return setCartNumber(cartItems.length);
        }
        return setCartNumber(0);
      }
      getCartNumber();
      handleGetConversations();
    }
  }, [isFocused]);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });

    if (productDetails?.seller?._id) {
      getSellerInfo(productDetails.seller._id);
      getMoreProductsData(productDetails.seller._id);
      getSimilarProductsData();
      getProductReviews();
    }
    if (productDetails) {
      constructSpecifications();
    }
  }, [productDetails]);

  useEffect(() => {
    if (user?.shippingAddresses?.length > 0 && sellerInfo?._id) {
      console.log("starting shipping");
      console.log(user?.shippingAddresses?.length);
      console.log(sellerInfo?._id);

      getShippingFee();
    }
  }, [user, sellerInfo]);

  useEffect(() => {
    if (shippingFee && productDetails?.status == "offline_auction") {
      setShowRules(shippingFee);
    }
  }, [shippingFee]);

  //auction functions

  const placeBid = (amount: number) => {
    if (!user?.wallet?.availableBalance && !shippingFee) {
      return toast.error("Unable to place bid . Please try again");
    }
    if (
      (user?.wallet?.availableBalance || user?.wallet?.balance) + shippingFee <
      amount + 500
    ) {
      return toast.info("insufficient wallet balance");
    }

    if (user?.shippingAddresses?.length < 1) {
      return toast.info("Please add a correct address to bid");
    }

    socket.emit("place_bid", {
      productId: productDetails?._id,
      amount: amount + 500,
    });
    console.log("placedBid ", amount);
  };

  const renderContent = (row: any[]) => {
    return (
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="space-x-4 gap-[15px] space-y-4 mr-[4px] mb-[5.54px]"
      >
        {row.map((item) => (
          <ProductCard
            key={item._id}
            id={item._id}
            title={item.name}
            price={item.price}
            category={item.category}
            sellerName={
              item.seller?.storeInfo?.storeName || sellerInfo.storeName
            }
            imageUrl={item.images}
            sellerRating={item.stats?.averageRating}
            moreDetails={item}
          />
        ))}
      </ScrollView>
    );
  };

  const formatDate = (date: string) => {
    let rawDate = moment(date);
    const formattedDate = "Joined " + rawDate.format("MMMM YYYY");
    return formattedDate;
  };

  const renderSpecifications = () => {
    return (
      <View
        style={{
          paddingHorizontal: 61,
          paddingVertical: 10,
          backgroundColor: "#000",
          borderTopWidth: 1,
          borderTopColor: "rgba(159, 159, 159, 0.23)",
          gap: 10,
        }}
      >
        {Object.entries(productSpecifications).map(
          ([key, value]: any, index: number) =>
            value.length > 0 ? (
              <View key={key} className="flex-row items-center justify-between">
                <Text className="text-[14px] text-[#fff] font-LexendDeca">
                  {key}
                </Text>
                <View
                  className="rounded-[50px] px-[10px] py-[2px]"
                  style={{ backgroundColor: "rgba(22, 120, 58, 0.30)" }}
                >
                  <Text className="text-[12px] text-[#fff] font-LexendDeca">
                    {value}
                  </Text>
                </View>
              </View>
            ) : null,
        )}
      </View>
    );
  };

  return (
    <View style={{ position: "relative", minHeight: height, flex: 1 }}>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="#121212" />
      <SafeAreaView
        className="h-full bg-[#121212]"
        style={{ minHeight: height, flex: 1 }}
      >
        <View
          className={`pt-[30px] pb-[12px] px-[12px] flex flex-row justify-between items-center gap-[12px]`}
        >
          <View className="flex flex-row items-center gap-[10px] shrink">
            <TouchableOpacity onPress={() => router.back()}>
              <Entypo
                name="chevron-left"
                size={24}
                color="rgba(204, 204, 204, 0.8)"
              />
            </TouchableOpacity>
            <Pressable
              style={{
                borderRadius: 6,
                borderWidth: 1,
                borderColor: "#c6c6c6",
                // maxWidth: 250,
                paddingVertical: 12,
                flexDirection: "row",
                paddingHorizontal: 12,
                width: "100%",
                flexShrink: 1,
                gap: 5,
              }}
              onPress={() => router.push("/(root)/(modals)/search")}
            >
              <EvilIcons
                name="search"
                size={24}
                color="#888787"
                className={Platform.OS === "android" ? "mt-[-4px]" : ""}
              />
              <Text className="text-[14px] text-[#888787] font-LexendDecaLight">
                Search
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center gap-[12px] mr-2">
            {/* <TouchableOpacity
              className=" relative "
              onPress={() => {
                if (userToken) {
                  return;
                }
                return setShowAuthSheet(true);
              }}
            >
              <Ionicons name="heart-sharp" size={24} color="#16783A" />
            </TouchableOpacity> */}
            <TouchableOpacity
              className=" flex justify-center items-center "
              onPress={() => {
                if (userToken) {
                  return router.push("/cart/cart");
                }
                return setShowAuthSheet(true);
              }}
            >
              <Image
                source={require("../../../assets/icons/cart.png")}
                resizeMode="cover"
                style={{
                  width: 25,
                  height: 25,
                }}
              />
              {/* <AntDesign
                name="shoppingcart"
                size={24}
                color="rgba(22, 120, 58, 1)"
              /> */}
              {cartNumber > 0 && (
                <View
                  className="absolute top-[-15px] right-[-5px]"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 16,
                    backgroundColor: "#16783A",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text className="text-[#fff] text-[9px] font-LexendDecaBold">
                    {cartNumber}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingBottom: 80,
            }}
          >
            {isLoading || isFetching ? (
              <ActivityIndicator
                size={"small"}
                color={"#16783A"}
                style={{ marginTop: 30 }}
              />
            ) : (
              <>
                <View className="">
                  {productDetails && productDetails.images && (
                    <Carousel
                      loop
                      width={width}
                      height={400}
                      // autoPlay={true}
                      data={productDetails.images}
                      scrollAnimationDuration={200}
                      renderItem={({
                        item,
                        index,
                      }: {
                        item: any;
                        index: number;
                      }) => (
                        <View>
                          <Image
                            source={{ uri: item.url || "" }}
                            className="w-full h-[400px]"
                            style={{ resizeMode: "contain" }}
                          />
                          <View
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.73)",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 5,
                              width: 47,
                              borderRadius: 20,
                              position: "absolute",
                              bottom: 14,
                              left: 32,
                            }}
                          >
                            <Text className="text-[#16783A] text-[12px] font-LexendDecaMedium">
                              {index + 1}/{productDetails.images.length}
                            </Text>
                          </View>
                        </View>
                      )}
                    />
                  )}

                  <View className="py-[20px] px-[18px]">
                    {productDetails?.status == "offline_auction" && (
                      <View className="flex flex-row items-center gap-[8px] mb-[10px]">
                        {auctionData?.currentHighestBid?.buyer?.profileImage
                          ?.url && (
                          <Image
                            source={{
                              uri: auctionData?.currentHighestBid?.buyer
                                ?.profileImage?.url,
                            }}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                            }}
                          />
                        )}

                        <Text className="text-[#fff] text-[10px] font-LexendDecaSemiBold">
                          {auctionData?.currentHighestBid?.buyer?.firstName
                            ? auctionData?.currentHighestBid?.buyer?.firstName +
                              " " +
                              auctionData?.currentHighestBid?.buyer?.lastName +
                              " is winning"
                            : "no current winner"}
                        </Text>
                      </View>
                    )}
                    <View className="flex flex-row items-center justify-between ">
                      <View className="flex flex-row items-end">
                        <Text className="text-[22px] text-white font-LexendDecaMedium">
                          ₦
                          {productDetails?.discount?.isActive
                            ? productDetails?.discount?.discountedPrice?.toLocaleString() ||
                              0
                            : productDetails?.price?.toLocaleString()}
                        </Text>
                        {productDetails?.discount?.isActive && (
                          <Text className="text-[8px] text-[#09AF46] font-LexendDecaMedium line-through absolute bottom-[-5px] right-[-25px]">
                            ₦{productDetails?.price?.toLocaleString()}
                          </Text>
                        )}
                      </View>
                      <View className="flex flex-row items-center gap-[6px]">
                        {productDetails?.discount?.isActive ? (
                          <View className=" bg-[#FFD700] py-[5px] px-[17px] rounded-[14px]">
                            <Text className="text-[9px] text-black font-LexendDecaBold">
                              {productDetails?.discount?.value?.toFixed(0)}
                              {productDetails?.discount?.type == "percentage" &&
                                "%"}
                            </Text>
                          </View>
                        ) : null}
                        <View className=" bg-[#0EA245] py-[5px] px-[17px] rounded-[14px]">
                          <Text className="text-[9px] text-white font-LexendDecaBold">
                            {productDetails?.condition}
                          </Text>
                        </View>
                        <Text className="text-[11px] text-white font-LexendDecaBold">
                          {productDetails?.status == "offline_auction"
                            ? `${formatNumber(auctionData?.bids?.length || auctionData?.bidsCount)} bids`
                            : `${formatNumber(productDetails?.stats?.soldCount)} sold`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="px-[18px]">
                    <Text className="text-[14px] text-white font-LexendDecaBold mb-[20px]">
                      {productDetails?.name}
                    </Text>
                  </View>

                  <View
                    className="flex flex-row justify-between px-[18px] py-[14px] items-center bg-[#000]"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "rgba(159, 159, 159, 0.23)",
                    }}
                  >
                    <View className="flex flex-row gap-[10px] items-center">
                      <View className="flex flex-row gap-[6px]  items-center">
                        <Text className="text-[14px] text-white font-LexendDecaMedium">
                          {productDetails?.stats?.averageRating
                            ? parseFloat(
                                productDetails?.stats?.averageRating,
                              ).toFixed(1)
                            : 0}
                        </Text>
                        <AntDesign name="star" size={14} color="#FFD700" />
                      </View>
                      <Text className="text-[14px] text-white font-LexendDecaMedium">
                        Product Ratings ({productDetails?.stats?.reviewCount})
                      </Text>
                    </View>
                    {productDetails?.stats?.reviewCount ? (
                      <TouchableOpacity
                        className="flex flex-row gap-[4px]  items-center"
                        onPress={() =>
                          setIsReviewDropDownShow(!isReviewDropDownShow)
                        }
                      >
                        <Text className="text-[14px] text-white font-LexendDecaMedium opacity-70">
                          View More
                        </Text>
                        <Entypo
                          name={
                            isReviewDropDownShow
                              ? `chevron-down`
                              : "chevron-right"
                          }
                          size={14}
                          color="rgba(204, 204, 204, 0.8)"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {isReviewDropDownShow &&
                  productDetails?.stats?.reviewCount > 0 ? (
                    <View
                      className=""
                      style={{
                        borderTopWidth: 1,
                        borderTopColor: "rgba(159, 159, 159, 0.23)",
                        backgroundColor: "#000",
                      }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: `../reviews/${id}`,
                            params: {
                              sellerId: sellerInfo?._id,
                              storeName: formattedStoreName,
                              storeAvatar:
                                sellerInfo?.storePresence?.storeAvatar?.url,
                            },
                          })
                        }
                      >
                        {productReviews?.length > 0 && (
                          <Text className="ml-[18px] mt-[4px] text-[12px] text-[#16783A] font-LexendDecaMedium opacity-70">
                            View All
                          </Text>
                        )}
                      </TouchableOpacity>
                      <ScrollView
                        contentContainerStyle={{
                          paddingLeft: 45,
                          paddingRight: 18,
                          height: "auto",
                          paddingVertical: 18,
                        }}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                      >
                        {productReviews?.map((review: any, index: number) => (
                          <ReviewCard
                            key={index}
                            name={
                              review.buyer.firstName +
                              " " +
                              review.buyer.lastName
                            }
                            rating={review.rating}
                            comment={review.comment}
                            date={review.createdAt}
                            imageUrl={review?.images[0]?.url}
                            imageDimensions={{
                              width: 190,
                              height: review?.images[0]?.url ? 104 : 0,
                            }}
                          />
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    className="flex flex-row justify-between px-[18px] py-[14px] items-center bg-[#000]"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "rgba(159, 159, 159, 0.23)",
                      backgroundColor: isBuyerProtectionShow
                        ? "#121212"
                        : "#000",
                    }}
                    onPress={() =>
                      setIsBuyerProtectionShow(!isBuyerProtectionShow)
                    }
                  >
                    <View className="flex flex-row gap-[10px] items-center">
                      <View className="flex flex-row gap-[6px]  items-center">
                        <Image
                          source={require("../../../assets/icons/AuqliBuyerProtectionIcon.png")}
                          style={{
                            width: 23,
                            height: 23,
                            resizeMode: "contain",
                          }}
                        />
                      </View>
                      <Text className="text-[14px] text-white font-LexendDecaMedium">
                        Auqli Buyer’s Protection
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="flex flex-row gap-[4px]  items-center"
                      onPress={() =>
                        setIsBuyerProtectionShow(!isBuyerProtectionShow)
                      }
                    >
                      <Entypo
                        name={
                          isBuyerProtectionShow
                            ? `chevron-down`
                            : "chevron-right"
                        }
                        size={14}
                        color="rgba(204, 204, 204, 0.8)"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {isBuyerProtectionShow && (
                    <View
                      style={{
                        paddingHorizontal: 20,
                        paddingLeft: 61,
                        paddingVertical: 10,
                        backgroundColor: "#000",
                        borderTopWidth: 1,
                        borderTopColor: "rgba(159, 159, 159, 0.23)",
                      }}
                    >
                      <Text className="text-white font-LexendDecaMedium leading-6">
                        Shopping on Auqli is secure, what you see is what you
                        get! Problem? Reach out to us and we will fix it
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    className="flex flex-row justify-between px-[18px] py-[14px] items-center bg-[#000]"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "rgba(159, 159, 159, 0.23)",
                      backgroundColor: isProductDetailsShow
                        ? "#121212"
                        : "#000",
                    }}
                    onPress={() =>
                      setIsProductDetailsShow(!isProductDetailsShow)
                    }
                  >
                    <View className="flex flex-row gap-[10px] items-center">
                      <View className="flex flex-row gap-[6px]  items-center">
                        <Image
                          source={require("../../../assets/icons/productDetailsIcon.png")}
                          style={{
                            width: 23,
                            height: 23,
                            resizeMode: "contain",
                          }}
                        />
                      </View>
                      <Text className="text-[14px] text-white font-LexendDecaMedium">
                        Product Details
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="flex flex-row gap-[4px]  items-center"
                      onPress={() =>
                        setIsProductDetailsShow(!isProductDetailsShow)
                      }
                    >
                      <Entypo
                        name={
                          isProductDetailsShow
                            ? `chevron-down`
                            : "chevron-right"
                        }
                        size={14}
                        color="rgba(204, 204, 204, 0.8)"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {isProductDetailsShow && (
                    <View
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        paddingLeft: 61,
                        backgroundColor: "#000",
                        borderTopWidth: 1,
                        borderTopColor: "rgba(159, 159, 159, 0.23)",
                      }}
                    >
                      <Text className="text-white font-LexendDecaMedium leading-7">
                        {productDetails?.description}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    className="flex flex-row justify-between px-[18px] py-[14px] items-center bg-[#000]"
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "rgba(159, 159, 159, 0.23)",
                      backgroundColor: isProductSpecsShow ? "#121212" : "#000",
                    }}
                    onPress={() => setIsProductSpecsShow(!isProductSpecsShow)}
                  >
                    <View className="flex flex-row gap-[10px] items-center">
                      <View className="flex flex-row gap-[6px]  items-center">
                        <Image
                          source={require("../../../assets/icons/specifications.png")}
                          style={{
                            width: 23,
                            height: 23,
                            resizeMode: "contain",
                          }}
                        />
                      </View>
                      <Text className="text-[14px] text-white font-LexendDecaMedium">
                        Specifications
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="flex flex-row gap-[4px]  items-center"
                      onPress={() => setIsProductSpecsShow(!isProductSpecsShow)}
                    >
                      <Entypo
                        name={
                          isProductSpecsShow ? `chevron-down` : "chevron-right"
                        }
                        size={14}
                        color="rgba(204, 204, 204, 0.8)"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {isProductSpecsShow && renderSpecifications()}

                  <View className="px-[20px] py-[14px]">
                    <View
                      className="py-[15px] px-[20px] rounded-[7px]"
                      style={{ backgroundColor: "rgba(22, 120, 58, 0.38)" }}
                    >
                      <View className="flex-row gap-2 items-center mb-[18px]">
                        <Image
                          source={{
                            uri: sellerInfo?.storePresence?.storeAvatar?.url,
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            resizeMode: "contain",
                            borderRadius: 32,
                          }}
                        />
                        <View>
                          <View className="flex-row items-center gap-[8px]">
                            <Text className="text-[#ccc] text-[15px] font-LexendDecaMedium">
                              {sellerInfo?.storeName}
                            </Text>
                            <Image
                              source={require("../../../assets/icons/verified.png")}
                              style={{
                                resizeMode: "contain",
                                width: 16,
                                height: 16,
                              }}
                            />
                          </View>

                          <Text className="text-[#ccc] text-[8px] font-LexendDecaMedium">
                            {formatDate(sellerInfo?.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row gap-[8px] items-center">
                        <TouchableOpacity
                          className="px-[9px] py-[5px] border-[1px] rounded-[3px] border-[#FFD700]"
                          onPress={() => {
                            if (!userToken) {
                              return setShowAuthSheet(true);
                            }
                            router.push({
                              pathname: `/(root)/messageRoom/${sellerInfo._id}`,
                              params: {
                                name:
                                  sellerInfo?.storeName ||
                                  sellerInfo?.personalInfo.firstName +
                                    " " +
                                    sellerInfo?.personalInfo.lastName ||
                                  "Default",
                                avatar:
                                  sellerInfo?.storePresence?.storeAvatar?.url,
                                conversationId:
                                  conversations?.find(
                                    (convo) =>
                                      convo.participant.id == sellerInfo._id,
                                  )?._id || "",
                                userId: user?._id,
                                token: userToken,
                                model: "Seller",
                              },
                            });
                          }}
                        >
                          <Text className="font-LexendDecaMedium text-[#FFD700] text-[8px]">
                            Chat Seller
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="px-[9px] py-[5px] border-[1px] rounded-[3px] border-[#FFD700]"
                          onPress={() =>
                            router.push({
                              pathname: "/sellerProfile",
                              params: {
                                sellerId: sellerInfo?._id,
                                sellerAvatar:
                                  sellerInfo?.storePresence?.storeAvatar?.url,
                              },
                            })
                          }
                        >
                          <Text className="font-LexendDecaMedium text-[#FFD700] text-[8px]">
                            View Shop
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View className="w-[100%] mb-[20px]">
                    <SectionHeader title="More From This Seller" btnText="" />
                    <View style={{ paddingLeft: 22, paddingTop: 12 }}>
                      {isMoreProductsLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        renderContent(moreProductsData)
                      )}
                      {!isMoreProductsLoading &&
                      moreProductsData?.length < 1 ? (
                        <Text className="font-LexendDeca text-white text-[12px] self-center">
                          No more products found
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View className="w-[100%]">
                    <SectionHeader title="Similar Products" btnText="" />
                    <View style={{ paddingLeft: 22, paddingTop: 12 }}>
                      {similarProductsLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        renderContent(similarProductsData)
                      )}

                      {!similarProductsLoading &&
                      similarProductsData?.length < 1 ? (
                        <Text className="font-LexendDeca text-white text-[12px] self-center">
                          No similar products found
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      {isLoading || isFetching ? null : (
        <View
          className="absolute bottom-0 left-0 bg-black w-full flex-row justify-center px-[30px]"
          style={{
            paddingBottom: 29,
            paddingTop: 24,
            gap: 16,
            paddingHorizontal: 30,
          }}
        >
          {productDetails?.status == "offline_auction" ? (
            <TouchableOpacity
              className="px-[20px] py-[12px] bg-[#fff] items-center justify-center w-full"
              style={{
                borderRadius: 6,
                backgroundColor: "#16783A",
                minWidth: 130,
              }}
              onPress={() => {
                placeBid(
                  auctionData?.currentHighestBid?.amount || auctionData?.minBid,
                );
              }}
            >
              <Text className="text-[10px] text-white font-LexendDecaSemiBold">
                Bid ₦
                {(
                  auctionData?.currentHighestBid?.amount || auctionData?.minBid
                )?.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                className="px-[20px] py-[12px] bg-[#fff] items-center justify-center"
                style={{
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#16783A",
                  minWidth: 130,
                }}
                onPress={() => {
                  if (userToken) {
                    return setShowCartSheet(true);
                  }
                  return setShowAuthSheet(true);
                }}
              >
                <Text
                  className="text-[10px] font-LexendDecaMedium"
                  style={{ color: "#16783A" }}
                >
                  ADD TO CART
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-[20px] py-[12px] bg-[#fff] items-center justify-center"
                style={{
                  borderRadius: 6,
                  backgroundColor: "#16783A",
                  minWidth: 130,
                }}
                onPress={async () => {
                  if (userToken) {
                    return setShowCheckout(true);
                  }
                  return setShowAuthSheet(true);
                }}
              >
                <Text className="text-[10px] text-white font-LexendDecaMedium">
                  BUY NOW
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <BottomSheet
        bgColor="#3A3A3A"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showCartSheet}
        titleColor="!text-white"
        onRequestClose={() => setShowCartSheet(false)}
        keyboardBehavior={"interactive"}
      >
        <CartSheet
          productDetails={productDetails}
          closeSheet={() => setShowCartSheet(false)}
          addToCart={handleAddToCart}
        />
      </BottomSheet>

      <BottomSheet
        bgColor="#3A3A3A"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showAddedToCartSheet}
        titleColor="!text-white"
        onRequestClose={() => setShowAddedToCartSheet(false)}
        keyboardBehavior={"interactive"}
      >
        <AddedToCart
          cartData={productDetails}
          closeSheet={() => setShowAddedToCartSheet(false)}
        />
      </BottomSheet>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showAuthSheet}
        titleColor="!text-white"
        snapPoints={["20%"]}
        enableDynamicSizing={false}
        onRequestClose={() => setShowAuthSheet(false)}
        keyboardBehavior="interactive"
      >
        <AuthSheet closeSheet={() => setShowAuthSheet(false)} />
      </BottomSheet>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        show={showRules}
        snapPoints={["30%"]}
        enableDynamicSizing={false}
        onRequestClose={() => setShowRules(false)}
        keyboardBehavior="interactive"
      >
        <AuctionRulesSheet
          closeSheet={handleCloseRules}
          auction={auctionData}
          shipping={shippingFee}
        />
      </BottomSheet>

      <BottomSheet
        bgColor="#121212"
        childrenStyle="!px-[11px]"
        showCloseIcon={false}
        title=""
        show={showCheckout}
        snapPoints={["70%"]}
        titleColor="!text-white"
        onRequestClose={() => setShowCheckout(false)}
        keyboardBehavior={"interactive"}
      >
        <CheckoutNow
          productId={productDetails?._id}
          closeSheet={() => setShowCheckout(false)}
          sellerId={sellerInfo?._id}
        />
      </BottomSheet>
    </View>
  );
};

const CartSheet = ({
  productDetails,
  closeSheet,
  addToCart,
}: {
  productDetails: any;
  closeSheet: () => void;
  addToCart: (cartItem: any) => Promise<void>;
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<any>({});
  const [selectedSpec, setSelectedSpec] = useState<any>({});

  const handleVariantSelect = (data: any) => {
    if (selectedVariant && selectedVariant?._id == data._id) {
      setSelectedSpec({});
      return setSelectedVariant({});
    }
    setSelectedVariant(data);
    setSelectedSpec({
      specifications: {
        color: data.name == "color" ? data.value : "",
        size: data.size == "size" ? data.value : "",
        material: data.material == "material" ? data.value : "",
      },
    });
  };

  const handleCreateCartItem = () => {
    if (selectedVariant?._id) {
      addToCart({
        ...productDetails,
        quantity,
        includeInOrder: true,
        ...selectedSpec,
        price: selectedVariant.price,
        images: [
          {
            url:
              selectedVariant.images?.length > 0
                ? selectedVariant.images?.[0]?.data
                : productDetails.images?.[0]?.url,
          },
        ],
      });
    } else {
      addToCart({ ...productDetails, quantity, includeInOrder: true });
    }
  };

  useEffect(() => {
    if (quantity < 1) {
      setQuantity(1);
    }
  }, [quantity]);
  return (
    <View className="p-[8px] pb-[16px]">
      <View className="flex-row justify-between mb-[23px] ">
        <View className="flex-row gap-[16px]">
          <Image
            source={{
              uri:
                (selectedVariant?.images?.length > 0 &&
                  selectedVariant?.images[0]?.data) ||
                productDetails?.images[0]?.url,
            }}
            resizeMode="cover"
            className="w-[79px] h-[74px] rounded-[8px]"
          />
          <View className="gap-[2px]">
            <Text className="text-white text-[22px] font-LexendDecaMedium">
              ₦
              {selectedVariant?.discount?.isActive
                ? selectedVariant?.discount?.discountedPrice?.toLocaleString()
                : selectedVariant?.price?.toLocaleString() ||
                  (productDetails?.discount?.isActive
                    ? productDetails?.discount?.discountedPrice?.toLocaleString()
                    : productDetails?.price?.toLocaleString())}
            </Text>
            {productDetails?.discount?.isActive && (
              <View className="flex-row items-center gap-[8px]">
                <Text className="text-white text-[11px] font-LexendDecaMedium line-through">
                  ₦
                  {productDetails?.discount?.isActive &&
                    productDetails?.price.toLocaleString()}
                </Text>
                <Text className="text-[11px] text-[#16783A] font-LexendDecaBold">
                  {productDetails?.discount?.value}
                  {productDetails?.discount?.type == "percentage" && "%"} off
                </Text>
              </View>
            )}

            <Text className="text-white text-[11px] font-LexendDecaMedium">
              {productDetails?.category}
            </Text>
          </View>
        </View>
        <Pressable onPress={closeSheet}>
          <View className="bg-[#EE571C] w-[30px] h-[30px] rounded-[50%]">
            <AntDesign name="closecircle" size={30} color="#F9C7B3" />
          </View>
        </Pressable>
      </View>
      <View className="flex-row items-center gap-[15px] mb-[26px] rounded-[4px] bg-black px-[14px] py-[7px]">
        <Ionicons name="shield-checkmark-outline" size={20} color="white" />
        <Text className="text-white text-[11px]">7 Days Free Returns</Text>
      </View>

      {productDetails.variants?.length > 0 && (
        <View className="mb-[13px]">
          <Text className="text-white text-[11px] font-LexendDecaMedium mb-[8px]">
            {productDetails.variants[0]?.name}
          </Text>
          <View className="flex-row items-center gap-[22px] ">
            {productDetails.variants.map((variant: any, index: number) => (
              <TouchableOpacity
                className={`rounded-[4px] bg-white relative border-[2px] border-[#3A3A3A] ${selectedVariant._id == variant._id ? "!border-[2px] !border-[#16783A]" : null}`}
                key={index}
                onPress={() => handleVariantSelect(variant)}
              >
                <Image
                  source={{
                    uri:
                      variant?.images[0]?.data || productDetails.images[0].url,
                  }}
                  resizeMode="cover"
                  className="w-[79px] h-[74px] bg-white p-[1px]"
                />
                <View className="bg-white p-[2px] items-center justify-center border-t-[1px] border-[#9f9f9f]">
                  <Text className="text-black text-[11px] font-LexendDecaMedium">
                    {variant.value}
                  </Text>
                </View>
                {selectedVariant._id == variant._id && (
                  <AntDesign
                    name="checkcircle"
                    size={14}
                    color="#16783A"
                    className="absolute top-[-10px] right-[-10px]"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-[14px]">
        <Text className="text-white text-[11px] font-LexendDecaMedium">
          Quantity
        </Text>
        <View className="flex-row items-center gap-[6px]">
          <TouchableOpacity
            className="w-[24px] h-[24px] bg-[#16783A] rounded-[4px] items-center justify-center"
            onPress={() => setQuantity(quantity - 1)}
          >
            <AntDesign name="minus" size={14} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-[11px] font-LexendDecaMedium">
            {quantity}
          </Text>
          <TouchableOpacity
            className="w-[24px] h-[24px] bg-[#16783A] rounded-[4px] items-center justify-center"
            onPress={() => setQuantity(quantity + 1)}
          >
            <AntDesign name="plus" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        className="py-[10px] rounded-[6px] bg-[#16783A] items-center justify-center"
        onPress={() => handleCreateCartItem()}
      >
        <Text className="text-white text-[14px] font-LexendDecaMedium">
          Add to Cart
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const AddedToCart = ({
  cartData,
  closeSheet,
}: {
  cartData: any;
  closeSheet: () => void;
}) => {
  return (
    <View className="p-[16px] pb-[20px]">
      <Text className="text-white text-[16px] mb-[20px] text-center font-LexendDecaMedium ">
        Item Added To Cart
      </Text>
      <View className="flex-row gap-[16px] bg-white p-[8px] rounded-[8px] mb-[20px] items-center ">
        <Image
          source={{ uri: cartData?.images[0]?.url }}
          resizeMode="cover"
          style={{ width: 73, height: 73, borderRadius: 4 }}
        />
        <View className="justify-between py-2 gap-[20px] shrink">
          <Text className="text-[12px] font-LexendDecaMedium leading-[18px]">
            {cartData?.name}
          </Text>
          <View className="flex-row items-center gap-[8px]">
            <Text className="text-[16px] font-LexendDecaMedium leading-[18px]">
              ₦
              {cartData?.discount?.isActive
                ? cartData?.discount?.discountedPrice?.toLocaleString() || 0
                : cartData?.price?.toLocaleString()}
            </Text>
            {cartData?.discount?.isActive && (
              <Text className="text-[11px] text-[#16783A] font-LexendDecaBold">
                -{cartData?.discount?.value}
                {cartData?.discount?.type == "percentage" && "%"} off
              </Text>
            )}
          </View>
        </View>

        <View className="absolute right-[-10px]">
          <Image source={require("../../../assets/icons/elements.png")} />
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          className="w-full py-[12px] bg-white rounded-[4px] items-center justify-center border-[#16783A] border-[2px] basis-[47%]"
          onPress={closeSheet}
        >
          <Text className="text-[#16783A] font-LexendDecaBold text-[12px]">
            Continue Shopping
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-full py-[12px] bg-[#16783A] rounded-[4px] items-center justify-center border-[#16783A] border-[2px] basis-[47%]"
          onPress={() => {
            closeSheet();
            router.push("/checkout/checkout");
          }}
        >
          <Text className="text-white font-LexendDecaBold text-[12px]">
            Checkout Now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProductDescription;
