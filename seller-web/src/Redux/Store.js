import { configureStore } from "@reduxjs/toolkit";
import productSlice from "./Slices/ProductSlice";
import ordersSlice from "./Slices/OrdersSlice";
import { thunk } from "redux-thunk";

const store = configureStore({
    reducer: {
        product: productSlice,
        orders: ordersSlice
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk)
});

export default store;
