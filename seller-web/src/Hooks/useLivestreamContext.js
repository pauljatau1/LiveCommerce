import { useContext } from "react";
import { LivestreamContext } from "../Contexts/LivestreamContext";

export const useLivestreamContext = () => {
    const context = useContext(LivestreamContext);
    if (!context) {
        throw new Error('useLivestreamContext must be used within an LivestreamProvider');
    }
    return context;
};