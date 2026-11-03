import { View, Text, Pressable } from "react-native";
import React, { memo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { formatDate } from "@/helpers/helpers";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";

const statusColor = {
  completed: { name: "Completed", color: "#66CB9F", bg: "#DEFFEE" },
  failed: { name: "Failed", color: "#66CB9F", bg: "#DEFFEE" },
  cancelled: { name: "Cancelled", color: "#66CB9F", bg: "#DEFFEE" },
} as any;

const IOSDatePicker = ({ date, onChangeDate }: any) => {
  const [localDate, setLocalDate] = useState<any>(date);
  return (
    <View className="mt-[10px] my-[20px] items-center px-[20px]">
      <DateTimePicker
        testID="dateTimePicker"
        value={localDate || new Date(Date.now())}
        mode="date"
        // is24Hour={true}
        onChange={(event, selectedDate) => setLocalDate(selectedDate)}
        design="material"
        display="spinner"
        style={{
          height: 200,
          width: "100%",
        }}
      />

      <Pressable
        className="rounded-[6px] bg-[#16783A] px-[20px] w-full py-[10px] mt-[20px] items-center "
        onPress={() => onChangeDate(null, localDate)}
      >
        <Text className="text-white font-LexendDeca text-[14px]">Apply</Text>
      </Pressable>
    </View>
  );
};

export default memo(IOSDatePicker);
