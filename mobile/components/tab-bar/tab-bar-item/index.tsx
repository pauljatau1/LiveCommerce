import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { cn } from '@/core';

type TabBarItemProps = {
    route: any;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
    label: string;
    iconMap: Record<string, React.ReactNode>;
    options: BottomTabNavigationOptions;
};

export const TabBarItem = ({
    route,
    isFocused,
    onPress,
    onLongPress,
    label,
    iconMap,
    options,
}: TabBarItemProps) => {
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(
            typeof isFocused === 'boolean' ? (isFocused ? 1 : 0) : isFocused,
            {
                duration: 350,
            }
        );
    }, [isFocused, scale]);

    const animatedTextStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scale.value, [0, 1], [0, 1]);
        return {
            opacity,
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <View>
            <Pressable
                key={route.name}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                className={cn(
                    'flex-col items-center justify-center rounded-full ',

                )}
            >
                <View>
                    <Image source={iconMap[route.name]} tintColor={'bg-primary-100'} />
                </View>
                {/* {isFocused && (
                    <Animated.Text
                        style={[animatedTextStyle]}
                        className={cn(
                            'text-sm font-SfPro font-medium leading-7',
                            isFocused ? 'text-primary' : 'text-body-02'
                        )}
                    > */}
                <Text className={`${isFocused ? 'text-primary-100' : 'text-white'} font-LexendDeca text-[7.554px] pt-2`}>{label.toString()}</Text>
                {/* </Animated.Text>
                )} */}
            </Pressable>
        </View>
    );
};
