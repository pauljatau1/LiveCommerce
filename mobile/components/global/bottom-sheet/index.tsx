/* eslint-disable max-lines-per-function */
import { icons } from "@/constants";
import { cn } from "@/lib/utils";
import { AntDesign } from "@expo/vector-icons";
import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetHandle,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { FC } from "react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  show: boolean;
  children?: React.ReactNode;
  title?: string;
  childrenStyle?: string;
  bgColor?: string;
  titleColor?: string;
  titleCenter?: boolean;
  onRequestClose?: () => void;
  snapPoints?: string[];
  enableDynamicSizing?: boolean;
  showCloseIcon?: boolean;
  enablePanDownToClose?: boolean;
  footerComponent?: FC<BottomSheetFooterProps>;
  keyboardBehavior: any;
};

const BottomSheet = ({
  show = false,
  children,
  title = "",
  titleCenter = true,
  onRequestClose,
  titleColor,
  snapPoints = [],
  enableDynamicSizing = true,
  showCloseIcon = true,
  enablePanDownToClose = true,
  footerComponent,
  bgColor,
  childrenStyle,
  ...rest
}: Props) => {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const _snapPoints = useMemo(() => snapPoints, [snapPoints]);

  useEffect(() => {
    if (show) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [show]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index < 0) {
        onRequestClose && onRequestClose();
      }
    },
    [onRequestClose],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        opacity={0.7}
        enableTouchThrough={false}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        style={[{ backgroundColor: "#121212" }, StyleSheet.absoluteFillObject]}
        pressBehavior={enablePanDownToClose ? "close" : "none"}
        {...props}
      />
    ),
    [enablePanDownToClose],
  );

  const { bottom } = useSafeAreaInsets();

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      enableDynamicSizing={enableDynamicSizing}
      snapPoints={_snapPoints}
      keyboardBlurBehavior="restore"
      enablePanDownToClose={enablePanDownToClose}
      backgroundStyle={{ ...styles.bottomSheet, backgroundColor: bgColor }}
      onChange={handleSheetChanges}
      handleComponent={enablePanDownToClose ? BottomSheetHandle : null}
      enableHandlePanningGesture={enablePanDownToClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: "#94A3B1",
        width: !enableDynamicSizing ? 0 : 40,
      }}
      footerComponent={footerComponent}
      enableContentPanningGesture={false}
      style={{
        zIndex: 10000000,
      }}
      {...rest}
    >
      <BottomSheetView>
        {showCloseIcon && (
          <Pressable
            onPress={() => {
              onRequestClose && onRequestClose();
            }}
            className="flex-row justify-end px-4"
          >
            <AntDesign name="closecircle" size={30} color="#F9C7B3" />
          </Pressable>
        )}
        {title && (
          <Text
            className={cn(
              `flex-row justify-end px-4 text-lg font-LexendDecaBold font-semibold text-white mb-[26px] mt-[31px] ${titleColor && titleColor}`,
              {
                "text-center": titleCenter,
              },
            )}
          >
            {title}
          </Text>
        )}
        <View
          style={{ marginBottom: bottom }}
          className={cn(`px-4`, childrenStyle)}
        >
          {children}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  bottomSheet: {
    borderTopEndRadius: 20,
    padding: 24,
    backgroundColor: "#FDFFFC",
    flex: 1,
    height: "100%",
  },
});
