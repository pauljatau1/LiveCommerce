import {
  View,
  Text,
  SafeAreaView,
  Dimensions,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  TouchableHighlight,
  Animated,
  FlatList,
  StyleSheet,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FocusAwareStatusBar } from "@/components/ui/focus-aware-status-bar";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { router } from "expo-router";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import * as ImagePicker from "expo-image-picker";
import LoadingModal from "@/components/global/loading-modal";
import { ResizeMode, Video } from "expo-av";
import { useCreatePostMutation } from "@/services/posts";
import { subBusinessDays } from "date-fns";
import axios from "axios";
import { getToken } from "@/store/features/auth/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet from "@/components/global/bottom-sheet";
import {
  useDeepSearchProductsQuery,
  useGetAllProductsQuery,
} from "@/services/products";
import ConnectProductCard from "@/components/connect/product-card";
import { ActivityIndicator } from "react-native-paper";
import Entypo from "@expo/vector-icons/Entypo";
import {
  BottomSheetFlatList,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { white } from "react-native-paper/lib/typescript/styles/themes/v2/colors";

const { height } = Dimensions.get("window");

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const visibilityArray = ["Public", "Private", "Draft"];

const createPost = () => {
  const [createPost, { isLoading }] = useCreatePostMutation({});
  const [body, setBody] = useState<string>("");
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [visibility, setVisibility] = useState<string>("public");
  const [tags, setTags] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [showProducts, setShowProducts] = useState<boolean>(false);
  const [showSellers, setShowSellers] = useState<boolean>(false);
  const [showVisibilityDropDown, setShowVisibilityDropDown] =
    useState<boolean>(false);

  const pickImage = async () => {
    // Check if the number of selected images is less than 4
    if (selectedMedia.length >= 4) {
      alert("You can only upload up to 4 images.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
      allowsMultipleSelection: true,
      base64: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => ({
        uri: asset.uri,
        name: `media_${Date.now()}.${asset.mimeType?.split("/")[1] || "application/octet-stream"}`,
        mimeType: asset.mimeType,
      }));
      const remainingSlots = 4 - selectedMedia.length;
      const imagesToAdd = newImages.slice(0, remainingSlots);
      console.log(imagesToAdd[0].uri);

      setSelectedMedia((prevMedia) => [...prevMedia, ...imagesToAdd]);
    }
  };

  const clearSelectedImages = () => {
    setSelectedMedia([]);
  };

  const handleDeleteMedia = (uri: string) => {
    setSelectedMedia(selectedMedia.filter((md) => md.uri !== uri));
  };

  const submitPost = async () => {
    try {
      const formData = new FormData();
      formData.append("title", body.slice(0, 20));
      formData.append("body", body);
      formData.append("tags", JSON.stringify(tags));
      formData.append(
        "productIds",
        products.map((product) => product._id).join(","),
      );
      formData.append(
        "taggedSellers",
        JSON.stringify(
          sellers.map((seller) => {
            return { sellerId: seller.id };
          }),
        ),
      );

      selectedMedia.forEach((image, index) => {
        formData.append(`media`, image);
      });
      formData.append("visibility", visibility.toLowerCase());
      console.log(formData);

      const result = await createPost(formData);
      router.replace("/(root)/(tabs)/connect");
      //   const token = await getToken();
      //   const result = await fetch(
      //     `${process.env.EXPO_PUBLIC_API_URL}api/posts`,
      //     {
      //       method: "POST",
      //       body: formData,
      //       headers: {
      //         "Content-Type": "multipart/form-data",
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   );
      //   const data = await result.json();
      console.log("created post", result);
    } catch (e) {
      console.log("error creating post ", e);
    }
  };

  const handleSubmitSelectedProducts = (ids: any[]) => {
    setShowProducts(false);
    setProducts(ids);
  };

  const handleSubmitTaggedSellers = (sellers: any[]) => {
    setShowSellers(false);
    setSellers(sellers);
  };

  const construcTaggedSellers = (arr: any[]) => {
    if (arr.length == 2) {
      return arr[0].name + " and " + arr[1].name;
    }
    if (arr.length > 2) {
      return arr[0].name + " and " + (arr.length - 1) + " others";
    } else {
      return arr[0].name;
    }
  };

  return (
    // <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View>
      <SafeAreaView
        className="h-full flex-1 bg-[#121212] "
        style={{ minHeight: height }}
      >
        <FocusAwareStatusBar
          barStyle="light-content"
          backgroundColor="#121212"
        />
        <View className="flex-row items-center gap-[30px] pt-[30px] px-[16px] mb-[40px]">
          <Pressable onPress={() => router.back()}>
            <AntDesign name="close" size={20} color="#ccc" />
          </Pressable>
          <View className="flex-row items-center gap-[12px]">
            <Image
              source={require("../../../assets/icons/animoji.png")}
              style={{
                width: 35,
                height: 35,
                borderRadius: 35,
              }}
              resizeMode="contain"
            />
            <Pressable
              className="flex-row items-center gap-[8px]"
              onPress={() => setShowVisibilityDropDown(true)}
            >
              <Text className="text-white text-[12px] font-LexendDeca font-500">
                {visibility}
              </Text>
              <FontAwesome6 name="caret-down" size={14} color="#ccc" />
              {showVisibilityDropDown && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -54,
                    left: 0,
                    backgroundColor: "white",
                    borderRadius: 4,
                  }}
                >
                  {visibilityArray.map((value, index) => (
                    <TouchableOpacity
                      key={index}
                      style={{
                        padding: 2,
                        paddingHorizontal: 10,
                        borderBottomColor: "#121212",
                        borderBottomWidth: 0.5,
                      }}
                      onPress={() => {
                        setVisibility(value);
                        setShowVisibilityDropDown(false);
                      }}
                    >
                      <Text className="text-black text-[9px] font-LexendDeca">
                        {value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Pressable>
          </View>
          {body && (
            <TouchableOpacity
              className="rounded-[4px] px-[15px] py-[10px] items-center justify-center bg-[#16783A]"
              onPress={() => submitPost()}
              style={{
                marginLeft: "auto",
              }}
            >
              <Text className="text-white text-[10px]">Post</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="px-[16px] pl-[30px]">
            <View>
              <TextInput
                placeholder="What's on your mind?..."
                placeholderTextColor={"rgba(204, 204, 204, 0.25)"}
                className="font-LexendDeca font-500 text-white text-[16px] mb-[20px]"
                value={body}
                onChangeText={(text) => setBody(text)}
                multiline={true}
                maxLength={250}

                // numberOfLines={5}
              />
            </View>
          </View>
          {selectedMedia.length > 0 ? (
            <View
              style={{
                height: 220,
                marginBottom: 10,
              }}
            >
              <ScrollView
                style={{
                  marginLeft: 30,
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  height: 220,
                }}
              >
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {selectedMedia.map((uri, index) => (
                    <View
                      key={index}
                      style={{
                        marginRight: 6,
                        width: 160,
                        backgroundColor: "#111",
                      }}
                    >
                      {uri.mimeType.split("/")[0] == "image" ? (
                        <Image
                          source={{ uri: uri.uri }}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 10,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Video
                          source={{
                            uri: uri.uri,
                          }}
                          style={{
                            height: "100%",
                            width: "100%",
                            borderRadius: 10,
                          }}
                          resizeMode={ResizeMode.CONTAIN}
                          useNativeControls
                          isLooping
                        />
                      )}

                      <Pressable
                        className="absolute right-[4px] top-[4px] bg-[#000] w-[25px] h-[25px] rounded-full items-center justify-center"
                        onPress={() => handleDeleteMedia(uri.uri)}
                      >
                        <Ionicons name="close-sharp" size={14} color="white" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null}

          <Pressable
            className="flex-row ml-[30] gap-[4px] items-center my-[10px]"
            onPress={() => setShowSellers(true)}
          >
            <Entypo
              name="shop"
              size={16}
              color="#16783A"
              style={{ marginTop: 2 }}
            />
            {sellers?.length < 1 ? (
              <Text className="text-[14px] text-[#16783A] font-LexendDeca">
                Tag sellers
              </Text>
            ) : (
              <Text className="text-[14px] text-[#16783A] font-LexendDeca">
                {construcTaggedSellers(sellers)}
              </Text>
            )}
          </Pressable>

          {products.length > 0 && (
            <View className="w-full ml-[30px] pr-[30px]">
              <Text className="text-white text-[12px] font-LexendDeca mb-[10px]">
                Tagged Products :
              </Text>
              <FlatList
                data={products}
                nestedScrollEnabled={true}
                renderItem={({ item }) => (
                  <View className="w-[160px] h-[260px] mr-[6px]">
                    <ConnectProductCard
                      name={item.name}
                      price={item.price}
                      category={item.category}
                      seller={item.seller}
                      image_url={item?.images[0]?.url}
                      rating={item?.stats?.averageRating}
                    />
                    <TouchableOpacity
                      className="absolute right-[4px] top-[4px] bg-[#000] w-[25px] h-[25px] rounded-full items-center justify-center bg-[#121212]"
                      onPress={() =>
                        setProducts(
                          products.filter((prod) => prod._id != item._id),
                        )
                      }
                      // pointerEvents="box-none"
                    >
                      <Ionicons name="close-sharp" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item, index) => item._id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          <BottomSheet
            bgColor="#121212"
            childrenStyle="!px-[11px]"
            showCloseIcon={false}
            title=""
            show={showProducts}
            titleColor="!text-white"
            snapPoints={["80%"]}
            enableDynamicSizing={false}
            onRequestClose={() => setShowProducts(false)}
            keyboardBehavior="interactive"
          >
            <ProductsSheet
              handleSubmitSelectedProducts={handleSubmitSelectedProducts}
            />
          </BottomSheet>

          <BottomSheet
            bgColor="#121212"
            childrenStyle="!px-[0px] !py-[0px]"
            showCloseIcon={false}
            show={showSellers}
            snapPoints={["90%"]}
            enableDynamicSizing={false}
            onRequestClose={() => setShowSellers(false)}
            keyboardBehavior="interactive"
          >
            <SellersSheet
              handleSubmitTaggedSellers={handleSubmitTaggedSellers}
            />
          </BottomSheet>
        </ScrollView>
        <View className="flex-row items-center justify-center gap-[50] flex-wrap absolute bottom-10 self-center">
          <TouchableOpacity
            className="flex-col items-center gap-[5px]"
            onPress={() => pickImage()}
          >
            <View className="w-[50px] h-[50px] rounded-[50px] justify-center items-center bg-[#DAE3EA]">
              <AntDesign name="picture" size={15} color="#94A3B1" />
            </View>
            <Text className="text-[12px] font-LexendDeca text-[#94A3B1]">
              Media
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-col items-center gap-[5px]"
            onPress={() => setShowProducts(true)}
          >
            <View className="w-[50px] h-[50px] rounded-[50px] justify-center items-center bg-[#DAE3EA]">
              <SimpleLineIcons name="chart" size={15} color="#94A3B1" />
            </View>
            <Text className="text-[12px] font-LexendDeca text-[#94A3B1]">
              Product
            </Text>
          </TouchableOpacity>

          <LoadingModal isVisible={isLoading} />
        </View>
      </SafeAreaView>
    </View>

    // </TouchableWithoutFeedback>
  );
};

const ProductsSheet = ({
  handleSubmitSelectedProducts,
}: {
  handleSubmitSelectedProducts: any;
}) => {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(".");
  const [query, setQuery] = useState<string>(".");
  // const [products]
  const { data, isLoading, isFetching, isError, refetch } =
    useDeepSearchProductsQuery({
      query: query == "" ? "." : query,
    });

  const handleSubmit = () => {
    setQuery(searchTerm);
  };

  const handleFinalSubmit = () => {
    // const result = selectedProducts.map((product: any) => product._id);
    console.log(
      "selected products ",
      selectedProducts.map((product: any) => product._id),
    );
    handleSubmitSelectedProducts(selectedProducts);
  };

  const handleSelectItem = (item: any) => {
    if (isFetching) return;
    const existingItem = selectedProducts.find((prod) => prod._id == item._id);
    if (existingItem) {
      return setSelectedProducts(
        selectedProducts.filter((prod) => prod._id != item._id),
      );
    }
    if (selectedProducts.length >= 4) {
      return;
    }
    setSelectedProducts([...selectedProducts, item]);
  };

  return (
    <View className="h-full">
      <View className="w-[100%] rounded-[22px] py-[12px] px-[12px] bg-[#2e2e2e]  ">
        <TextInput
          placeholder="Search for products..."
          placeholderTextColor={"#ccc"}
          style={{
            fontSize: 15,
            color: "#fff",
            fontFamily: "LexendDeca",
          }}
          returnKeyType="search"
          value={searchTerm == "." ? "" : searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
          onSubmitEditing={handleSubmit}
        />
      </View>

      <Text className="text-center text-[#ccc] text-[12px] mt-[10px] mb-[30px] font-LexendDeca">
        *Select a maximum of 4 products
      </Text>

      <View
        style={{
          paddingBottom: 100,
          height: "90%",
        }}
      >
        {isLoading ? (
          <ActivityIndicator size={"small"} color="#16783A" />
        ) : (
          <BottomSheetFlatList
            data={data}
            // scrollEnabled={true}

            nestedScrollEnabled={true}
            renderItem={({ item }: { item: any }) => (
              <TouchableOpacity
                className="w-[49%] h-[300px] mb-[10px]"
                style={{
                  opacity: isFetching ? 0.3 : 1,
                }}
                onPress={() => handleSelectItem(item)}
              >
                <ConnectProductCard
                  name={item.name}
                  price={item.price}
                  category={item.category}
                  seller={item.seller}
                  image_url={item?.images[0]?.url}
                  rating={item?.stats?.averageRating}
                />
                <View
                  className="absolute right-[4px] top-[4px] bg-[#000] w-[25px] h-[25px] rounded-full items-center justify-center"
                  style={{
                    borderWidth: 2,
                    borderColor: "#16783A",
                    backgroundColor: selectedProducts.find(
                      (prod) => prod._id == item._id,
                    )
                      ? "#16783A"
                      : "#f2f2f2",
                  }}
                >
                  {selectedProducts.find((prod) => prod._id == item._id) && (
                    <AntDesign name="check" size={14} color="white" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{
              // columnGap: ,
              justifyContent: "space-between",
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View className="absolute bottom-0 self-center w-full flex-row items-center justify-between py-[20px] px-[10px] bg-[#121212]">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            flexWrap: "wrap",
          }}
        >
          {selectedProducts.map((product: any, index: number) => (
            <View
              key={index}
              style={{
                marginRight: 4,
                width: 30,
                height: 30,
                backgroundColor: "#111",
              }}
            >
              <Image
                source={{ uri: product?.images[0]?.url }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                }}
                resizeMode="cover"
              />
              <Pressable
                className="absolute right-[-4px] top-[-4px] bg-[#000] w-[15px] h-[15px] rounded-full items-center justify-center"
                onPress={() => handleSelectItem(product)}
              >
                <Ionicons name="close-sharp" size={8} color="white" />
              </Pressable>
            </View>
          ))}
        </View>
        <TouchableOpacity
          className="rounded-[4px] px-[15px] py-[10px] items-center justify-center bg-[#16783A]"
          onPress={() => handleFinalSubmit()}
          style={{
            marginLeft: "auto",
          }}
        >
          <Text className="text-white text-[10px]">Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SellersSheet = ({
  handleSubmitTaggedSellers,
}: {
  handleSubmitTaggedSellers: any;
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [allSellers, setAllSellers] = useState<any[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<any[]>([]);
  const [selectedSellers, setSelectedSellers] = useState<any[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<any>({});

  const handleGetSellers = async () => {
    try {
      const response = await axios.get(
        process.env.EXPO_PUBLIC_API_URL + "api/public/sellers",
      );

      setAllSellers(response.data);
    } catch (e: any) {
      console.log("error getting sellers in create post ", e?.message);
    }
  };

  const handleFilterSellers = (text: string) => {
    setFilteredSellers(
      allSellers.filter((sl: any) =>
        (
          sl.storeName ||
          sl.personalInfo.firstName + " " + sl.personalInfo.lastName
        )
          .toLowerCase()
          .includes(text.toLowerCase()),
      ),
    );
  };

  const handleDeleteSeller = (seller: any) => {
    setSelectedSellers((prev) => prev.filter((sl) => seller.id !== sl.id));
  };

  const handleSelectSeller = (seller: any) => {
    if (selectedSellers.find((sl) => sl.id == seller._id)) return;
    const newSellerObject = {
      name:
        seller.storeName ||
        seller.personalInfo?.firstName + " " + seller.personalInfo?.lastName,
      id: seller._id,
    };
    setSelectedSellers((prev) => [...prev, newSellerObject]);
  };

  const handleFinalSellerSubmit = () => {
    // const final = selectedSellers?.map((seller: any) => seller.id);
    handleSubmitTaggedSellers(selectedSellers);
  };

  useEffect(() => {
    handleGetSellers();
  }, []);

  useEffect(() => {
    if (allSellers?.length > 0) handleFilterSellers(searchTerm);
  }, [searchTerm]);
  return (
    <View className="w-full h-full">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 15,
        }}
      >
        <Text className="font-LexendDecaSemiBold text-[16px] text-[#ccc] self-center">
          Tag Sellers
        </Text>
        <Pressable
          style={{
            position: "absolute",
            right: 10,
          }}
          onPress={() => handleFinalSellerSubmit()}
        >
          <Text
            style={{
              fontSize: 16,
              color: "#16783A",
              fontFamily: "LexendDeca-SemiBold",
            }}
          >
            Done
          </Text>
        </Pressable>
      </View>

      <View
        style={{
          padding: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          borderBottomColor: "#C6C6C6",
          borderBottomWidth: StyleSheet.hairlineWidth,
          marginBottom: 10,
        }}
      >
        <Text className="text-[#ccc] font-LexendDeca text-[14px]">
          Sellers:{" "}
        </Text>
        {selectedSellers?.length > 0 &&
          selectedSellers?.map((seller: any, index: number) => (
            <Pressable
              key={index}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
                borderWidth: 0.5,
                borderColor: "#c9c9c9",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                gap: 8,
              }}
              onPress={() => setSelectedSeller(seller)}
            >
              <Text className="self-center font-LexendDecaLight text-[12px] text-[#f2f2f2]">
                {seller.name}
              </Text>
              <Pressable
                className=" bg-[#000] w-[20px] h-[20px] rounded-full items-center justify-center bg-white"
                onPress={() => handleDeleteSeller(seller)}
              >
                <Ionicons name="close-sharp" size={14} color="black" />
              </Pressable>
            </Pressable>
          ))}
        <TextInput
          placeholder="Search seller"
          placeholderTextColor={"#c9c9c9"}
          style={{
            padding: 0,
            fontSize: 12,
            color: "white",
            width: "auto",
            minWidth: 100,
            flexShrink: 1,
            flexGrow: 1,
            // backgroundColor: "yellow",
          }}
          value={searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
        />
      </View>
      <View
        style={{
          paddingHorizontal: 10,
        }}
      >
        <FlatList
          data={filteredSellers}
          renderItem={({ item }) => (
            <Pressable
              style={{
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
              onPress={() => handleSelectSeller(item)}
            >
              <Image
                source={
                  item?.storePresence?.storeAvatar.url
                    ? { uri: item?.storePresence?.storeAvatar.url }
                    : require("../../../assets/icons/user-image-empty.png")
                }
                style={{
                  width: 30,
                  height: 30,
                  resizeMode: "cover",
                  borderRadius: 30,
                  backgroundColor: "#c9c9c9",
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: "#f2f2f2",
                }}
              >
                {item.storeName ||
                  item.personalInfo.firstName +
                    " " +
                    item.personalInfo.lastName}
              </Text>
            </Pressable>
          )}
          keyExtractor={(item, index) => item._id}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};
export default createPost;
