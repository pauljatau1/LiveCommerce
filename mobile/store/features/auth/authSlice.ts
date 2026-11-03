/* eslint-disable unicorn/filename-case */
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

import type { LoginResponse, LoginResponseData, User } from "../../../types/services/auth";
import {
  getToken,
  getUser,
  removeToken,
  removeUser,
  setToken,
  setUser,
} from "./utils";

export interface AuthState {
  user: User | null;
  token: string | null;
  status: "signOut" | "signIn" | "guest" | null;
  signIn: ((data: LoginResponse) => void) | null;
  signOut: (() => void) | null;
}

var initialState: AuthState = {
  user: null,
  token: null,
  status: null,
  signIn: null,
  signOut: null,
};

const setInitialState = async () => {
  console.log("setting");

  const token = await getToken();
  const user = await getUser();

  initialState = {
    user: user,
    token: token,
    status: token ? "signIn" : "signOut",
    signIn: null,
    signOut: null,
  };
  return initialState;
};

setInitialState();

export const authSlice = createSlice({
  name: "authState",
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<User>) => {
      setUser(action.payload);
      state.user = action.payload;
    },
    signIn: (state, action: PayloadAction<LoginResponseData>) => {
      setToken(action?.payload?.token);
      setUser(action?.payload?.user!);
      state.user = action?.payload?.user!;
      state.token = action?.payload?.token;
      state.status = "signIn";
    },
    signInAsGuest: (state) => {
      state.status = "guest";
    },
    signOut: (state) => {
      removeToken();
      removeUser();
      state.user = null;
      state.token = "";
      state.status = "signOut";
    },
    initializeAuthState: (state, action: PayloadAction<AuthState>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.status = action.payload.status;
    },
  },
});

export const {
  signIn,
  signOut,
  signInAsGuest,
  setUserData,
  initializeAuthState,
} = authSlice.actions;

export default authSlice.reducer;
