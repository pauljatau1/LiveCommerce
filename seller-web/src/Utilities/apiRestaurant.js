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
                console.log(response.data);
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
};

// get platform announcement
export const getPlatformAnnouncement = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/public/announcements`);
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.error('Failed to fetch platform announcement', error);
        throw new Error('Failed to fetch platform announcement');
    }
};

//get public resources
export const getPublicResources = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/public/resources`);
        if (response.status === 200) {
            return response.data;
        }
    } catch (error) {
        console.error('Failed to fetch public resources', error);
        throw new Error('Failed to fetch public resources');
    }
};

//get seller notifications
export const getSellerNotifications = async () => {
    try {
        const token = localStorage.getItem('sellerToken');
        if (token) {
            const { data } = JSON.parse(token);
            const response = await axios.get(`${BASE_URL}/notifications`, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });
            if (response.status === 200) {
                return response.data;
            }
        }
    } catch (error) {
        console.error('Failed to fetch seller notifications', error);
        throw new Error('Failed to fetch seller notifications');
    }
};

//get top 3 selling products
export const getTop3SellingProducts = async () => {
    try {
        const token = localStorage.getItem('sellerToken');
        if (token) {
            const { data } = JSON.parse(token);
            const response = await axios.get(`${BASE_URL}/seller/top-sold-products`, {
                headers: {
                    Authorization: `Bearer ${data}`
                }
            });
            if (response.status === 200) {
                return response.data;
            }
        }
    } catch (error) {
        console.error('Failed to fetch top 3 selling products', error);
        throw new Error('Failed to fetch top 3 selling products');
    }
}


