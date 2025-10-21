import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal,
    BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import React, {
    ReactNode,
    forwardRef,
    useCallback,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetView } from "@gorhom/bottom-sheet";

interface Props extends BottomSheetModalProps {
    index?: number;
    children: ReactNode;
    backgroundColor?: string;
    backDropColor?: string;
    detached?: boolean;
    snapStart?: string;
    snapEnd?: string;
    onPressBackDrop?: VoidFunction;
    enableDynamicSizing?: boolean;
    enablePanDownToClose?: boolean;
}

export interface BottomSheetMethods {
    handleSnapPress: (index?: number) => void;
    handleClosePress: () => void;
}

const Bottomsheet = forwardRef<BottomSheetMethods, Props>(
    (
        {
            index = 0,
            children,
            snapStart = "",
            snapEnd = "",
            onPressBackDrop,
            backgroundColor = "#FDFFFC",
            detached = false,
            enableDynamicSizing = false,
            ...props
        },
        ref
    ) => {
        const { bottom } = useSafeAreaInsets();
        const sheetRef = useRef<BottomSheetModal>(null);
        const snapPoints = useMemo(
            () => (enableDynamicSizing ? [] : [snapStart, snapEnd]),
            [snapStart, snapEnd, enableDynamicSizing]
        );

        const handleSheetChange = useCallback((index: number) => {
            //console.log("handleSheetChange", index);
        }, []);

        const handleSnapPress = useCallback(() => {
            sheetRef.current?.present();
        }, []);

        const handleClosePress = useCallback(() => {
            sheetRef.current?.dismiss();
        }, []);

        useImperativeHandle(
            ref,
            () => ({
                handleSnapPress,
                handleClosePress,
            }),
            [handleSnapPress, handleClosePress]
        );

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    opacity={0.7}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    onPress={() => {
                        Keyboard.dismiss();
                        onPressBackDrop?.()
                    }}
                />
            ),
            []
        );

        return (
            <BottomSheetModal
                ref={sheetRef}
                index={index}
                snapPoints={snapPoints}
                detached={detached}
                onChange={handleSheetChange}
                backdropComponent={renderBackdrop}
                keyboardBehavior="interactive"
                stackBehavior="push"
                enableDynamicSizing={enableDynamicSizing}
                handleIndicatorStyle={{
                    width: 41,
                    height: 4,
                    backgroundColor: "#94A3B1",
                }}
                backgroundStyle={[styles.background, { backgroundColor: backgroundColor }]}
                bottomInset={detached ? bottom + 20 : bottom}
                style={[styles.modal, detached && { marginHorizontal: 20, marginBottom: bottom }]}
                {...props}
            >
                {children}
            </BottomSheetModal>
        );
    }
);

export default Bottomsheet;

const styles = StyleSheet.create({
    background: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modal: {
        zIndex: 10000000,
    },
});
