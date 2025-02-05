import { configureStore } from "@reduxjs/toolkit";

import { auth } from "@/services/auth";

import authStateReducer from "./features/auth/authSlice";
import { rtkQueryErrorLogger } from "./middlewares";
import { category } from "@/services/categories";
import { products } from "@/services/products";
import { posts } from "@/services/posts";

export const store = configureStore({
  reducer: {
    authState: authStateReducer,
    [auth.reducerPath]: auth.reducer,
    [category.reducerPath]: category.reducer,
    [products.reducerPath]: products.reducer,
    [posts.reducerPath]: posts.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      auth.middleware,
      category.middleware,
      products.middleware,
      posts.middleware,
      rtkQueryErrorLogger,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
