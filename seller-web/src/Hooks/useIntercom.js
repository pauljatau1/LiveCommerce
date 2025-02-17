import { useIntercom } from 'react-use-intercom';

export const useIntercomChat = () => {
    const { boot, shutdown, update } = useIntercom();

    const initVisitor = () => {
        // Generate fresh UUID for each visitor session
        const visitorId = crypto.randomUUID();

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