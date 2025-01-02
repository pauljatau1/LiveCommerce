import { BASE_URL } from "../Constants/Server";
import axios from "axios";


// fetch onboarding Process categories
export const fetchCategories = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/public/categories`);
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch categories');
    }
};

// fetch onboarding process tracking route
export const fetchOnboardingProcess = async () => {
    try {
        const token = localStorage.getItem('sellerToken');
        if (token) {
            const { data } = JSON.parse(token);
            const response = await axios.get(`${BASE_URL}/seller/onboarding-process`, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });
            if (response.status === 200) {
                return response.data;
            }
        }
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch onboarding process');
    }
};

export const getTotalSellerUCustomers = async () => {
    try {
        const token = localStorage.getItem('sellerToken');
        if (token) {
            const { data } = JSON.parse(token);
            const response = await axios.get(`${BASE_URL}/seller/followers`, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });
            if (response.status === 200) {
                return response.data;
            }
        }
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch total seller customers');
    }
}



