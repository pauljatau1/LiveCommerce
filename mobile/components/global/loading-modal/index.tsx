import React, { memo } from "react";
import { Dimensions, Platform } from "react-native";
import { View } from "react-native";
import Modal from "react-native-modal";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LoadingModal = ({ isVisible }: { isVisible: boolean }) => {
  const insets = useSafeAreaInsets();
  const deviceWidth = Dimensions.get("window").width;
  const deviceHeight =
    // Platform.OS === 'ios'
    // ?
    Dimensions.get("window").height;
  // : require('react-native-extra-dimensions-android').get(
  //     'REAL_WINDOW_HEIGHT'
  // );
  // console.log({
  //   deviceHeight,
  //   deviceWidth,
  // });

  return (
    <View className="absolute top-0 left-0 right-0 bottom-0">
      <Modal
        animationIn="slideInUp"
        animationOut="slideOutDown"
        isVisible={isVisible}
        // coverScreen
        // style={{
        //   flex: 1,
        //   margin: 0,
        // }}
        deviceHeight={Dimensions.get("screen").height + insets.top}
        deviceWidth={deviceWidth}
        statusBarTranslucent={true}
      >
        <View className="mx-auto h-14 w-14 justify-center rounded-full border-[0.5px] border-white/20 bg-primary">
          <ActivityIndicator size={24} color="#fff" />
        </View>
      </Modal>
    </View>
  );
};

export default memo(LoadingModal);
