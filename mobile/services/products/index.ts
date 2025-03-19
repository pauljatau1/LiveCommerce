import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
// import { API_URL } from '@env'

import { getRequest, putRequest, postRequest } from "@/core";
import { getToken } from "@/store/features/auth/utils";

export const products = createApi({
  reducerPath: "products",
  baseQuery: retry(
    fetchBaseQuery({
      baseUrl: process.env.EXPO_PUBLIC_API_URL + "api",
      prepareHeaders: async (headers) => {
        const token = await getToken();
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
        return headers;
      },
    }),
    { maxRetries: 2 },
  ),
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (credentials) => getRequest(`/products/all`, credentials),
    }),
    getAllAuctionProducts: builder.query({
      query: (credentials) => getRequest(`/products/auctions`, credentials),
      extraOptions: { refetchOnFocus: true },
    }),
    deepSearchProducts: builder.query({
      query: (credentials) => getRequest(`/products/search`, credentials),
    }),
    getSingleProduct: builder.query({
      query: (id) => getRequest(`/products/${id}`),
    }),
    getSellerProducts: builder.query({
      query: (credentials) =>
        getRequest(`/products/seller/${credentials.id}`, credentials),
    }),
    getNewAuqli: builder.query({
      query: (credentials) => getRequest(`/products/just-arrived`, credentials),
    }),
    getTrending: builder.query({
      query: (credentials) => getRequest(`/products/trending`, credentials),
    }),
    getForYou: builder.query({
      query: (credentials) => getRequest(`/products/personalized`, credentials),
    }),
  }),
});

export const {
  useGetAllProductsQuery,
  useGetAllAuctionProductsQuery,
  useGetNewAuqliQuery,
  useGetTrendingQuery,
  useGetSingleProductQuery,
  useGetForYouQuery,
  useDeepSearchProductsQuery,
  useGetSellerProductsQuery,
} = products;
