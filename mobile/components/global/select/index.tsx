/* eslint-disable react-native/no-inline-styles */
/* eslint-disable max-params */
/* eslint-disable max-lines-per-function */
import React, { useEffect, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { FlatList, LogBox, Platform, Pressable, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ProgressBar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheet from '../bottom-sheet';
import { cn } from '@/lib/utils';

export type Option = {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
};

export const Trigger = (selected: Option, label: string) => {
    return (
        <View>
            <View className="flex-row items-center gap-x-2.5">
                {selected?.icon && (
                    <View className="h-8 w-8 overflow-hidden">{selected?.icon}</View>
                )}
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className={cn(
                        'text-white flex-1 text-sm leading-8 tracking-wider font-SfPro',
                        {
                            'text-[#5E5D6F]': !selected?.label,
                        }
                    )}
                >
                    {selected?.label || label}
                </Text>
            </View>
        </View>
    );
};


export const OptionComponent = <T,>(
    option: Option & T,
    selected: Option & T,
    length: number,
    index: number,
    selectionValue?: keyof T
) => {
    return (
        <View
            className={cn(
                'flex-row items-center justify-between gap-x-3 border-b border-stroke py-3',
                {
                    'border-t': index === 0,
                    'py-4': !option.icon,
                }
            )}
        >
            <View className="flex-1 flex-row items-center gap-x-2.5">
                {option.icon && <View className="h-10 w-10">{option.icon}</View>}
                <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="flex-1 font-SfPro text-sm tracking-wider text-body-text"
                >
                    {option.label}
                </Text>
            </View>
            <View
                className={cn(
                    'h-5 w-5 rounded-full border-2 border-stroke justify-center items-center',
                    {
                        'bg-primary border-primary':
                            (selected[selectionValue!] || selected?.value) ===
                            (option[selectionValue!] || option.value),
                    }
                )}
            >
                <View className="h-2 w-2 rounded-full bg-white" />
            </View>
        </View>
    );
};

type SelectProps<T> = {
    label: string;
    optionComponent: (
        option: T,
        selected: T,
        length: number,
        index: number
    ) => React.ReactNode;
    options: T[];
    trigger: (selected: T) => React.ReactNode;
    name: string;
    required?: boolean;
    SelectHeader?: (
        setClose: React.Dispatch<React.SetStateAction<boolean>>
    ) => React.ReactNode;
    estimatedItemSize?: number;
    onSelect?: (item: T) => void;
    onSelectClose?: () => void;
    enableDynamicSizing?: boolean;
    snapPoints?: string[];
    numColumns?: number;
    isLoading?: boolean;
    disabled?: boolean;
    canSelect?: boolean;
};

const Select = <T,>({
    label,
    optionComponent,
    options,
    trigger,
    name,
    SelectHeader,
    required = false,
    isLoading = false,
    disabled = false,
    onSelect,
    canSelect = true,
    onSelectClose,
    numColumns = undefined,
    enableDynamicSizing = true,
    snapPoints = ['50%'],
}: SelectProps<T>) => {
    const [show, setShow] = useState(false);
    const [selected, setSelected] = useState<T>();

    const { field } = useController({
        name,
    });

    useEffect(() => {
        setSelected(field.value);
    }, [field.value]);

    const methods = useFormContext();

    const {
        formState: { errors },
    } = methods;

    const error = errors[name];

    useEffect(() => {
        methods.register(name, { required });
    }, [methods, name, required]);

    const { bottom } = useSafeAreaInsets();

    useEffect(() => {
        LogBox.ignoreAllLogs();
    }, []);

    return (
        <View>
            <Text className="mb-2.5  font-LexendDecaMedium text-white text-sm font-medium">
                {label}
            </Text>
            <Pressable
                className={cn(
                    'flex-row items-center text-white justify-between relative h-[50] px-4 border overflow-hidden rounded-[10] border-[#5E5D6F]',
                    {
                        'border-2 border-primary': show,
                        'border-[#5E5D6F]/30': disabled,
                    }
                )}
                onPress={() => {
                    if (disabled || isLoading) return;
                    setShow((state) => !state);
                }}
            >
                <View className="flex-1 pr-4">{trigger && trigger(selected!)}</View>
                {canSelect && (
                    <View
                        className={cn(
                            'duration-300 w-4 -rotate-90 transform transition-transform',
                            {
                                'rotate-90': show,
                            }
                        )}
                    >
                        {/* <Icons.CaretIcon className="h-2 w-4" /> */}
                        ^
                    </View>
                )}
                <View className="absolute inset-x-0 bottom-[-1] overflow-hidden rounded-[20]">
                    <ProgressBar
                        indeterminate={isLoading}
                        color={"text-primary-200"}
                        style={{ backgroundColor: 'transparent' }}
                    />
                </View>
            </Pressable>

            {errors?.message && (
                <Text className="mt-2 text-left text-xs text-red-500">
                    *{error?.message as string}
                </Text>
            )}
            <BottomSheet
                bgColor="#fff"
                titleColor="!text-black"
                show={show}
                title={label}
                onRequestClose={() => {
                    onSelectClose && onSelectClose();
                    setShow(false);
                }}
                enableDynamicSizing={enableDynamicSizing && options?.length < 15}
                snapPoints={snapPoints}
                showCloseIcon={true}
            >
                {SelectHeader && <View className="">{SelectHeader(setShow)}</View>}
                <View
                    style={{
                        paddingBottom: bottom + (Platform.OS === 'ios' ? 114 : 164),
                    }}
                    className="h-full justify-between"
                >
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <FlatList
                            data={options}
                            keyExtractor={(item:any, index:any) =>
                                item.value ? item.value.toString() : index.toString()
                            }
                            renderItem={({ item, index }) => (
                                <Pressable
                                    onPress={() => {
                                        setSelected(item);
                                        setShow(false);
                                        field.onChange(item);
                                        if (onSelect) {
                                            onSelect(item);
                                        }
                                    }}
                                    className="w-full"
                                >
                                    {optionComponent
                                        ? optionComponent(item, selected || {}, options.length, index)
                                        : null}
                                </Pressable>
                            )}
                        />

                    </ScrollView>
                </View>
            </BottomSheet>
        </View>
    );
};

export default Select;
