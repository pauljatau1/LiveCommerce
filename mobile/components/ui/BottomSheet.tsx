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
import { Keyboard, StyleSheet } from "react-native";

interface Props extends BottomSheetModalProps {
    index?: number;
    children: ReactNode;
    backgroundColor?: string;
    backDropColor?: string;
    snapStart?: string;
    snapEnd?: string;
    onPressBackDrop?: VoidFunction;
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
            snapStart = "50%",
            snapEnd = "100%",
            onPressBackDrop,
            backgroundColor = "#FDFFFC",
            ...props
        },
        ref
    ) => {
        const sheetRef = useRef<BottomSheetModal>(null);
        const snapPoints = useMemo(
            () => [snapStart, snapEnd],
            [snapStart, snapEnd]
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
                
                onChange={handleSheetChange}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                keyboardBehavior="interactive"
                stackBehavior="push"
                enableDynamicSizing={false}
                handleIndicatorStyle={{
                    width: 41,
                    height: 4,
                    backgroundColor: "#94A3B1",
                }}
                backgroundStyle={[styles.background, { backgroundColor: backgroundColor }]}
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
});
