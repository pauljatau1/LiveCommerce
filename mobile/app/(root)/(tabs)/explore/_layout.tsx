import { RootState } from "@/store";
import { Redirect, Stack } from "expo-router";
import { useSelector } from "react-redux";

const AuthLayout = () => {
  const status = useSelector((state: RootState) => state.authState.status);

  if (status === "signOut") {
    return <Redirect href="/(root)/(auth)/sign-in" />;
  }
  return (
    <Stack>
      <Stack.Screen name="explore" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
    </Stack>
  );
};

export default AuthLayout;
