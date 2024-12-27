import { configureStore } from "@reduxjs/toolkit";
import productSlice from "./Slices/ProductSlice";
import { thunk } from "redux-thunk";

const store = configureStore({
    reducer: {
        product: productSlice
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk)
});

export default store;
