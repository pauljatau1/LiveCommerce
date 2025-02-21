/* eslint-disable max-lines-per-function */
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import { View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/core";

import { TabBarItem } from "./tab-bar-item";

const TabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={{ paddingBottom: bottom || 16 }}
      className={cn(
        "w-full flex-row items-center justify-around  bg-black-100 px-2 py-4 h-[80px]",
      )}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;
        if (["marketplace"].includes(route.name)) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const icons = {
          home: require("@/assets/icons/home.png"),
          explore: require("@/assets/icons/internet.png"),
          blips: require("@/assets/icons/blip.png"),
          profile: require("@/assets/icons/profile.jpg"),
          messages: require("@/assets/icons/mail-open.png"),
          connect: require("@/assets/icons/connect.png"),
        };

        return (
          <TabBarItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            label={label.toString()}
            iconMap={icons}
            options={options}
          />
        );
      })}
    </View>
  );
};

export default TabBar;
