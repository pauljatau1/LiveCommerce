import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initializeAuthState } from "@/store/features/auth/authSlice";
import { getToken, getUser } from "@/store/features/auth/utils";
import useClarity from "./useClarity";
import { getUserAttributesForClarity } from "@/utils/clarityUtils";

const useInitializeAuthState = () => {
  const dispatch = useDispatch();
  const { identifyUser, clearUserIdentity, isInitialized: isClarityInitialized } = useClarity();

  // Initialize auth state and identify the user in Clarity if logged in
  useEffect(() => {
    const fetchInitialState = async () => {
      const token = await getToken();
      const user = await getUser();

      dispatch(
        initializeAuthState({
          user,
          token,
          status: token ? "signIn" : "signOut",
          signIn: null,
          signOut: null,
        }),
      );

      // Identify user in Clarity if logged in and Clarity is initialized
      if (token && user && isClarityInitialized) {
        try {
          const userAttributes = await getUserAttributesForClarity();
          if (userAttributes) {
            identifyUser(userAttributes);
            console.log('User identified in Clarity analytics:', user.username || user.email);
          }
        } catch (error) {
          console.error('Failed to identify user in Clarity:', error);
        }
      } else if (!token && isClarityInitialized) {
        // Clear user identity if logged out
        clearUserIdentity();
      }
    };

    fetchInitialState();
  }, [dispatch, isClarityInitialized]);
};

export default useInitializeAuthState;
