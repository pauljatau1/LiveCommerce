import { createContext, useReducer } from "react";
import { BASE_URL } from "../Constants/Server";
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import axios from "axios";
import mixpanel from "mixpanel-browser";

const LivestreamContext = createContext();

export const LivestreamProvider = ({ children }) => {
    const initialState = {
        livestream: {
            title: '',
            description: '',
            category: '',
            coverPhoto: null,
            video: null,
            tags: [],
            products: [],
            scheduledStartTime: null,
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
        isActivatingBid: false
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
                        coverPhoto: null,
                        tags: [],
                        products: [],
                        scheduledStartTime: null
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

    const scheduleLiveShow = async (streamData) => {
        try {
            dispatch({ type: 'RESET_API_STATE' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = localStorage.getItem('sellerToken');
            const sellerData = JSON.parse(localStorage.getItem('seller'));
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null, isVerified: null };

            const response = await axios.post(`${BASE_URL}/streams/open-live-show`, streamData, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`,
                    // Let browser set Content-Type with boundary automatically
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 201) {
                dispatch({ type: 'SET_SUCCESS_LIVESTREAM_SCHEDULE', payload: 'livestream scheduled successfully' });
                dispatch({ type: 'STORE_ACTIVE_STREAMS', payload: response.data.stream });
                dispatch({ type: "RESET_SCHEDULE_DATA" })
                mixpanel.track("Live Show Scheduled", {
                    "User ID": sellerData.data._id,
                    "Email": sellerData.data.email,
                    "Store Name": sellerData.data.storeName,
                    "First Name": sellerData.data.firstName,
                    "Last Name": sellerData.data.lastName,
                    "Phone Number": sellerData.data.phoneNumber,
                    "stream title": streamData.title,
                    "stream description": streamData.description,
                    "stream category": streamData.category,
                    "stream tags": streamData.tags,
                    "stream products": streamData.products,
                    "stream scheduled start time": streamData.scheduledStartTime,
                    "stream cover photo": streamData.coverImage ? "uploaded" : "not uploaded",
                    "stream video": streamData.video ? "uploaded" : "not uploaded",
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('Error scheduling livestream', {
                description: error.response?.data?.message || 'Failed to schedule livestream',
                style: {
                    background: '#05031F',
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
            const sellerToken = localStorage.getItem('sellerToken');
            const sellerData = JSON.parse(localStorage.getItem('seller'));
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null, isVerified: null };
            const response = await axios.post(`${BASE_URL}/streams/create`, streamData, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(response);
            if (response.status === 201) {
                dispatch({ type: 'SET_SUCCESS_LIVESTREAM_SCHEDULE', payload: 'livestream scheduled successfully' });
                dispatch({ type: 'STORE_ACTIVE_STREAMS', payload: response.data.stream });
                dispatch({ type: "RESET_SCHEDULE_DATA" })
                mixpanel.track("Live Auction Scheduled", {
                    "User ID": sellerData.data._id,
                    "Email": sellerData.data.email,
                    "Store Name": sellerData.data.storeName,
                    "First Name": sellerData.data.firstName,
                    "Last Name": sellerData.data.lastName,  
                    "Phone Number": sellerData.data.phoneNumber,
                    "stream title": streamData.title,
                    "stream description": streamData.description,
                    "stream category": streamData.category,
                    "stream tags": streamData.tags,
                    "stream products": streamData.products,
                    "stream scheduled start time": streamData.scheduledStartTime,
                    "stream cover photo": streamData.coverImage ? "uploaded" : "not uploaded",
                    "stream video": streamData.video ? "uploaded" : "not uploaded",
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('Error scheduling livestream', {
                description: error.response.data.message,
                style: {
                    background: '#05031F',
                    color: '#fff',
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }

    const getAllSellerActiveStreams = async () => {
        try {
            dispatch({ type: 'RESET_API_STATE' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null, isVerified: null };
            const sellerData = localStorage.getItem('seller');
            const seller = sellerData ? JSON.parse(sellerData) : {};
            const response = await axios.get(`${BASE_URL}/streams/seller/${seller?._id}`, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('active streams', response);
            dispatch({ type: 'SET_FETCHED_LIVE_STREAMS', payload: response.data.streams });
        } catch (error) {
            console.error(error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }

    const startLiveStream = async (streamId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const sellerToken = localStorage.getItem('sellerToken');
            const sellerData = JSON.parse(localStorage.getItem('seller'));
            const tokenData = sellerToken ? JSON.parse(sellerToken) : null;

            if (!tokenData?.data) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(
                `${BASE_URL}/streams/${streamId}/start`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.data}`,
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

                mixpanel.track("Live Show Started", {
                    "User ID": sellerData.data._id,
                    "Email": sellerData.data.email,
                    "Store Name": sellerData.data.storeName,
                    "First Name": sellerData.data.firstName,
                    "Last Name": sellerData.data.lastName,
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

                return streamData;
            }
            return null;
        } catch (error) {
            console.error('Start livestream error:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error.response?.data?.message || error.message
            });
            toast.error('Error starting livestream', {
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

    const endLiveStream = async (streamId) => {
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : null;

            if (!tokenData?.data) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(
                `${BASE_URL}/streams/${streamId}/end`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.data}`,
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
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : null;
            const response = await axios.post(`${BASE_URL}/streams/${streamId}/join-seller`, {}, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`,
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
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : null;

            if (!tokenData?.data) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(
                `${BASE_URL}/streams/${streamId}/activate-product-bidding`,
                { productId },
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.data}`,
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
