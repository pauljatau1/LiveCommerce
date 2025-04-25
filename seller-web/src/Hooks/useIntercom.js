import { useIntercom } from 'react-use-intercom';

export const useIntercomChat = () => {
    const { boot, shutdown, update } = useIntercom();

    // Simple UUID generator that works on all browsers
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const initVisitor = () => {
        // Generate fresh UUID for each visitor session using the cross-browser method
        const visitorId = generateUUID();

        boot({
            user_id: `visitor_${visitorId}`,
            role: 'Seller Visitor',
            name: 'Visitor',
            created_at: Math.floor(Date.now() / 1000)
        });
    };

    const initUser = (userData) => {
        console.log('running chat as user', userData);
        boot({
            user_id: userData._id,
            email: userData.email,
            name: `${userData.firstName.toUpperCase()} ${userData.lastName.toUpperCase()}`,
            phone: userData.phoneNumber,
            created_at: Math.floor(new Date(userData.createdAt).getTime() / 1000),
            type: 'seller',
        });
    };

    return { initVisitor, initUser, shutdown, update };
}; 