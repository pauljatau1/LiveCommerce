import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
// import { API_URL } from '@env'

import { getRequest, putRequest, postRequest, deleteRequest } from "@/core";
import { getToken } from "@/store/features/auth/utils";

export const posts = createApi({
  reducerPath: "posts",
  tagTypes: ["createPost", "createComment", "deletePost"],
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
    getAllPosts: builder.query({
      query: (credentials) => getRequest(`/posts`, credentials),
      providesTags: ["createPost"],
    }),
    getUserPosts: builder.query({
      query: (credentials) =>
        getRequest(
          `/posts/user/${credentials.type}/${credentials.id}`,
          credentials,
        ),
      providesTags: ["createPost", "deletePost"],
    }),
    getTrendingPosts: builder.query({
      query: (credentials) => getRequest(`/posts/trending`, credentials),
    }),
    getNewPosts: builder.query({
      query: (credentials) => getRequest(`/posts/new`, credentials),
    }),
    getComments: builder.query({
      query: (credentials) =>
        getRequest(`/posts/${credentials.id}/comments`, credentials),
    }),
    getReplies: builder.query({
      query: (credentials) =>
        getRequest(
          `/posts/${credentials.id}/comments/${credentials.commentId}/replies`,
          credentials,
        ),
    }),
    createPost: builder.mutation<any, any>({
      query: (credentials) => postRequest("/posts", credentials),
      invalidatesTags: ["createPost"],
    }),
    updatePost: builder.mutation<any, any>({
      query: (credentials) =>
        putRequest(`/posts/${credentials.id}`, credentials),
    }),
    deletePost: builder.mutation<any, any>({
      query: (credentials) =>
        deleteRequest(`/posts/${credentials.id}`, credentials),
      invalidatesTags: ["deletePost"],
    }),
    likePost: builder.mutation<any, any>({
      query: (credentials) =>
        postRequest(`/posts/${credentials.id}/like`, credentials),
    }),
    likeComment: builder.mutation<any, any>({
      query: (credentials) =>
        postRequest(
          `/posts/${credentials.id}/comments/${credentials.commentId}/like`,
          credentials,
        ),
    }),
    likeReply: builder.mutation<any, any>({
      query: (credentials) =>
        postRequest(
          `/posts/${credentials.id}/comments/${credentials.commentId}/replies/${credentials.replyId}/like`,
          credentials,
        ),
    }),
    dislikePost: builder.mutation<any, any>({
      query: (credentials) =>
        postRequest(`/posts/${credentials.id}/dislike`, credentials),
    }),
    reactPost: builder.mutation<any, any>({
      query: (credentials) =>
        postRequest(`/posts/${credentials.id}/reactions`, credentials),
    }),
    commentPost: builder.mutation<any, any>({
      query: (credentials) =>
        postRequest(`/posts/${credentials.id}/comments`, credentials),
    }),
    replyComment: builder.mutation<any, any>({
      query: (credentials) =>
        postRequest(
          `/posts/${credentials.id}/comments/${credentials.commentId}/replies`,
          credentials,
        ),
    }),
    deleteComment: builder.mutation<any, any>({
      query: (credentials) =>
        deleteRequest(
          `/posts/${credentials.id}/comments/${credentials.commentId}`,
          credentials,
        ),
    }),
  }),
});

export const {
  useGetAllPostsQuery,
  useGetUserPostsQuery,
  useGetTrendingPostsQuery,
  useGetNewPostsQuery,
  useGetCommentsQuery,
  useGetRepliesQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useLikeCommentMutation,
  useLikeReplyMutation,
  useDislikePostMutation,
  useReactPostMutation,
  useCommentPostMutation,
  useReplyCommentMutation,
  useDeleteCommentMutation,
} = posts;
