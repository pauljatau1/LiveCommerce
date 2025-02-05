import { RootState } from '@/store';
import { Redirect, Stack } from "expo-router";
import { useSelector } from 'react-redux';

const AuthLayout  = () => {
    const status = useSelector((state: RootState) => state.authState.status);

    if (status === 'signIn') {
        return <Redirect href="/home" />
    }
    return (
        <Stack>
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="verify-code" options={{ headerShown: false }} />
        </Stack>
    );
};

export default AuthLayout;
