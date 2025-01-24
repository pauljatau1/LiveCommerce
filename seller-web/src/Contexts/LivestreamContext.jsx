import { createContext, useReducer } from "react";
import { BASE_URL } from "../Constants/Server";
import { toast } from 'sonner';
import PropTypes from 'prop-types';
import axios from "axios";

const LivestreamContext = createContext();

export const LivestreamProvider = ({ children }) => {
    const initialState = {
        livestream: {
            title: '',
            description: '',
            category: '',
            coverPhoto: null,
            tags: [],
            products: []
        },
        isLoading: false,
        error: null,
        message: null
    };

    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'SET_LOADING':
                return { ...state, isLoading: action.payload };
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
                    message: action.payload
                }
            case 'RESET_API_STATE':
                return {
                    ...state,
                    isLoading: false,
                    error: null,
                    message: null
                }
            default:
                return state;
        }
    }, initialState);


    const scheduleLiveShow = async(streamData) => {
        try {
            dispatch({ type: 'RESET_API_STATE' });
            dispatch({ type: 'SET_LOADING', payload: true });
            const sellerToken = localStorage.getItem('sellerToken');
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

    return (
        <LivestreamContext.Provider value={{
            ...state,
            scheduleLiveShow,
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
