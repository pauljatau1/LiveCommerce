import CustomButton from '@/components/global/button/CustomButton';
import CheckBox from '@/components/global/check-box';
import Input from '@/components/global/textInput';
import { FocusAwareStatusBar } from '@/components/ui/focus-aware-status-bar';
import { icons } from '@/constants';
import { toast } from '@/core/toast';
import { useForgotPasswordMutation } from '@/services/auth';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const ForgotPassword = () => {
    const methods = useForm({
        mode: 'onChange',
        defaultValues: {
            email: '',
        },
    });

    const {
        formState: { isValid },
        watch,
    } = methods;

    const data = watch();

    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

    const onSubmit = async () => {
        try {
            const { email } = data;
            const result = await forgotPassword({
                email,
            }).unwrap();
            toast.success("success");
            console.log(result)
            // router.push({
            //     pathname: '/(auth)/reset-password',
            //     params: { email },
            // });
        } catch (error: any) {
            console.log(error);
            toast.error(error.data.message);
        }
    };
    return (
        <>
            <FocusAwareStatusBar barStyle="dark-content" />
            <SafeAreaView className="bg-black h-full">
                <ScrollView>
                    <View className="container h-full w-full justify-between px-[21px]">
                        <View className="w-full">
                            <View className="my-[50px] ">
                                <Image
                                    source={icons.lock}
                                    resizeMode="contain"
                                    className="mx-auto mb-[18px] h-[48px]"
                                />
                                <Text className="mb-2.5 text-center font-SfPro text-xl font-semibold text-white">
                                    Welcome back!
                                </Text>
                                <Text className="text-center font-SfPro text-base text-[#425466]">
                                    Enter your email and we will send you a reset link
                                </Text>
                            </View>
                            <View className="w-full gap-y-4 rounded-[8px] border border-[#C6C6C640] p-8">
                                <FormProvider {...methods}>
                                    <Input
                                        name="email"
                                        label="Email"
                                        placeholder="Enter your email"
                                        keyboardType="email-address"
                                        rules={['required', 'email']}
                                    />
                                    <View className="mt-2 pr-4">
                                        <CheckBox
                                            textStyle="!text-xs !text-[#425466]"
                                            name="remember"
                                            label="By creating an account means you agree to the Terms and Conditions, and our Privacy Policy"
                                        />
                                    </View>
                                    <CustomButton
                                        title='Continue'
                                        // isLoading={isLoading}
                                        disabled={!isValid || isLoading}
                                        onPress={onSubmit}
                                        className="mb-4 mt-[18px] !rounded !text-white"
                                        loading={isLoading}

                                    />


                                </FormProvider>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
};

export default ForgotPassword;
