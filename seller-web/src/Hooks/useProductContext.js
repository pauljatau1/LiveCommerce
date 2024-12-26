import { useContext } from "react";
import { ProductContext } from "../Contexts/ProductContext";

export const useProductContext = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProductContext must be used within an ProductProvider');
    }
    return context;
};