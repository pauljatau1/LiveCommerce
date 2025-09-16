import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL, BASE_URL_V2 } from "../../Constants/Server";

// Helpers
const getAuthToken = () => {
    const sellerToken = localStorage.getItem("sellerToken");
    if (!sellerToken) return null;
    try {
        const tokenData = JSON.parse(sellerToken);
        return tokenData?.data || null;
    } catch (_) {
        return null;
    }
};

const authHeaders = (extra = {}) => {
    const token = getAuthToken();
    return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extra,
    };
};

// Thunks
export const fetchSellerProfile = createAsyncThunk(
    "orders/fetchSellerProfile",
    async () => {
        const response = await fetch(`${BASE_URL_V2}/sellers/profile`, {
            headers: authHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch seller profile");
        return response.json();
    }
);

export const fetchOrders = createAsyncThunk(
    "orders/fetchOrders",
    async ({ sellerId, params }, { rejectWithValue }) => {
        try {
            const queryParams = new URLSearchParams(params);
            const response = await fetch(`${BASE_URL}/order/seller/${sellerId}?${queryParams}`, {
                headers: authHeaders(),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to fetch orders");
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchOrderDetails = createAsyncThunk(
    "orders/fetchOrderDetails",
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/order/${orderId}`, {
                headers: authHeaders(),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to fetch order details");
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const estimateDeliveryTime = createAsyncThunk(
    "orders/estimateDeliveryTime",
    async (payload, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/order/delivery-time-estimate`, {
                method: "POST",
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to estimate delivery time");
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const arrangePickup = createAsyncThunk(
    "orders/arrangePickup",
    async ({ orderId, payload }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/order/${orderId}/arrange-pickup`, {
                method: "POST",
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to arrange pickup");
            return { orderId, data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const confirmPickup = createAsyncThunk(
    "orders/confirmPickup",
    async ({ orderId, formData }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/pickup/${orderId}/confirm`, {
                method: "POST",
                headers: authHeaders(),
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to confirm pickup");
            return { orderId, data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchManifestUrl = createAsyncThunk(
    "orders/fetchManifestUrl",
    async (trackingNumber, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/order/${trackingNumber}/manifest-url`, {
                headers: authHeaders(),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to fetch manifest");
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchInternationalTracking = createAsyncThunk(
    "orders/fetchInternationalTracking",
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/seller/international/orders/${orderId}/tracking`, {
                headers: authHeaders(),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to fetch tracking");
            return { orderId, data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateInternationalTracking = createAsyncThunk(
    "orders/updateInternationalTracking",
    async ({ orderId, payload }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/seller/international/orders/${orderId}/tracking`, {
                method: "PUT",
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to update tracking information");
            return { orderId, data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateInternationalStatus = createAsyncThunk(
    "orders/updateInternationalStatus",
    async ({ orderId, payload }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/seller/international/orders/${orderId}/status`, {
                method: "PUT",
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to update status");
            return { orderId, data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const cancelOrderBySeller = createAsyncThunk(
    "orders/cancelOrderBySeller",
    async ({ orderId, payload }, { rejectWithValue }) => {
        try {
            const response = await fetch(`${BASE_URL}/v2/order/${orderId}/cancel-by-seller`, {
                method: "POST",
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) return rejectWithValue(data?.message || "Failed to cancel order");
            return { orderId, data };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Slice
const initialState = {
    sellerId: null,
    list: [],
    listLoading: false,
    listError: null,
    pagination: { pages: 1 },
    detailsById: {},
    detailsLoading: false,
    detailsError: null,
    manifest: null,
    sellerProfile: null,
};

const ordersSlice = createSlice({
    name: "orders",
    initialState,
    reducers: {
        clearManifest: (state) => { state.manifest = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSellerProfile.fulfilled, (state, action) => {
                state.sellerId = action.payload?.data?._id || action.payload?._id || null;
                state.sellerProfile = action.payload || null;
            })
            .addCase(fetchOrders.pending, (state) => {
                state.listLoading = true;
                state.listError = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.listLoading = false;
                state.list = action.payload?.orders || [];
                state.pagination = action.payload?.pagination || { pages: 1 };
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.listLoading = false;
                state.listError = action.payload || action.error.message;
            })
            .addCase(fetchOrderDetails.pending, (state) => {
                state.detailsLoading = true;
                state.detailsError = null;
            })
            .addCase(fetchOrderDetails.fulfilled, (state, action) => {
                state.detailsLoading = false;
                const payload = action.payload;
                const orderId = payload?.order?._id || payload?._id;
                if (orderId) state.detailsById[orderId] = payload;
            })
            .addCase(fetchOrderDetails.rejected, (state, action) => {
                state.detailsLoading = false;
                state.detailsError = action.payload || action.error.message;
            })
            .addCase(fetchManifestUrl.fulfilled, (state, action) => {
                state.manifest = action.payload || null;
            })
            .addCase(arrangePickup.fulfilled, (state, action) => {
                const { orderId, data } = action.payload || {};
                if (orderId && state.detailsById[orderId]) {
                    state.detailsById[orderId] = { ...state.detailsById[orderId], ...data };
                }
            })
            .addCase(confirmPickup.fulfilled, (state, action) => {
                const { orderId, data } = action.payload || {};
                if (orderId && state.detailsById[orderId]) {
                    state.detailsById[orderId] = { ...state.detailsById[orderId], ...data };
                }
            })
            .addCase(updateInternationalTracking.fulfilled, (state, action) => {
                const { orderId, data } = action.payload || {};
                if (orderId && state.detailsById[orderId]) {
                    state.detailsById[orderId] = { ...state.detailsById[orderId], ...data };
                }
            })
            .addCase(fetchInternationalTracking.fulfilled, (state, action) => {
                const { orderId, data } = action.payload || {};
                if (orderId && state.detailsById[orderId]) {
                    state.detailsById[orderId] = { ...state.detailsById[orderId], internationalTracking: data };
                }
            })
            .addCase(updateInternationalStatus.fulfilled, (state, action) => {
                const { orderId, data } = action.payload || {};
                if (orderId && state.detailsById[orderId]) {
                    state.detailsById[orderId] = { ...state.detailsById[orderId], ...data };
                }
            })
            .addCase(cancelOrderBySeller.fulfilled, (state, action) => {
                const { orderId, data } = action.payload || {};
                if (orderId && state.detailsById[orderId]) {
                    state.detailsById[orderId] = { ...state.detailsById[orderId], ...data };
                }
            });
    },
});

export const { clearManifest } = ordersSlice.actions;
export default ordersSlice.reducer;


