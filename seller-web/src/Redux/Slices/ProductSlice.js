import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL } from "../../Constants/Server";
import { toast } from "sonner";
import axios from 'axios';


const initialState = {
    products: [],
    product: {},
    isLoading: false,
    error: null,
    message: null,
    response: '',
    deleteStatus: false,
    deletedProductId: '',
    auctionProducts: [],
    isLoadingAuctions: false,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0
    },
    auctionPagination: {
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0
    },
};


export const createProduct = createAsyncThunk('product/createProduct', async (formData) => {
    try {
        const storedToken = localStorage.getItem('sellerToken');
        const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
        
        const response = await axios.post(`${BASE_URL}/products`, formData, {
            headers: {
                Authorization: `Bearer ${tokenData.data}`,
                'Content-Type': 'application/json'
            },
        });

        if (response.status === 201) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
});

export const fetchSellerProducts = createAsyncThunk('product/fetchSellerProducts', async (params = {page: 1, limit: 10}) => {
    try {
        const seller = JSON.parse(localStorage.getItem('seller'));
        console.log("seller:", seller);
        const response = await axios.get(`${BASE_URL}/products/seller/${seller._id}`, {
            params: {
                page: params.page,
                limit: params.limit,
                sortBy: params.sortBy,
                status: params.status,
                search: params.search
            }
        });
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
    }
});

export const fetchSellerAuctionProducts = createAsyncThunk('product/fetchSellerAuctionProducts', async (params = {page: 1, limit: 10}) => {
    try {
        const seller = JSON.parse(localStorage.getItem('seller'));
        const response = await axios.get(`${BASE_URL}/products/seller/${seller._id}/auctions`, {
            params: {
                page: params.page,
                limit: params.limit,
                search: params.search
            }
        });
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
});

export const deleteProduct = createAsyncThunk('product/deleteProduct', async (productId, { rejectWithValue }) => {
    try {
        const storedToken = localStorage.getItem('sellerToken');
        const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };

        const response = await axios.delete(`${BASE_URL}/products/${productId}`, {
            headers: {
                Authorization: `Bearer ${tokenData.data}`,
            },
        });
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        if (!error.response) {
            // Network error
            return rejectWithValue('Network error: Please check your internet connection.');
        }
        console.log(error);
        return rejectWithValue(error.message);
    }
});

export const getProductDetailsById = createAsyncThunk('product/getProductDetailsById', async (productId) => {
    try {
        const response = await axios.get(`${BASE_URL}/products/${productId}`);
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
    }
});

export const updateProduct = createAsyncThunk('product/updateProduct', async ({ productId, formData }) => {
    try {
        const storedToken = localStorage.getItem('sellerToken');
        const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
        
        const response = await axios.put(`${BASE_URL}/products/${productId}`, formData, {
            headers: {
                Authorization: `Bearer ${tokenData.data}`,
                'Content-Type': 'application/json'
            },
        });

        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
});

export const searchSellerProducts = createAsyncThunk('product/searchSellerProducts', async (params = {}) => {
    try {
        const seller = JSON.parse(localStorage.getItem('seller'));
        const response = await axios.get(`${BASE_URL}/products/seller/${seller._id}/search`, {
            params: {
                query: params.search,
                page: params.page || 1,
                limit: params.limit || 10,
                sortBy: params.sortBy,
                order: params.order,
                minPrice: params.minPrice,
                maxPrice: params.maxPrice,
                category: params.category,
                status: params.status
            }
        });
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
});

const productSlice = createSlice({
    name: "product",
    initialState,
    reducers: {
        resetResponse: (state) => {
            state.response = '';
        }
    },
    extraReducers: (builder) => builder.addCase(
        createProduct.pending, (state) => {
            state.isLoading = true;
            state.response = 'pending';
        }
    ).addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        toast.success('Product created successfully', {
            description: "Product has been created successfully",
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
        state.response = 'success';
        console.log(action.payload);
    }).addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        toast.error('Failed to create product', {
            description: "Please try again",
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
    }).addCase(fetchSellerProducts.pending, (state) => {
        state.isLoading = true;
        state.message = null;
    }).addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('products fetched successfully', action.payload);
        state.message = 'Products fetched successfully';
        state.products = action.payload.products;
        state.pagination = {
            currentPage: action.payload.currentPage,
            totalPages: action.payload.totalPages,
            totalProducts: action.payload.totalProducts
        };
    }).addCase(fetchSellerProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        toast.error('Failed to fetch products', {
            description: "Please reload the page and try again",
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
    }).addCase(deleteProduct.pending, (state, action) => {
        state.deleteStatus = true;
        state.deletedProductId = action.meta.arg
    }).addCase(deleteProduct.fulfilled, (state, action) => {
        console.log(action.payload);
        state.deleteStatus = false;
        state.products = state.products.filter(product => product._id !== action.payload.deletedProduct.id);
        toast.success(`${action.payload.deletedProduct.name} has been deleted successfully`, {
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
    }).addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.deleteStatus = false;
        state.error = action.error.message;
        toast.error('Failed to delete product', {
            description: "Please try again",
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
    }).addCase(getProductDetailsById.pending, (state) => {
        state.isLoading = true;
    }).addCase(getProductDetailsById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.product = action.payload;
    }).addCase(getProductDetailsById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        toast.error('Failed to fetch product details', {
            description: "Please try again",
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
    }).addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
    }).addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        toast.success('Product updated successfully', {
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
        state.response = 'success';
    }).addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        toast.error('Failed to update product', {
            description: action.error.message,
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
    }).addCase(fetchSellerAuctionProducts.pending, (state) => {
        state.isLoadingAuctions = true;
    }).addCase(fetchSellerAuctionProducts.fulfilled, (state, action) => {
        state.isLoadingAuctions = false;
        state.auctionProducts = action.payload.products;
        state.auctionPagination = {
            currentPage: action.payload.currentPage,
            totalPages: action.payload.totalPages,
            totalProducts: action.payload.totalProducts
        };
    }).addCase(fetchSellerAuctionProducts.rejected, (state, action) => {
        state.isLoadingAuctions = false;
        state.error = action.error.message;
        toast.error('Failed to fetch auction products', {
            description: "Please reload the page and try again",
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
    })
    .addCase(searchSellerProducts.pending, (state) => {
        state.isLoading = true;
        state.message = null;
    })
    .addCase(searchSellerProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = 'Products search completed successfully';
        state.products = action.payload.data;
        state.pagination = {
            currentPage: action.payload.pagination.currentPage,
            totalPages: action.payload.pagination.totalPages,
            totalProducts: action.payload.pagination.totalProducts
        };
    })
    .addCase(searchSellerProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        toast.error('Failed to search products', {
            description: "Please try again with different search terms",
            style: {
                background: '#05031F',
                color: '#fff',
            }
        });
    })
});

export const { resetResponse } = productSlice.actions;

export default productSlice.reducer;

