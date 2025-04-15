import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initializeAuthState } from "@/store/features/auth/authSlice";
import { getToken, getUser } from "@/store/features/auth/utils";

const useInitializeAuthState = () => {
  const dispatch = useDispatch();

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
    };

    fetchInitialState();
  }, [dispatch]);
};

export default useInitializeAuthState;
