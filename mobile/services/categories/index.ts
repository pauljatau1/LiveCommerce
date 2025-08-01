import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
// import { API_URL } from '@env'

import { getRequest, putRequest, postRequest } from "@/core";
import { getToken } from "@/store/features/auth/utils";
import { SelectedCategoriesRequest } from "@/types/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const category = createApi({
  reducerPath: "category",
  baseQuery: retry(
    fetchBaseQuery({
      baseUrl: process.env.EXPO_PUBLIC_API_URL + "api",
      prepareHeaders: async (headers) => {
        var token = await getToken();
        var registerPayload = await AsyncStorage.getItem("registerPayload");
        if (registerPayload)
          var tokenFromSignup = JSON.parse(registerPayload!).token;
        if (token || tokenFromSignup) {
          headers.set("authorization", `Bearer ${token || tokenFromSignup}`);
        }
        return headers;
      },
    }),
    { maxRetries: 1 },
  ),
  endpoints: (builder) => ({
    uploadCategories: builder.mutation<any, any>({
      query: (credentials) =>
        putRequest("/v2/buyers/selected-categories", credentials),
    }),
    getAllCategories: builder.query({
      query: (credentials) => getRequest("/public/categories", credentials),
    }),
  }),
});

export const { useUploadCategoriesMutation, useGetAllCategoriesQuery } =
  category;
