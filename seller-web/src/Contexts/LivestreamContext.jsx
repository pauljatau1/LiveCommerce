import { createContext, useReducer } from "react";
import { BASE_URL } from "../Constants/Server";
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import axios from "axios";
import { trackEvent } from "../util/analytics";

const LivestreamContext = createContext();

export const LivestreamProvider = ({ children }) => {
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
                
                // Track stream scheduling with Customer.io
                try {
                    if (window.cioanalytics) {
                        // First re-identify the user to ensure the connection is active
                        window.cioanalytics.identify(sellerData._id, {
                            seller_id: sellerData._id,
                            email: sellerData.email,
                            first_name: sellerData.firstName,
                            last_name: sellerData.lastName
                        });
                        
                        // Track the live event scheduled
                        setTimeout(() => {
                            window.cioanalytics.track('live_event_scheduled', {
                                event_id: response.data.stream._id,
                                seller_id: sellerData._id,
                                date_time: response.data.stream.scheduledStartTime,
                                event_type: 'live_show',
                                event_title: streamData.title,
                                product_count: streamData.products?.length || 0
                            });
                        }, 500);
                    }
                } catch (trackingError) {
                    console.error('Failed to track live event scheduling:', trackingError);
                }

                return response.data.stream;
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
                
                // Track stream scheduling with Customer.io
                try {
                    if (window.cioanalytics) {
                        // First re-identify the user to ensure the connection is active
                        window.cioanalytics.identify(sellerData._id, {
                            seller_id: sellerData._id,
                            email: sellerData.email,
                            first_name: sellerData.firstName,
                            last_name: sellerData.lastName
                        });
                        
                        // Track the live event scheduled
                        setTimeout(() => {
                            window.cioanalytics.track('live_event_scheduled', {
                                event_id: response.data.stream._id,
                                seller_id: sellerData._id,
                                date_time: response.data.stream.scheduledStartTime,
                                event_type: 'live_auction',
                                event_title: streamData.title,
                                product_count: streamData.products?.length || 0
                            });
                        }, 500);
                    }
                } catch (trackingError) {
                    console.error('Failed to track live event scheduling:', trackingError);
                }

                return response.data.stream;
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

    const endLiveStream = async (streamId, streamData) => {
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const sellerData = JSON.parse(localStorage.getItem('seller'));
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

    // Helper function to calculate stream duration in minutes
    const calculateStreamDuration = (streamData) => {
        if (!streamData || !streamData.actualStartTime) return 0;
        
        const startTime = new Date(streamData.actualStartTime).getTime();
        const endTime = new Date().getTime();
        
        // Return duration in minutes
        return Math.round((endTime - startTime) / (1000 * 60));
    };

    // Function to renew Agora token for a livestream
    const renewAgoraToken = async (streamId) => {
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : null;

            if (!tokenData?.data) {
                throw new Error('No authentication token found');
            }

            console.log('Requesting new Agora token for stream:', streamId);
            const response = await axios.get(
                `${BASE_URL}/streams/${streamId}/renew-token`,
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.data}`,
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
