import { createContext, useReducer } from "react";
import axios from "axios";
import { toast } from "sonner";
import { BASE_URL } from "../Constants/Server";
import { useAuthContext } from "@/Hooks/useAuthContextV2";
import PropTypes from 'prop-types';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
    const { token } = useAuthContext();
    const initialState = {
        product: {},
        isLoading: false,
        error: null,
        message: null
    };

    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'CREATE_PRODUCT_SUCCESS':
                return { ...state, isLoading: false, error: null, message: action.payload };
            case 'CREATE_PRODUCT_ERROR':
                return { ...state, isLoading: false, error: action.payload, message: null };
            case 'SET_LOADING':
                return { ...state, isLoading: action.payload };
            default:
                return state;
        }
    }, initialState);


    const createProduct = async (product) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const sellerToken = token?.data;    
            console.log("Token Data:", sellerToken);
            const response = await axios.post(`${BASE_URL}/products`, product, {
                headers: {
                    Authorization: `Bearer ${sellerToken}`
                },
            });
            dispatch({ type: 'CREATE_PRODUCT_SUCCESS', payload: response.data });
            if (response.status === 201) {
                toast.success('Product created successfully', {
                    description: "Product has been created successfully",
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
            }
        } catch (error) {
            dispatch({ type: 'CREATE_PRODUCT_ERROR', payload: error.message });
            toast.error('Failed to create product', {
                description: "Please try again",
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
            console.log(error);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    return (
        <ProductContext.Provider value={{
            ...state,
            dispatch,
            createProduct
        }}>
            {children}
        </ProductContext.Provider>
    );
};

ProductProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export { ProductContext };
export default ProductProvider;
