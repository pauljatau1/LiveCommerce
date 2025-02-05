import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { API_URL } from '@env'

import { getRequest, putRequest, postRequest } from "@/core";
import { getToken } from "@/store/features/auth/utils";

export const products = createApi({
  reducerPath: "products",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL + "api",
    prepareHeaders: async (headers) => {
      const token = await getToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (credentials) => getRequest(`/products/all`, credentials),
    }),
    deepSearchProducts: builder.query({
      query: (credentials) => getRequest(`/products/search`, credentials),
    }),
    getSingleProduct: builder.query({
      query: (id) => getRequest(`/products/${id}`),
    }),
    getNewAuqli: builder.query({
      query: (credentials) => getRequest(`/products/just-arrived`, credentials),
    }),
    getForYou: builder.query({
      query: (credentials) => getRequest(`/products/personalized`, credentials),
    }),
  }),
});

export const {
  useGetAllProductsQuery,
  useGetNewAuqliQuery,
  useGetSingleProductQuery,
  useGetForYouQuery,
  useDeepSearchProductsQuery,
} = products;
