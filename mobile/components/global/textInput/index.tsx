/* eslint-disable max-lines-per-function */
import { icons } from "@/constants";
import { cn, numberWithCommas } from "@/lib/utils";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { TextInputProps } from "react-native-paper";
import { ProgressBar, TextInput } from "react-native-paper";

export type InputProps = {
  label?: string;
  errorLabel?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  symbol?: string;
  rules?: Array<keyof ValidationRules>;
  placeholder?: string;
  name: string;
  pattern?: string;
  validRange?: { startDate?: Date; endDate?: Date };
  min?: number;
  outlineColor?: string;
  activeOutlineColor?: string;
  variant?: "outlined" | "flat";
  mode?: "outlined" | "flat";
  max?: number;
  isLoading?: boolean;
  type?:
    | "text"
    | "password"
    | "email"
    | "number"
    | "tel"
    | "date"
    | "time"
    | "search"
    | "quantity"
    | "amount";
  onChange?: (text: string) => void;
  handleOnFocus?: () => void;
  handleOnBlur?: () => void;
} & Pick<
  TextInputProps,
  | "textContentType"
  | "secureTextEntry"
  | "autoCapitalize"
  | "autoCorrect"
  | "style"
  | "editable"
  | "multiline"
  | "keyboardType"
  | "focusable"
  | "onFocus"
  | "onPressIn"
  | "inputMode"
  | "pointerEvents"
>;

type ValidationResult = boolean | string;

export type ValidationRules = {
  email: (value: string, label?: string) => ValidationResult;
  required: (value: string, label?: string) => ValidationResult;
  phone: (value: string, label?: string) => ValidationResult;
  altPhone: (value: string, label?: string) => ValidationResult;
  password: (value: string, label?: string) => ValidationResult;
  otp: (value: string, label?: string) => ValidationResult;
  bvn: (value: string, label?: string) => ValidationResult;
  confirmPassword: (value: string, label?: string) => ValidationResult;
  noSpaces: (value: string, label?: string) => ValidationResult;
  min: (value: string, label?: string) => ValidationResult;
  max: (value: string, label?: string) => ValidationResult;
};

const Input = ({
  label,
  errorLabel,
  name,
  rules = [],
  max,
  min,
  pattern,
  left,
  leftIcon,
  right,
  rightIcon,
  symbol,
  keyboardType,
  autoCapitalize = "none",
  className,
  isLoading = false,
  placeholder,
  secureTextEntry = false,
  disabled = false,
  readOnly = false,
  type = "text",
  onChange,
  handleOnFocus,
  handleOnBlur,
  inputMode,
  multiline,
  validRange,
}: InputProps) => {
  const [isPassword, setIsPassword] = useState(secureTextEntry);

  const { field } = useController({
    name,
  });

  const methods = useFormContext();

  const {
    watch,
    formState: { errors },
  } = methods;

  const error = errors[name];

  const togglePasswordVisibility = () => {
    setIsPassword(!isPassword);
  };

  const validationRules: ValidationRules = {
    required: (value) => {
      if (value !== null && value !== undefined && value !== "") {
        return true;
      } else {
        return `The ${errorLabel || label} field is required`;
      }
    },
    email: (value) => {
      const match = value
        .toString()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        );
      return match
        ? true
        : `The ${errorLabel || label} field has to be a valid email`;
    },
    password: (value) => {
      const messages: string[] = [];

      if (!/[A-Z]/g.test(value)) {
        messages.push("an uppercase letter");
      }
      if (!/[a-z]/g.test(value)) {
        messages.push("a lowercase letter");
      }
      if (!/[0-9]/g.test(value)) {
        messages.push("a number");
      }
      // eslint-disable-next-line no-useless-escape
      if (!/[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g.test(value)) {
        messages.push("a special character");
      }
      if (value.length < 8) {
        messages.push("at least 8 digits");
      }

      const message =
        messages.length > 1
          ? `${messages.slice(0, -1).join(", ")} and ${messages.slice(-1)}`
          : `${messages.join(", ")}`;
      return messages.length > 0
        ? `The ${errorLabel || label} field must have ${message}`
        : true;
    },
    otp: (value) => {
      return value.length === 6
        ? true
        : `The ${errorLabel || label} field must be of length 6`;
    },
    bvn: (value) => {
      return value?.length === 11
        ? true
        : `The ${errorLabel || label} field must be of length 11`;
    },
    phone: (value) => {
      return value.length === 11
        ? true
        : `The ${errorLabel || label} field must be equal to 11 digits`;
    },
    altPhone: (value) => {
      return value.length <= 12
        ? true
        : `The ${
            errorLabel || label
          } field must be less than or equal to 12 digits`;
    },
    confirmPassword: (value) => {
      return value === watch("password") || value === watch("newPassword")
        ? true
        : `The ${
            errorLabel || label
          } field must be equal to the Password field`;
    },
    noSpaces: (value) => {
      return !value.includes(" ")
        ? true
        : `The ${errorLabel || label} field is not allowed to contain spaces`;
    },
    min: (value) => {
      return +value?.replace(/,/g, "") >= min!
        ? true
        : `The ${
            errorLabel || label
          } field must be greater than or equal to ${symbol}${numberWithCommas(
            min!,
          )}`;
    },
    max: (value) => {
      return +value?.replace(/,/g, "") <= max!
        ? true
        : `The ${
            errorLabel || label
          } field must be less than or equal to ${symbol}${numberWithCommas(
            max!,
          )}`;
    },
  };

  const computedRules = rules.reduce<{
    [index: string]: (param: string) => ValidationResult;
  }>((map, key) => {
    map[key] = (value) => validationRules[key](value, label || name);
    return map;
  }, {});

  const register = methods.register(name, {
    validate: computedRules,
    pattern: pattern
      ? {
          value: new RegExp(pattern),
          message: `The ${
            errorLabel || label || name
          } field doesn't satisfy the regex ${pattern}`,
        }
      : undefined,
  });

  return (
    // <KeyboardAvoidingView
    //     behavior={Platform.OS === "ios" ? "padding" : "height"}
    // >

    <View>
      <Text className="mb-[6px] font-LexendDecaMedium text-sm font-medium tracking-wider text-white">
        {label}
      </Text>
      <View className="relative">
        <View className="absolute top-1/2 z-50 -translate-y-1/2">{left}</View>

        <TextInput
          {...register}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          value={field.value}
          placeholder={placeholder}
          disabled={disabled || readOnly}
          secureTextEntry={isPassword}
          className={cn("px-4", className)}
          style={styles.input}
          outlineColor="#5E5D6F"
          placeholderTextColor="#5E5D6F"
          inputMode={inputMode}
          mode="outlined"
          textColor="#fff"
          outlineStyle={styles.outlineStyle}
          error={!!error?.message}
          activeOutlineColor={"#C6C6C6"}
          onChangeText={(text) => {
            const computedText =
              type === "amount"
                ? numberWithCommas(text?.replace(/[^0-9.]/g, ""))
                : text;
            field.onChange(computedText);
            onChange && onChange(computedText);
          }}
          onFocus={handleOnFocus && handleOnFocus}
          onBlur={handleOnBlur && handleOnBlur}
          left={leftIcon}
          right={secureTextEntry ? <></> : rightIcon}
          multiline={multiline}
        />

        <View className="absolute right-0 top-1/2 z-50 -translate-y-1/2">
          {right}
        </View>
        <Pressable
          android_ripple={{
            color: "rgba(200, 200, 200, 0.5)",
            borderless: true,
            radius: 20,
          }}
          onPress={togglePasswordVisibility}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          <>
            {secureTextEntry && (
              <>
                {isPassword ? (
                  <Ionicons name="eye-off" size={20} color="#16783a" />
                ) : (
                  <AntDesign name="eye" size={20} color="#16783a" />
                )}
              </>
            )}
          </>
        </Pressable>
        {isLoading && (
          <ProgressBar className="absolute -top-0.5" indeterminate />
        )}
      </View>
      {error?.message && (
        <Text className="mt-2 text-left font-SfPro text-xs tracking-wider text-red-500">
          *{error?.message as string}
        </Text>
      )}
    </View>
    // </KeyboardAvoidingView>
  );
};

export default Input;

const styles = StyleSheet.create({
  paddingHorizontal: { paddingHorizontal: 0 },
  input: {
    backgroundColor: "transparent",
    fontSize: 14,
    lineHeight: Platform.OS === "ios" ? 18 : 24,
    letterSpacing: 0.5,
    height: 50,
  },
  outlineStyle: {
    borderRadius: 10,
    // border: 1,
  },
});
