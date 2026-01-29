import { toast } from 'sonner';
import { BASE_URL } from "../Constants/Server";
import { trackEvent } from "../util/analytics";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import { useLivestreamSocket } from "./LivestreamSocketContext";
import { createContext, useReducer, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import axios from "axios";

const LivestreamContext = createContext();

export const LivestreamProvider = ({ children }) => {
    const { token, seller, isAuthenticated } = useAuthContext();
    const { disconnectSocket } = useLivestreamSocket();
    const initialState = {
        livestream: {
            title: '',
            description: '',
            category: '',
            subCategory: '',
            coverPhoto: null,
            video: null,
            tags: [],
            products: [],
            selectedProducts: [],
            scheduledStartTime: null,
            startImmediately: false
        },
        isLoading: false,
        error: null,
        message: null,
        activeStreams: null,
        livestreaming: null,
        fetchedLiveStreams: [],
        liveStreamDetails: null,
        hasLiveStreamStarted: false,
        hasLiveStreamEnded: false,
        joinLiveStreamData: null,
        isActivatingBid: false,
        streamsPagination: {
            currentPage: 1,
            totalPages: 1,
            totalStreams: 0,
            limit: 10
        }
    };

    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'SET_LOADING':
                return { ...state, isLoading: action.payload };
            case 'SET_ACTIVATING_BID':
                return { ...state, isActivatingBid: action.payload };
            case 'SET_LIVESTREAM_DATA':
                return {
                    ...state,
                    livestream: {
                        ...state.livestream,
                        ...action.payload
                    }
                }
            case 'SET_SUCCESS_LIVESTREAM_SCHEDULE':
                return {
                    ...state,
                    message: action.payload,
                }
            case 'RESET_API_STATE':
                return {
                    ...state,
                    isLoading: false,
                    error: null,
                    message: null
                }
            case 'STORE_ACTIVE_STREAMS':
                return {
                    ...state,
                    activeStreams: action.payload
                }
            case 'SET_SUCCESS_LIVESTREAM_START':
                return {
                    ...state,
                    activeStreams: {
                        ...state.activeStreams,
                        status: 'live',
                        actualStartTime: new Date().toISOString()
                    },
                    livestreamDetails: action.payload,
                    hasLivestreamEnded: false,
                    hasLiveStreamStarted: true,
                    error: null
                }
            case 'SET_SUCCESS_LIVESTREAM_STOP':
                return {
                    ...state,
                    livestreamDetails: null,
                    hasLiveStreamStarted: false,
                    hasLiveStreamEnded: true,
                    error: null
                }
            case 'SET_SUCCESS_MESSAGE':
                return {
                    ...state,
                    successMessage: action.payload,
                    error: null
                }
            case 'SET_FETCHED_LIVE_STREAMS':
                return {
                    ...state,
                    fetchedLiveStreams: action.payload
                }
            case 'SET_STREAMS_PAGINATION':
                return {
                    ...state,
                    streamsPagination: {
                        ...state.streamsPagination,
                        ...action.payload
                    }
                }
            case 'SET_ERROR':
                return {
                    ...state,
                    error: action.payload,
                    loading: false,
                    success: false
                }
            case 'SET_LIVE_STREAM_DETAILS':
                return {
                    ...state,
                    liveStreamDetails: action.payload
                }
            case 'UPDATE_PRODUCT_BID_STATUS':
                return {
                    ...state,
                    liveStreamDetails: {
                        ...state.liveStreamDetails,
                        products: action.payload
                    }
                }
            case 'RESET_SCHEDULE_DATA':
                return {
                    ...state,
                    livestream: {
                        title: '',
                        description: '',
                        category: '',
                        subCategory: '',
                        coverPhoto: null,
                        tags: [],
                        products: [],
                        selectedProducts: [],
                        scheduledStartTime: null,
                        startImmediately: false
                    }
                }
            case 'SET_JOIN_LIVE_STREAM_DATA':
                return {
                    ...state,
                    joinLiveStreamData: action.payload,
                    liveStreamDetails: action.payload.stream,
                }
            default:
                return state;
        }
    }, initialState);

    // Watch for authentication state changes and reset livestream data when user is not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            console.log('🔌 [LIVESTREAM CONTEXT] User not authenticated, resetting livestream data...');
            
            // Reset all livestream-related state
            dispatch({ type: 'RESET_API_STATE' });
            dispatch({ type: 'RESET_SCHEDULE_DATA' });
            dispatch({ type: 'SET_SUCCESS_LIVESTREAM_STOP' });
            console.log('🔌 [LIVESTREAM CONTEXT] Livestream data reset completed');
        }
    }, [isAuthenticated]);

    const scheduleLiveShow = async (streamData) => {
        try {
            dispatch({ type: 'RESET_API_STATE' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = token?.data;
            const sellerData = seller;

            const response = await axios.post(`${BASE_URL}/streams/open-live-show`, streamData, {
                headers: {
                    Authorization: `Bearer ${sellerToken}`,
                    // Let browser set Content-Type with boundary automatically
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 201) {
                dispatch({ type: 'SET_SUCCESS_LIVESTREAM_SCHEDULE', payload: 'livestream scheduled successfully' });
                dispatch({ type: 'STORE_ACTIVE_STREAMS', payload: response.data.stream });
                dispatch({ type: "RESET_SCHEDULE_DATA" })
                trackEvent("Live Show Scheduled", {
                    "seller id": sellerData._id,
                    "seller email": sellerData.email,
                    "seller store name": sellerData.storeName,
                    "seller first name": sellerData.firstName,
                    "seller last name": sellerData.lastName,
                    "seller phone number": sellerData.phoneNumber,
                    "stream title": streamData.title,
                    "stream description": streamData.description,
                    "stream category": streamData.category,
                    "stream tags": streamData.tags,
                    "stream products": streamData.products,
                    "stream scheduled start time": streamData.scheduledStartTime,
                    "stream cover photo": streamData.coverImage ? "uploaded" : "not uploaded",
                    "stream video": streamData.video ? "uploaded" : "not uploaded",
                });
                return response.data.stream;
            }
        } catch (error) {
            console.error(error);
            toast.error('Error scheduling livestream', {
                description: error.response?.data?.message || 'Failed to schedule livestream',
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }
    const scheduleLiveAuction = async (streamData) => {
        try {
            dispatch({ type: 'RESET_API_STATE' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = token?.data;
            const sellerData = seller;
            const response = await axios.post(`${BASE_URL}/streams/create`, streamData, {
                headers: {
                    Authorization: `Bearer ${sellerToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(response);
            if (response.status === 201) {
                dispatch({ type: 'SET_SUCCESS_LIVESTREAM_SCHEDULE', payload: 'livestream scheduled successfully' });
                dispatch({ type: 'STORE_ACTIVE_STREAMS', payload: response.data.stream });
                dispatch({ type: "RESET_SCHEDULE_DATA" })
                trackEvent("Live Auction Scheduled", {
                    "seller id": sellerData._id,
                    "seller email": sellerData.email,
                    "seller store name": sellerData.storeName,
                    "seller first name": sellerData.firstName,
                    "seller last name": sellerData.lastName,  
                    "seller phone number": sellerData.phoneNumber,
                    "stream title": streamData.title,
                    "stream description": streamData.description,
                    "stream category": streamData.category,
                    "stream tags": streamData.tags,
                    "stream products": streamData.products,
                    "stream scheduled start time": streamData.scheduledStartTime,
                    "stream cover photo": streamData.coverImage ? "uploaded" : "not uploaded",
                    "stream video": streamData.video ? "uploaded" : "not uploaded",
                });

                return response.data.stream;
            }
        } catch (error) {
            console.error(error);
            toast.error('Error scheduling livestream', {
                description: error.response.data.message,
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }

    const getAllSellerActiveStreams = useCallback(async (page = 1, limit = 10, status = null) => {
        try {
            dispatch({ type: 'RESET_API_STATE' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = token?.data;
            
            if (!seller?._id) {
                dispatch({ type: 'SET_LOADING', payload: false });
                return;
            }
            
            // Build query parameters
            const params = {
                page,
                limit
            };
            
            // Add status filter if provided
            if (status) {
                params.status = status;
            }
            
            const response = await axios.get(`${BASE_URL}/streams/seller/${seller._id}`, {
                params,
                headers: {
                    Authorization: `Bearer ${sellerToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('active streams', response);
            
            // Update streams data
            dispatch({ type: 'SET_FETCHED_LIVE_STREAMS', payload: response.data.streams || [] });
            
            // Update pagination metadata - map API response structure (pages, total) to internal state
            if (response.data.pagination) {
                dispatch({
                    type: 'SET_STREAMS_PAGINATION',
                    payload: {
                        currentPage: response.data.pagination.currentPage || page,
                        // Map 'pages' from API to 'totalPages' in state
                        totalPages: response.data.pagination.pages || response.data.pagination.totalPages || 1,
                        // Map 'total' from API to 'totalStreams' in state
                        totalStreams: response.data.pagination.total || response.data.pagination.totalStreams || response.data.streams?.length || 0,
                        limit: limit
                    }
                });
            } else {
                // Fallback if pagination data is not in expected format
                dispatch({
                    type: 'SET_STREAMS_PAGINATION',
                    payload: {
                        currentPage: response.data.currentPage || page,
                        totalPages: response.data.pages || response.data.totalPages || 1,
                        totalStreams: response.data.total || response.data.totalStreams || response.data.streams?.length || 0,
                        limit: limit
                    }
                });
            }
        } catch (error) {
            console.error(error);
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.message || 'Failed to fetch streams'
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [token, seller]);

    const startLiveStream = async (streamId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const sellerToken = token?.data;
            const sellerData = seller;

            if (!sellerToken) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(
                `${BASE_URL}/streams/${streamId}/start`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${sellerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                const streamData = response.data.stream;

                dispatch({
                    type: 'SET_SUCCESS_LIVESTREAM_START',
                    payload: streamData
                });

                toast.success('Livestream started successfully', {
                    style: {
                        background: '#161A1E',
                        color: '#fff',
                    }
                });

                trackEvent("Live Show Started", {
                    "seller id": sellerData._id,
                    "seller email": sellerData.email,
                    "seller store name": sellerData.storeName,
                    "seller first name": sellerData.firstName,
                    "seller last name": sellerData.lastName,
                    "stream id": streamId,
                    "stream title": streamData.title,
                    "stream description": streamData.description,
                    "stream category": streamData.category,
                    "stream tags": streamData.tags,
                    "stream products": streamData.products,
                    "channel name": streamData.channelName,
                    "agora token": streamData.agoraToken,
                    "stream scheduled start time": streamData.scheduledStartTime,
                });
                
                // Track stream start with Customer.io
                try {
                    if (window.cioanalytics) {
                        // First re-identify the user to ensure the connection is active
                        window.cioanalytics.identify(sellerData._id, {
                            seller_id: sellerData._id,
                            email: sellerData.email,
                            first_name: sellerData.firstName,
                            last_name: sellerData.lastName
                        });
                        
                        // Track the live event started
                        setTimeout(() => {
                            window.cioanalytics.track('live_event_started', {
                                event_id: streamId,
                                seller_id: sellerData._id,
                                date_time: new Date().toISOString(),
                                event_type: streamData.type || 'live_show',
                                event_title: streamData.title,
                                product_count: streamData.products?.length || 0,
                                scheduled_start_time: streamData.scheduledStartTime
                            });
                        }, 500);
                    }
                } catch (trackingError) {
                    console.error('Failed to track live event start:', trackingError);
                }

                return streamData;
            }
            return null;
        } catch (error) {
            console.error('Start livestream error:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.message || error.message
            });
            
            // Don't show toast for 404 "Stream not found" errors - let the modal handle it
            const isStreamNotFound = error.response?.status === 404 &&
                (error.response?.data?.message === 'Stream not found' ||
                 error.response?.data?.error === 'Stream not found' ||
                 error.message?.includes('Stream not found'));
            
            if (!isStreamNotFound) {
                toast.error('Error starting livestream', {
                    description: error.response?.data?.message || 'Something went wrong',
                    style: {
                        background: '#161A1E',
                        color: '#fff',
                    }
                });
            }
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const endLiveStream = async (streamId, streamData) => {
        try {
            const sellerToken = token?.data;
            const sellerData = seller;

            if (!sellerToken) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(
                `${BASE_URL}/streams/${streamId}/end`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${sellerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Make sure the response includes fresh Agora tokens
                console.log('stream ended', response);

                dispatch({ type: 'SET_SUCCESS_LIVESTREAM_STOP' });
                toast.success('Livestream ended successfully', {
                    style: {
                        background: '#161A1E',
                        color: '#fff',
                    }
                });

                // Track the livestream end event
                trackEvent("Live Stream Ended", {
                    "seller id": sellerData._id,
                    "seller email": sellerData.email,
                    "seller store name": sellerData.storeName,
                    "seller first name": sellerData.firstName,
                    "seller last name": sellerData.lastName,
                    "stream id": streamId,
                    "stream title": streamData.title,
                    "stream scheduled start time": streamData.scheduledStartTime,
                    "livestream type": streamData.type
                });
                
                // Track stream end with Customer.io
                try {
                    if (window.cioanalytics) {
                        // First re-identify the user to ensure the connection is active
                        window.cioanalytics.identify(sellerData._id, {
                            seller_id: sellerData._id,
                            email: sellerData.email,
                            first_name: sellerData.firstName,
                            last_name: sellerData.lastName
                        });
                        
                        // Track the live event ended
                        setTimeout(() => {
                            window.cioanalytics.track('live_event_ended', {
                                event_id: streamId,
                                seller_id: sellerData._id,
                                date_time: new Date().toISOString(),
                                event_type: streamData.type || 'live_show',
                                event_title: streamData.title,
                                stream_duration_minutes: calculateStreamDuration(streamData),
                                scheduled_start_time: streamData.scheduledStartTime
                            });
                        }, 500);
                    }
                } catch (trackingError) {
                    console.error('Failed to track live event end:', trackingError);
                }
            }
        } catch (error) {
            console.error('End livestream error:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.message || error.message
            });
            toast.error('Error ending livestream', {
                description: error.response?.data?.message || 'Something went wrong',
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
        }
    };

    const getLiveStreamFullDetails = async (streamId) => {
        try {
            dispatch({ type: 'RESET_API_STATE' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const response = await axios.get(`${BASE_URL}/streams/${streamId}`);
            console.log('stream details', response.data);
            if (response.status === 200) {
                dispatch({ type: 'SET_LIVE_STREAM_DETAILS', payload: response.data });
            }
            return response.data;
        } catch (error) {
            console.error('Error getting live stream details', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }

    const joinLiveStreamAsHost = async (streamId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = token?.data;
            const response = await axios.post(`${BASE_URL}/streams/${streamId}/join-seller`, {}, {
                headers: {
                    Authorization: `Bearer ${sellerToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 200) {
                dispatch({ type: 'SET_JOIN_LIVE_STREAM_DATA', payload: response.data });
                return response.data;
            }
            
        } catch (error) {
            console.error('Error joining live stream as host', error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }

    const activateProductBidding = async (streamId, productId) => {
        try {
            dispatch({ type: 'SET_ACTIVATING_BID', payload: true });
            const sellerToken = token?.data;

            if (!sellerToken) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(
                `${BASE_URL}/streams/${streamId}/activate-product-bidding`,
                { productId },
                {
                    headers: {
                        Authorization: `Bearer ${sellerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Update the product's bid status in the state
                const updatedProducts = state.liveStreamDetails.products.map(product => {
                    // Set the newly activated product to active status (not ongoing)
                    if (product.product.productId === productId) {
                        return { ...product, ...response.data.product, bidStatus: 'active' };
                    }
                    // Set all other active or ongoing products to ended
                    if (product.bidStatus === 'ongoing' || product.bidStatus === 'active') {
                        return { ...product, bidStatus: 'ended' };
                    }
                    return product;
                });

                dispatch({ type: 'UPDATE_PRODUCT_BID_STATUS', payload: updatedProducts });
            
                
                toast.success('Product bidding activated successfully', {
                    style: {
                        background: '#161A1E',
                        color: '#fff',
                    }
                });
                
                return response.data.product;
            }
            return null;
        } catch (error) {
            console.error('Activate product bidding error:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.message || error.message
            });
            toast.error('Error activating product bidding', {
                description: error.response?.data?.message || 'Something went wrong',
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
            throw error;
        } finally {
            dispatch({ type: 'SET_ACTIVATING_BID', payload: false });
        }
    };

    // Helper function to calculate stream duration in minutes
    const calculateStreamDuration = (streamData) => {
        if (!streamData || !streamData.actualStartTime) return 0;
        
        const startTime = new Date(streamData.actualStartTime).getTime();
        const endTime = new Date().getTime();
        
        // Return duration in minutes
        return Math.round((endTime - startTime) / (1000 * 60));
    };

    // Function to reschedule an expired stream
    const rescheduleExpiredStream = async (streamId, newScheduledStartTime) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = token?.data;
            const sellerData = seller;

            if (!sellerToken) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(
                `${BASE_URL}/streams/reschedule-expired`,
                {
                    streamId,
                    newScheduledStartTime
                },
                {
                    headers: {
                        Authorization: `Bearer ${sellerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Update the fetched streams to reflect the rescheduled stream
                const updatedStreams = state.fetchedLiveStreams.map(stream => {
                    if (stream._id === streamId) {
                        return {
                            ...stream,
                            scheduledStartTime: newScheduledStartTime,
                            status: 'scheduled'
                        };
                    }
                    return stream;
                });
                
                dispatch({ type: 'SET_FETCHED_LIVE_STREAMS', payload: updatedStreams });

                toast.success('Stream rescheduled successfully', {
                    style: {
                        background: '#161A1E',
                        color: '#fff',
                    }
                });

                // Track the reschedule event
                trackEvent("Live Stream Rescheduled", {
                    "seller id": sellerData._id,
                    "seller email": sellerData.email,
                    "seller store name": sellerData.storeName,
                    "seller first name": sellerData.firstName,
                    "seller last name": sellerData.lastName,
                    "stream id": streamId,
                    "new scheduled start time": newScheduledStartTime,
                    "reschedule timestamp": new Date().toISOString()
                });

                return response.data.stream;
            }
        } catch (error) {
            console.error('Reschedule stream error:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.message || error.message
            });
            toast.error('Error rescheduling stream', {
                description: error.response?.data?.message || 'Something went wrong',
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
            throw error;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Function to renew Agora token for a livestream
    const renewAgoraToken = async (streamId) => {
        try {
            const sellerToken = token?.data;

            if (!sellerToken) {
                throw new Error('No authentication token found');
            }

            console.log('Requesting new Agora token for stream:', streamId);
            const response = await axios.get(
                `${BASE_URL}/streams/${streamId}/renew-token`,
                {
                    headers: {
                        Authorization: `Bearer ${sellerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.success || !response.data.token) {
                throw new Error('Invalid token response from server');
            }

            console.log('Successfully obtained new Agora token');
            return response.data.token;
        } catch (error) {
            console.error('Failed to fetch new Agora token:', error);
            toast.error('Failed to refresh stream connection', {
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
            throw error;
        }
    };

    /**
     * Display a product in a live stream
     * Sets the isVisible state of a product to true and sets all other products' isVisible state to false
     * Only one product can be visible at a time
     * 
     * @param {string} streamId - ID of the stream
     * @param {string} productId - ID of the product to display
     * @returns {Promise<Object>} The updated product object
     */
    const displayStreamProduct = async (streamId, productId) => {
        try {
            const sellerToken = token?.data;

            if (!sellerToken) {
                throw new Error('No authentication token found');
            }

            if (!streamId || !productId) {
                throw new Error('Stream ID and Product ID are required');
            }

            const response = await axios.post(
                `${BASE_URL}/streams/${streamId}/display-product`,
                { productId },
                {
                    headers: {
                        Authorization: `Bearer ${sellerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Update the product's visibility in the state
                // Set all products' isVisible to false, then set the selected product's to true
                if (state.liveStreamDetails?.products) {
                    const updatedProducts = state.liveStreamDetails.products.map(product => {
                        // Set the selected product to visible
                        if (product.product?.productId === productId || product.productId === productId) {
                            return { ...product, isVisible: true };
                        }
                        // Set all other products to not visible
                        return { ...product, isVisible: false };
                    });

                    dispatch({ 
                        type: 'SET_LIVE_STREAM_DETAILS', 
                        payload: {
                            ...state.liveStreamDetails,
                            products: updatedProducts
                        }
                    });
                }

                toast.success('Product displayed successfully', {
                    style: {
                        background: '#161A1E',
                        color: '#fff',
                    }
                });

                return response.data.product;
            }
            return null;
        } catch (error) {
            console.error('Display stream product error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
            toast.error('Error displaying product', {
                description: errorMessage,
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
            throw error;
        }
    };

    /**
     * Hide a product in a live stream
     * Sets the isVisible state of a product to false, hiding it from viewers
     * 
     * @param {string} streamId - ID of the stream
     * @param {string} productId - ID of the product to hide
     * @returns {Promise<Object>} The updated product object
     */
    const hideStreamProduct = async (streamId, productId) => {
        try {
            const sellerToken = token?.data;

            if (!sellerToken) {
                throw new Error('No authentication token found');
            }

            if (!streamId || !productId) {
                throw new Error('Stream ID and Product ID are required');
            }

            const response = await axios.post(
                `${BASE_URL}/streams/${streamId}/hide-product`,
                { productId },
                {
                    headers: {
                        Authorization: `Bearer ${sellerToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Update the product's visibility in the state
                if (state.liveStreamDetails?.products) {
                    const updatedProducts = state.liveStreamDetails.products.map(product => {
                        // Set the selected product to not visible
                        if (product.product?.productId === productId || product.productId === productId) {
                            return { ...product, isVisible: false };
                        }
                        return product;
                    });

                    dispatch({ 
                        type: 'SET_LIVE_STREAM_DETAILS', 
                        payload: {
                            ...state.liveStreamDetails,
                            products: updatedProducts
                        }
                    });
                }

                toast.success('Product hidden successfully', {
                    style: {
                        background: '#161A1E',
                        color: '#fff',
                    }
                });

                return response.data.product;
            }
            return null;
        } catch (error) {
            console.error('Hide stream product error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Something went wrong';
            toast.error('Error hiding product', {
                description: errorMessage,
                style: {
                    background: '#161A1E',
                    color: '#fff',
                }
            });
            throw error;
        }
    };

    return (
        <LivestreamContext.Provider value={{
            ...state,
            scheduleLiveShow,
            scheduleLiveAuction,
            getAllSellerActiveStreams,
            startLiveStream,
            getLiveStreamFullDetails,
            endLiveStream,
            joinLiveStreamAsHost,
            activateProductBidding,
            renewAgoraToken,
            rescheduleExpiredStream,
            displayStreamProduct,
            hideStreamProduct,
            dispatch
        }}>
            {children}
        </LivestreamContext.Provider>
    );
};

LivestreamProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export { LivestreamContext };
export default LivestreamProvider;
