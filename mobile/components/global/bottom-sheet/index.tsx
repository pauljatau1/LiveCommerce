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
import React, { useCallback, useEffect, useMemo, useRef, memo } from "react";
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
  keyboardBehavior?: "interactive" | "extend" | "fillParent";
  enableContentPanningGesture?: boolean;
  handleIndicatorStyle?: any;
};

const BottomSheetComponent = ({
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
  bgColor = "#FDFFFC",
  childrenStyle,
  enableContentPanningGesture = false,
  keyboardBehavior = "interactive",
  ...rest
}: Props) => {
  // Use a persistent ref to avoid unnecessary re-creation of the ref
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  
  // Cache the onRequestClose function to avoid recreating it on each render
  const onRequestCloseRef = useRef(onRequestClose);
  
  // Get safe area insets at the top level
  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  
  // Update ref when onRequestClose changes
  useEffect(() => {
    onRequestCloseRef.current = onRequestClose;
  }, [onRequestClose]);

  // Memoize snapPoints to prevent unnecessary recalculations
  const _snapPoints = useMemo(() => snapPoints, [snapPoints]);

  // Optimized backdrop/background styles
  const backgroundStyle = useMemo(() => ({ 
    ...styles.bottomSheet, 
    backgroundColor: bgColor 
  }), [bgColor]);

  // Handle indicator style optimization
  const handleIndicatorStyle = useMemo(() => ({
    backgroundColor: "#94A3B1",
    width: !enableDynamicSizing ? 0 : 40,
  }), [enableDynamicSizing]);

  // Memoize styles for content container to reduce recalculation
  const contentContainerStyle = useMemo(() => ({
    marginBottom: safeAreaBottom
  }), [safeAreaBottom]);

  // Optimize child container style with className
  const childrenContainerClassName = useMemo(() => (
    cn(`px-4`, childrenStyle)
  ), [childrenStyle]);
  
  // Optimize title className
  const titleClassName = useMemo(() => (
    cn(
      `flex-row justify-end px-4 text-lg font-LexendDecaBold font-semibold text-white mb-[26px] mt-[31px] ${titleColor || ''}`,
      {
        "text-center": titleCenter,
      },
    )
  ), [titleColor, titleCenter]);

  // Use useEffect with show dependency to present/dismiss the sheet
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (show) {
        bottomSheetModalRef.current?.present();
      } else {
        bottomSheetModalRef.current?.dismiss();
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [show]);

  // Highly optimized callback for sheet index changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index < 0 && onRequestCloseRef.current) {
      onRequestCloseRef.current();
    }
  }, []);

  // Memoized backdrop component for better performance
  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      opacity={0.7}
      enableTouchThrough={false}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      style={styles.backdrop}
      pressBehavior={enablePanDownToClose ? "close" : "none"}
      {...props}
    />
  ), [enablePanDownToClose]);

  // Handle close button press with useCallback
  const handleClosePress = useCallback(() => {
    if (onRequestCloseRef.current) {
      onRequestCloseRef.current();
    }
  }, []);

  // High-performance rendering of title and close icon
  const renderHeader = useMemo(() => {
    if (!title && !showCloseIcon) return null;
    
    return (
      <>
        {showCloseIcon && (
          <Pressable
            onPress={handleClosePress}
            className="flex-row justify-end px-4"
            hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
          >
            <AntDesign name="closecircle" size={30} color="#F9C7B3" />
          </Pressable>
        )}
        {title ? (
          <Text className={titleClassName}>
            {title}
          </Text>
        ) : null}
      </>
    );
  }, [title, showCloseIcon, handleClosePress, titleClassName]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      enableDynamicSizing={enableDynamicSizing}
      snapPoints={_snapPoints}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior="restore"
      enablePanDownToClose={enablePanDownToClose}
      backgroundStyle={backgroundStyle}
      onChange={handleSheetChanges}
      handleComponent={enablePanDownToClose ? BottomSheetHandle : null}
      enableHandlePanningGesture={enablePanDownToClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={handleIndicatorStyle}
      footerComponent={footerComponent}
      enableContentPanningGesture={enableContentPanningGesture}
      animateOnMount
      overDragResistanceFactor={8}
      style={styles.modal}
      {...rest}
    >
      <BottomSheetView style={styles.contentView}>
        {renderHeader}
        <View
          style={contentContainerStyle}
          className={childrenContainerClassName}
        >
          {children}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

// Memoize the BottomSheet component to prevent unnecessary re-renders
const BottomSheet = memo(BottomSheetComponent);

// Performance optimized styles using StyleSheet.create
const styles = StyleSheet.create({
  bottomSheet: {
    borderTopEndRadius: 20,
    padding: 24,
    backgroundColor: "#FDFFFC",
    flex: 1,
    height: "100%",
  },
  backdrop: {
    backgroundColor: "#121212", 
    ...StyleSheet.absoluteFillObject
  },
  modal: {
    zIndex: 10000000,
  },
  contentView: {
    flex: 1,
  }
});

export default BottomSheet;
