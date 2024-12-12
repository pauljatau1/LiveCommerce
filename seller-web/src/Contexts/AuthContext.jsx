import { createContext, useContext, useState, useReducer } from "react";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const initialState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: ""
    }

    const [state, dispatch] = useReducer((state, action) => {
        switch (action.type) {
            case 'SET_LOADING':
                return {
                    ...state,
                    isLoading: true
                }
            case 'CREATE_USER':
                return {
                    ...state,
                    firstName: action.payload.firstName,
                    lastName: action.payload.lastName,
                    email: action.payload.email,
                    phone: action.payload.phone,
                    address: action.payload.address,
                    city: action.payload.city,
                    state: action.payload.state,
                    zip: action.payload.zip
                }
        }
    }, initialState);

    return (
        <AuthContext.Provider value={{
            ...state,
            dispatch
        }}>
            {children}
        </AuthContext.Provider>
    )
}

const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }

    return context;
}

export { AuthProvider, useAuthContext };