import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { BASE_URL, BASE_URL_V2 } from "../../Constants/Server";
import { tokenUtils, sellerUtils } from "@/util/auth";
import { notificationService } from "@/util/notificationService";
import axios from 'axios';


const initialState = {
    products: [],
    product: {},
    isProductDetailsFetched: false,
    isLoading: false,
    error: null,
    message: null,
    response: '',
    deleteStatus: false,
    deletedProductId: '',
    auctionProducts: [],
    isLoadingAuctions: false,
    blips: [],
    sellerBlipsInfo: {},
    isLoadingBlips: false,
    blipDetails: null,
    blipComments: [],
    isLoadingBlipDetails: false,
    isLoadingBlipComments: false,
    blipCommentsPagination: {
        total: 0,
        pages: 0,
        currentPage: 1,
        hasMore: false
    },
    blipsPagination: {
        currentPage: 1,
        totalPages: 1,
        totalBlips: 0
    },
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
    productStatistics: {},
    vacationMode: false,
    vacationRequestPending: false,
};


export const createProduct = createAsyncThunk('product/createProduct', async (formData) => {
    try {
        const storedToken = tokenUtils.getBearerToken();

        const response = await axios.post(`${BASE_URL}/products`, formData, {
            headers: {
                Authorization: `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
            },
        });

        if (response.status === 201) {
            console.log("product created response:", response);

            return response.data;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
});

export const fetchSellerProducts = createAsyncThunk('product/fetchSellerProducts', async (params = { page: 1, limit: 10 }) => {
    try {
        const seller = sellerUtils.getSeller();
        console.log("seller:", seller);
        const response = await axios.get(`${BASE_URL}/products/seller/${seller?._id}`, {
            params: {
                page: params.page,
                limit: params.limit,
                sortBy: params.sortBy,
                status: params.status,
                search: params.search,
                minPrice: params.minPrice,
                maxPrice: params.maxPrice,
                startDate: params.startDate,
                endDate: params.endDate
            }
        });
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.log(error);
    }
});

export const fetchSellerAuctionProducts = createAsyncThunk('product/fetchSellerAuctionProducts', async (params = { page: 1, limit: 10 }) => {
    try {
        const seller = sellerUtils.getSeller();
        const response = await axios.get(`${BASE_URL}/products/seller/${seller?._id}/auctions`, {
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
        const storedToken = tokenUtils.getBearerToken();

        const response = await axios.delete(`${BASE_URL}/products/${productId}`, {
            headers: {
                Authorization: `Bearer ${storedToken}`,
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

export const bulkDeleteProducts = createAsyncThunk(
    'product/bulkDeleteProducts',
    async (productIds, { rejectWithValue }) => {
        try {
            const storedToken = tokenUtils.getBearerToken();

            const response = await axios.delete(
                `${BASE_URL_V2}/products/bulk`,
                {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                        'Content-Type': 'application/json'
                    },
                    data: { productIds }
                }
            );

            if (response.status === 200 || response.status === 204) {
                return response.data || { productIds };
            }
        } catch (error) {
            if (!error.response) {
                return rejectWithValue('Network error: Please check your internet connection.');
            }
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const bulkSetProductsDraft = createAsyncThunk(
    'product/bulkSetProductsDraft',
    async (productIds, { rejectWithValue }) => {
        try {
            const storedToken = tokenUtils.getBearerToken();

            const response = await axios.put(
                `${BASE_URL_V2}/products/draft`,
                { productIds },
                {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                return response.data || { productIds };
            }
        } catch (error) {
            if (!error.response) {
                return rejectWithValue('Network error: Please check your internet connection.');
            }
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

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
        const storedToken = tokenUtils.getBearerToken();

        const response = await axios.put(`${BASE_URL}/products/${productId}`, formData, {
            headers: {
                Authorization: `Bearer ${storedToken}`,
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
        const seller = sellerUtils.getSeller();
        const response = await axios.get(`${BASE_URL}/products/seller/${seller?._id}/search`, {
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

export const fetchSellerBlips = createAsyncThunk('product/fetchSellerBlips', async (params = { page: 1, limit: 10 }) => {
    try {
        const seller = sellerUtils.getSeller();
        const response = await axios.get(`${BASE_URL}/products/seller/${seller?._id}/blips`, {
            params: {
                page: params.page,
                limit: params.limit
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

export const fetchBlipDetails = createAsyncThunk('product/fetchBlipDetails', async ({ productId, blipId }) => {
    try {
        const response = await axios.get(`${BASE_URL}/products/${productId}/blips/${blipId}`);
        if (response.status === 200) {
            console.log('Blip details response:', response.data);
            return response.data;
        }
    } catch (error) {
        console.error('Error fetching blip details:', error);
        throw error;
    }
});

export const fetchBlipComments = createAsyncThunk(
    'product/fetchBlipComments', 
    async ({ productId, blipId, page = 1, limit = 10 }) => {
        try {
            const response = await axios.get(
                `${BASE_URL}/products/${productId}/blips/${blipId}/comments`, 
                { params: { page, limit } }
            );
            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
);

export const addReplyToBlipComment = createAsyncThunk(
    'product/addReplyToBlipComment',
    async ({ productId, blipId, commentId, comment }) => {
        try {
            const storedToken = tokenUtils.getBearerToken();

            const response = await axios.post(
                `${BASE_URL}/products/${productId}/blips/${blipId}/comments/${commentId}/replies`,
                { comment },
                {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.status === 201) {
                return response.data;
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            throw error;
        }
    }
);

export const toggleVacationMode = createAsyncThunk(
    'product/toggleVacationMode',
    async (isOn, { rejectWithValue }) => {
        try {
            const storedToken = tokenUtils.getBearerToken();

            const response = await axios.put(
                `${BASE_URL}/seller/vacation-mode`,
                { isOn },
                {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {
            console.error('Error toggling vacation mode:', error);
            return rejectWithValue(error.response?.data?.message || 'Failed to toggle vacation mode');
        }
    }
);

const productSlice = createSlice({
    name: "product",
    initialState,
    reducers: {
        resetResponse: (state) => {
            state.response = '';
        },
        clearBlipDetails: (state) => {
            state.blipDetails = null;
            state.blipComments = [];
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
        // Track product listing with Customer.io
        try {
            const seller = sellerUtils.getSeller();

            if (window.cioanalytics) {
                // First re-identify the user to ensure the connection is active
                window.cioanalytics.identify(seller._id, {
                    seller_id: seller._id,
                    email: seller.email,
                    first_name: seller.firstName,
                    last_name: seller.lastName
                });

                // Track the product listing event after a small delay
                setTimeout(() => {
                    window.cioanalytics.track('product_listed', {
                        product_id: action.payload?.id,
                        category: action.payload?.category,
                        price: `₦${action.payload?.price.toLocaleString('en-NG')}`,
                        stock_level: action.payload?.stock,
                        product_name: action.payload?.name,
                        seller_name: seller.storeName || `${seller.firstName} ${seller.lastName}`,
                        seller_id: seller._id
                    });
                }, 500);
            }
        } catch (trackingError) {
            console.error('Failed to track product creation:', trackingError);
            // Don't throw here - we still want to return the successful response
        }

        notificationService.showSuccess('Product created successfully', 'dismissible');
        state.response = 'success';
        console.log('product created response2:', action.payload);
    }).addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        notificationService.showError('Failed to create product. Please try again', 'dismissible');
    }).addCase(fetchSellerProducts.pending, (state) => {
        state.isLoading = true;
        state.message = null;
    }).addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        console.log('products fetched successfully with redux', action.payload);
        state.message = 'Products fetched successfully';
        state.products = action.payload?.products || [];
        state.pagination = {
            currentPage: action.payload?.currentPage || 1,
            totalPages: action.payload?.totalPages || 1,
            totalProducts: action.payload?.totalProducts || 0
        };
        state.productStatistics = action.payload?.statistics || {};
        state.vacationMode = action.payload?.sellerVacationMode || false;
    }).addCase(fetchSellerProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        notificationService.showError('Failed to fetch products. Please reload the page and try again', 'dismissible');
    }).addCase(deleteProduct.pending, (state, action) => {
        state.deleteStatus = true;
        state.deletedProductId = action.meta.arg
    }).addCase(deleteProduct.fulfilled, (state, action) => {
        console.log(action.payload);
        state.deleteStatus = false;
        state.products = state.products.filter(product => product._id !== action.payload.deletedProduct.id);
        notificationService.showSuccess(`${action.payload.deletedProduct.name} has been deleted successfully`, 'dismissible');
    }).addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.deleteStatus = false;
        state.error = action.error.message;
        notificationService.showError('Failed to delete product. Please try again', 'dismissible');
    }).addCase(bulkDeleteProducts.pending, (state) => {
        state.isLoading = true;
    }).addCase(bulkDeleteProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        const ids = action.meta.arg || action.payload?.productIds || [];
        if (Array.isArray(ids) && ids.length > 0) {
            state.products = state.products.filter(product => !ids.includes(product._id));
        }
        notificationService.showSuccess('Selected products have been deleted successfully', 'dismissible');
    }).addCase(bulkDeleteProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
        notificationService.showError(
            `Failed to delete selected products. ${action.payload || action.error.message || 'Please try again'}`,
            'dismissible'
        );
    }).addCase(getProductDetailsById.pending, (state) => {
        state.isLoading = true;
        state.isProductDetailsFetched = false;
    }).addCase(getProductDetailsById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.product = action.payload;
        state.isProductDetailsFetched = true;
    }).addCase(getProductDetailsById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        notificationService.showError('Failed to fetch product details. Please try again', 'dismissible');
    }).addCase(bulkSetProductsDraft.pending, (state) => {
        state.isLoading = true;
    }).addCase(bulkSetProductsDraft.fulfilled, (state, action) => {
        state.isLoading = false;
        const ids = action.meta.arg || action.payload?.productIds || [];
        if (Array.isArray(ids) && ids.length > 0) {
            state.products = state.products.map(product =>
                ids.includes(product._id)
                    ? { ...product, status: 'draft' }
                    : product
            );
        }
        notificationService.showSuccess('Selected products have been moved to drafts', 'dismissible');
    }).addCase(bulkSetProductsDraft.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error.message;
        notificationService.showError(
            `Failed to move selected products to drafts. ${action.payload || action.error.message || 'Please try again'}`,
            'dismissible'
        );
    }).addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
    }).addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        // Track product update with Customer.io
        try {
            const seller = sellerUtils.getSeller();

            if (window.cioanalytics) {
                // First re-identify the user to ensure the connection is active
                window.cioanalytics.identify(seller._id, {
                    seller_id: seller._id,
                    email: seller.email,
                    first_name: seller.firstName,
                    last_name: seller.lastName
                });

                // Track the product update event after a small delay
                setTimeout(() => {
                    window.cioanalytics.track('product_updated', {
                        product_id: action.payload?.product?.id,
                        category: action.payload?.product?.category,
                        price: `₦${action.payload?.product?.price?.toLocaleString('en-NG')}`,
                        stock_level: action.payload?.product?.stock,
                        product_name: action.payload?.product?.name,
                        seller_name: seller.storeName || `${seller.firstName} ${seller.lastName}`,
                        seller_id: seller._id
                    });
                }, 500);
            }
        } catch (trackingError) {
            console.error('Failed to track product update:', trackingError);
            // Don't throw here - we still want to return the successful response
        }
        notificationService.showSuccess('Product updated successfully', 'dismissible');
        state.response = 'success';
    }).addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        notificationService.showError(`Failed to update product. ${action.error.message}`, 'dismissible');
    }).addCase(fetchSellerAuctionProducts.pending, (state) => {
        state.isLoadingAuctions = true;
    }).addCase(fetchSellerAuctionProducts.fulfilled, (state, action) => {
        state.isLoadingAuctions = false;
        state.auctionProducts = action.payload?.products || [];
        state.auctionPagination = {
            currentPage: action.payload?.currentPage || 1,
            totalPages: action.payload?.totalPages || 1,
            totalProducts: action.payload?.totalProducts || 0
        };
    }).addCase(fetchSellerAuctionProducts.rejected, (state, action) => {
        state.isLoadingAuctions = false;
        state.error = action.error.message;
        notificationService.showError('Failed to fetch auction products. Please reload the page and try again', 'dismissible');
    })
        .addCase(searchSellerProducts.pending, (state) => {
            state.isLoading = true;
            state.message = null;
        })
        .addCase(searchSellerProducts.fulfilled, (state, action) => {
            state.isLoading = false;
            state.message = 'Products search completed successfully';
            state.products = action.payload?.data || [];
            state.pagination = {
                currentPage: action.payload?.pagination?.currentPage || 1,
                totalPages: action.payload?.pagination?.totalPages || 1,
                totalProducts: action.payload?.pagination?.totalProducts || 0
            };
        })
        .addCase(searchSellerProducts.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message;
            notificationService.showError('Failed to search products. Please try again with different search terms', 'dismissible');
        })
        .addCase(fetchSellerBlips.pending, (state) => {
            state.isLoadingBlips = true;
        })
        .addCase(fetchSellerBlips.fulfilled, (state, action) => {
            state.isLoadingBlips = false;
            state.blips = action.payload.blips;
            state.sellerBlipsInfo = action.payload.seller;
            state.blipsPagination = {
                currentPage: action.payload.currentPage,
                totalPages: action.payload.totalPages,
                totalBlips: action.payload.totalBlips
            };
        })
        .addCase(fetchSellerBlips.rejected, (state, action) => {
            state.isLoadingBlips = false;
            state.error = action.error.message;
            notificationService.showError('Failed to fetch blips. Please reload the page and try again', 'dismissible');
        })
        .addCase(fetchBlipDetails.pending, (state) => {
            state.isLoadingBlipDetails = true;
        })
        .addCase(fetchBlipDetails.fulfilled, (state, action) => {
            state.isLoadingBlipDetails = false;
            console.log('Full blip details response:', action.payload);
            
            // Handle different possible response structures
            if (action.payload && action.payload.blip) {
                // Response has the expected structure with a blip object
                state.blipDetails = action.payload.blip;
            } else if (action.payload && action.payload.blips && action.payload.blips.length > 0) {
                // Response has blips in an array (actual structure from the API)
                state.blipDetails = action.payload.blips[0];
                console.log('Extracted blip from blips array:', action.payload.blips[0]);
            } else if (action.payload && typeof action.payload === 'object') {
                // Response might have the blip data directly in the payload
                state.blipDetails = action.payload;
            } else {
                console.error('Unexpected blip details response structure:', action.payload);
                state.blipDetails = null;
            }
            
            console.log('Blip details stored in Redux:', state.blipDetails);
        })
        .addCase(fetchBlipDetails.rejected, (state, action) => {
            state.isLoadingBlipDetails = false;
            console.error('Error in fetchBlipDetails:', action.error);
            state.error = action.error.message || 'Failed to fetch blip details';
            
            notificationService.showError(`Failed to fetch blip details. ${action.error.message || 'Please try again'}`, 'dismissible');
        })
        .addCase(fetchBlipComments.pending, (state) => {
            state.isLoadingBlipComments = true;
        })
        .addCase(fetchBlipComments.fulfilled, (state, action) => {
            state.isLoadingBlipComments = false;
            state.blipComments = action.payload.comments;
            state.blipCommentsPagination = action.payload.pagination;
        })
        .addCase(fetchBlipComments.rejected, (state, action) => {
            state.isLoadingBlipComments = false;
            state.error = action.error.message;
            notificationService.showError('Failed to fetch blip comments. Please try again', 'dismissible');
        })
        .addCase(addReplyToBlipComment.pending, () => {
            // Optionally add a loading state for replies
        })
        .addCase(addReplyToBlipComment.fulfilled, (state, action) => {
            // Find the comment and add the new reply
            const { reply } = action.payload;
            const commentId = action.meta.arg.commentId;
            
            // Find the comment in the current comments array
            const commentIndex = state.blipComments.findIndex(comment => comment._id === commentId);
            
            if (commentIndex !== -1) {
                // Initialize replies array if it doesn't exist
                if (!state.blipComments[commentIndex].replies) {
                    state.blipComments[commentIndex].replies = [];
                }
                
                // Add the new reply to the comment
                state.blipComments[commentIndex].replies.push(reply);
                
                // Update reply count if it exists
                if (state.blipComments[commentIndex].repliesCount !== undefined) {
                    state.blipComments[commentIndex].repliesCount += 1;
                } else {
                    state.blipComments[commentIndex].repliesCount = 1;
                }
            }
            
            notificationService.showSuccess('Reply added successfully', 'dismissible');
        })
        .addCase(addReplyToBlipComment.rejected, (state, action) => {
            state.error = action.error.message;
            notificationService.showError(`Failed to add reply. ${action.error.message || 'Please try again'}`, 'dismissible');
        })
        .addCase(toggleVacationMode.pending, (state) => {
            state.vacationRequestPending = true;
        })
        .addCase(toggleVacationMode.fulfilled, (state, action) => {
            state.isLoading = false;
            state.vacationMode = action.payload.vacationMode.isOn;
            state.vacationRequestPending = false;
            notificationService.showSuccess(`Vacation mode ${action.payload.vacationMode.isOn ? 'enabled' : 'disabled'} successfully`, 'dismissible');
        })
        .addCase(toggleVacationMode.rejected, (state, action) => {
            state.vacationRequestPending = false;
            state.error = action.error.message;
            notificationService.showError(`Failed to toggle vacation mode. ${action.error.message || 'Please try again'}`, 'dismissible');
        })
});

export const { resetResponse, clearBlipDetails } = productSlice.actions;

export default productSlice.reducer;

