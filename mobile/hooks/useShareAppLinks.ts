import { View, Text, Share, Platform, Alert } from "react-native";
import React from "react";

export function useShareAppLinks() {
  async function displayShareDialog(link: string) {
    try {
      const result = await Share.share(
        Platform.OS == "ios"
          ? {
              url: link,
            }
          : {
              message: link,
            },
      );
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }

  return {
    displayShareDialog,
  };
}
