import { View, Text, FlatList, ScrollViewProps } from "react-native";
import React, { memo } from "react";

export const ScrollView = memo((props: ScrollViewProps) => {
  return (
    <FlatList
      {...props}
      data={[]}
      keyExtractor={(_e, i) => "dom" + i.toString()}
      ListEmptyComponent={null}
      renderItem={null}
      ListHeaderComponent={<>{props.children}</>}
    />
  );
});
