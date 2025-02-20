import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FocusAwareStatusBar } from "../ui/focus-aware-status-bar";
import { useForm } from "react-hook-form";
import CustomButton from "../global/button/CustomButton";
import BottomSheet from "../global/bottom-sheet";
import {
  useGetAllCategoriesQuery,
  useUploadCategoriesMutation,
} from "@/services/categories";
import { toast } from "@/core/toast";
import { router } from "expo-router";
import { icons, images } from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch } from "react-redux";
import { signIn } from "@/store/features/auth/authSlice";

type FormData = {
  selectedCategories: {
    name: string;
    subCategories: { name: string }[];
  }[];
};

const Categories = () => {
  const dispatch = useDispatch();
  const { control, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      selectedCategories: [],
    },
  });

  const [show, setShow] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<any[]>([]);

  const selectedCategories = watch("selectedCategories");
  const [uploadCategories, { isLoading }] = useUploadCategoriesMutation();
  const { data: categoriesData } = useGetAllCategoriesQuery({});

  const toggleCategory = (categoryId: string, title: string) => {
    if (selectedCategories.find((val) => val.name == title)) {
      setValue(
        "selectedCategories",
        selectedCategories.filter((val) => val.name !== title),
      );
      setSelectedCategory(
        selectedCategories.filter((val) => val.name !== title).slice(-1)[0]
          ?.name || null,
      );
    } else {
      setSelectedCategory(title);
      const subCategories =
        categoriesData?.find((category: any) => category.name === title)
          ?.subCategories || [];
      setSubCategories(subCategories);
      setValue("selectedCategories", [
        ...selectedCategories,
        {
          name: title,
          subCategories,
        },
      ]);
    }
  };

  const addSubCategory = (categoryName: string, subCategoryName: string) => {
    const updatedCategories = [...selectedCategories];
    const categoryIndex = updatedCategories.findIndex(
      (category) => category.name === categoryName,
    );

    if (categoryIndex !== -1) {
      const category = updatedCategories[categoryIndex];
      const isAlreadyAdded = category.subCategories.some(
        (sub) => sub.name === subCategoryName,
      );

      if (isAlreadyAdded) {
        category.subCategories = category.subCategories.filter(
          (sub) => sub.name !== subCategoryName,
        );
      } else {
        category.subCategories.push({ name: subCategoryName });
      }
    } else {
      updatedCategories.push({
        name: categoryName,
        subCategories: [{ name: subCategoryName }],
      });
    }

    setValue("selectedCategories", updatedCategories);
  };

  const handleContinue = async (data: FormData) => {
    try {
      const registerPayload = await AsyncStorage.getItem("registerPayload");

      const token = await AsyncStorage.getItem("token");

      const result = await uploadCategories({ selectedCategories }).unwrap();

      if (registerPayload) dispatch(signIn(JSON.parse(registerPayload!)));

      router.replace("/(root)/(tabs)/home");
      toast.success(result.message);
    } catch (error: any) {
      console.log("result", error);

      toast.error(error.data.message);
    }
  };

  return (
    <>
      <FocusAwareStatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView className="h-full bg-black">
        <ScrollView className="flex-1 px-4">
          <FlatList
            data={categoriesData}
            numColumns={2}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={() => (
              <Text className="text-gray-200 font-LexendDecaBold text-center text-[21.77px] mt-10 mb-[36px]">
                What’s your style vibe?
              </Text>
            )}
            columnWrapperStyle={{
              justifyContent: "center",
              columnGap: 48,
              paddingHorizontal: 10,
              paddingVertical: 10,
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => toggleCategory(item.id, item.name)}
                className="rounded-md overflow-visible relative w-[115px] h-[173px]"
              >
                <Image
                  source={{ uri: item.image.url }}
                  className="rounded-md border-[0.6px] border-gray-200 h-full"
                  resizeMode="cover"
                />
                {selectedCategories.find((val) => val.name == item.name) && (
                  <Image
                    source={images.checkmarkIcon}
                    className="absolute top-[-10px] right-[1px] w-6 h-6 z-50"
                  />
                )}
                <Text className="text-center font-LexendDecaBold text-white absolute bottom-3 text-lg px-[8.41px]">
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
          <View className="mx-5 mt-5">
            <CustomButton
              title="Continue"
              onPress={handleSubmit(handleContinue)}
              disabled={!selectedCategory || isLoading}
              className="mb-4 mt-[18px] bg-primary-100 !rounded !text-white text-sm font-LexendDecaBold"
            />
            {/* <CustomButton
              title="Add Preference"
              onPress={() => setShow(true)}
              textVariant="success"
              disabled={!selectedCategory || isLoading}
              className="mb-16 mt-[18px] bg-transparent border border-[#16783A] !rounded text-sm font-LexendDecaBold"
              IconLeft={() => (
                <Image
                  source={icons.addCircle}
                  resizeMode="contain"
                  className="mx-1"
                />
              )}
            /> */}
            <BottomSheet
              bgColor="#3A3A3A"
              childrenStyle="!px-[11px]"
              showCloseIcon={false}
              title="Sub Category"
              show={show}
              titleColor="!text-white"
              keyboardBehavior="interactive"
            >
              <View className="rounded-t-3xl">
                <FlatList
                  data={subCategories}
                  numColumns={2}
                  columnWrapperStyle={{
                    columnGap: 22,
                    justifyContent: "space-between",
                  }}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item: subCategory }) => {
                    const isSelected = selectedCategories.some(
                      (category) =>
                        category.name === selectedCategory &&
                        category.subCategories.some(
                          (sub) => sub.name === subCategory.name,
                        ),
                    );

                    return (
                      <TouchableOpacity
                        style={{
                          backgroundColor: isSelected
                            ? "#16783A"
                            : "rgba(69, 193, 51, 0.15)",
                          padding: 16,
                          marginBottom: 26,
                        }}
                        className="rounded-[26.928px] flex-1 items-center flex-row justify-between px-[22px] text-center w-[168px] font-LexendDeca font-normal text-sm border-gray-200 border-[0.861px]"
                        onPress={() =>
                          addSubCategory(
                            selectedCategory ||
                              // selectedCategories[0]?.name ||
                              "",
                            subCategory.name,
                          )
                        }
                      >
                        <Text
                          className={
                            isSelected ? "text-white" : "text-gray-200"
                          }
                          style={{ fontSize: 14.362 }}
                        >
                          {subCategory.name}
                        </Text>
                        <Image
                          source={
                            isSelected
                              ? icons.checkmarkCircleSelectIcon
                              : icons.checkmarkCircleIcon
                          }
                        />
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
              <View className="mx-3">
                <CustomButton
                  title="Continue"
                  onPress={() => setShow(false)}
                  className="mb-8 mt-[18px] bg-primary-200 !rounded !text-white text-[14.512px] font-LexendDecaBold"
                />
              </View>
            </BottomSheet>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default Categories;
