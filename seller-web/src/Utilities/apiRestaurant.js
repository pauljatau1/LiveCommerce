import { BASE_URL } from "../Constants/Server";
import axios from "axios";

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