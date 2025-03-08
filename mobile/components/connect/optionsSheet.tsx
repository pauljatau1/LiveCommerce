import { View, Text, TouchableOpacity } from "react-native";
import React, { memo } from "react";
import { AntDesign, Octicons, SimpleLineIcons } from "@expo/vector-icons";

const OptionsSheet = memo(
  ({
    authorId,
    userId,
    postId,
    closeSheet,
    deletePost,
    handleShowReportPost,
    handleShowReportUser,
  }: {
    authorId: string;
    userId: string;
    postId: string;
    closeSheet: any;
    deletePost: any;
    handleShowReportPost: any;
    handleShowReportUser: any;
  }) => {
    const handleDeletePost = async () => {
      deletePost(postId);
      closeSheet();
    };
    return (
      <View className="w-full">
        {authorId === userId ? (
          <TouchableOpacity
            className="py-[15px] flex-row gap-[20px] px-[5px] items-center"
            onPress={handleDeletePost}
          >
            <AntDesign name="delete" size={18} color="#ccc" />
            <Text className="text-[14px] text-[#ccc] font-LexendDeca">
              Delete Post
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* <TouchableOpacity className="py-[15px] flex-row gap-[20px] px-[5px] items-center">
              <AntDesign name="eyeo" size={22} color="#ccc" />
              <Text className="text-[14px] text-[#ccc] font-LexendDeca">
                Hide Post
              </Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              className="py-[15px] flex-row gap-[20px] px-[5px] items-center"
              onPress={handleShowReportPost}
            >
              <Octicons name="report" size={20} color="#ccc" />
              <Text className="text-[14px] text-[#ccc] font-LexendDeca">
                Report Post
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="py-[15px] flex-row gap-[20px] px-[5px] items-center"
              onPress={handleShowReportUser}
            >
              <SimpleLineIcons name="user-unfollow" size={20} color="#ccc" />
              <Text className="text-[14px] text-[#ccc] font-LexendDeca">
                Report This User
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  },
);

export default OptionsSheet;
