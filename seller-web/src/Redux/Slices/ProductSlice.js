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
    response: ''
};


export const createProduct = createAsyncThunk('product/createProduct', async (formData) => {
    try {
        const storedToken = localStorage.getItem('sellerToken');
        const tokenData = storedToken ? JSON.parse(storedToken) : { data: null, isVerified: null };
        
        const response = await axios.post(`${BASE_URL}/products`, formData, {
            headers: {
                Authorization: `Bearer ${tokenData.data}`,
                'Content-Type': 'multipart/form-data'
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

export const fetchSellerProducts = createAsyncThunk('product/fetchSellerProducts', async () => {
    try {
        const seller = JSON.parse(localStorage.getItem('seller'));
        console.log("seller:", seller);
        const response = await axios.get(`${BASE_URL}/products/seller/${seller._id}`);
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
    }
});


const productSlice = createSlice({
    name: "product",
    initialState,
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
    }).addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.products;
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
    })
});


export default productSlice.reducer;

