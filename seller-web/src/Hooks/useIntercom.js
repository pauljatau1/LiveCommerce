import { useIntercom } from 'react-use-intercom';

export const useIntercomChat = () => {
    const { boot, shutdown, update } = useIntercom();

    // Simple UUID generator that works on all browsers
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const initVisitor = () => {
        // Generate fresh UUID for each visitor session using the cross-browser method
        const visitorId = generateUUID();

        if (window.Intercom) {
            window.Intercom('boot', {
                app_id: import.meta.env.VITE_INTERCOM_APP_ID,
                user_id: `visitor_${visitorId}`,
                name: 'Visitor',
                created_at: Math.floor(Date.now() / 1000)
            });
        } else {
            boot({
                user_id: `visitor_${visitorId}`,
                role: 'Seller Visitor',
                name: 'Visitor',
                created_at: Math.floor(Date.now() / 1000)
            });
        }
    };

    const initUser = (userData) => {
        console.log('running chat as user', userData);

        if (!userData) {
            console.error('No user data provided to initUser');
            return;
        }

        // NEW APPROACH: Multi-step setup following Intercom's exact API requirements

        // Step 1: Shut down any existing session
        if (window.Intercom) {
            window.Intercom('shutdown');

            // Calculate verification status
            const isPickupAddressRequired = userData?.accountType === 'individual' ? userData?.hasFilledAddress === false : userData?.hasFilledBusinessAddress === false;
            const isUserVerified = userData?.emailVerified && !isPickupAddressRequired;

            // Step 2: Boot with minimal user identification
            window.Intercom('boot', {
                app_id: import.meta.env.VITE_INTERCOM_APP_ID,
                user_id: userData._id,
                email: userData.email,
                name: `${userData.firstName.toUpperCase()} ${userData.lastName.toUpperCase()}`,
                created_at: Math.floor(new Date(userData.createdAt).getTime() / 1000)
            });
            console.log('Booted Intercom with basic user data');

            // Step 3: Add the company data
            setTimeout(() => {
                window.Intercom('update', {
                    companies: [{
                        company_id: userData._id,
                        name: userData.storeName || 'Seller Store',
                        created_at: Math.floor(new Date(userData.createdAt).getTime() / 1000)
                    }]
                });
                console.log('Added company data to Intercom');

                // Step 4: Update with custom attributes one by one
                setTimeout(() => {
                    // Direct attribute setting using Intercom's 'update' call
                    window.Intercom('update', {
                        phone: userData.phoneNumber || ''
                    });

                    // Set all the custom attributes individually
                    const attributes = {
                        "type": 'seller',
                        "store_name": userData.storeName || '',
                        "user_type": "Seller",
                        "seller_account_type": userData.accountType || '',
                        "signup_date": userData.createdAt ? new Date(userData.createdAt).toISOString().split('T')[0] : '',
                        "verification_status": isUserVerified ? "Verified" : "Not Verified",
                        "primary_payment_account_number": userData.bankDetails?.accountNumber || "None",
                        "primary_payment_account_name": userData.bankDetails?.accountName || "None",
                        "primary_payment_account_bank": userData.bankDetails?.bankName || "None",
                        "primary_payment_account_currency": userData.bankDetails?.accountCurrency || "None",
                        "location": `${userData.sellerAddress?.country || ''}, ${userData.sellerAddress?.city || ''}, ${userData.sellerAddress?.state || ''}, ${userData.sellerAddress?.addressLine1 || ''}`,
                        "total_wallet_balance": userData.walletBalance ? `₦${userData.walletBalance.toLocaleString('en-NG')}` : '₦0',
                        "device_type": typeof window !== 'undefined' && window.getDeviceType ? window.getDeviceType() : 'Unknown'
                    };

                    console.log('Setting custom attributes individually:', attributes);

                    // Use the JavaScript API to set the attributes
                    for (const [key, value] of Object.entries(attributes)) {
                        window.intercomSettings = window.intercomSettings || {};
                        window.intercomSettings[key] = value;
                    }

                    // Force attribute update with empty update
                    window.Intercom('update');

                    // Also try direct API
                    window.Intercom('update', attributes);

                    console.log('All attributes set, forcing final update');

                    // One more update to ensure everything is set
                    setTimeout(() => {
                        window.Intercom('update');
                    }, 500);
                }, 500);
            }, 500);
        } else {
            // Fallback to using the hook
            console.log('Window.Intercom not available, using react-use-intercom instead');

            const isPickupAddressRequired = userData?.accountType === 'individual' ? userData?.hasFilledAddress === false : userData?.hasFilledBusinessAddress === false;
            const isUserVerified = userData?.emailVerified && !isPickupAddressRequired;

            boot({
                user_id: userData._id,
                email: userData.email,
                name: `${userData.firstName.toUpperCase()} ${userData.lastName.toUpperCase()}`,
                created_at: Math.floor(new Date(userData.createdAt).getTime() / 1000),
                customAttributes: {
                    phone_number: userData.phoneNumber || '',
                    type: 'seller',
                    store_name: userData.storeName || '',
                    user_type: "Seller",
                    seller_account_type: userData.accountType || '',
                    signup_date: userData.createdAt ? new Date(userData.createdAt).toISOString().split('T')[0] : '',
                    verification_status: isUserVerified ? "Verified" : "Not Verified",
                    primary_payment_account_number: userData.bankDetails?.accountNumber || "None",
                    primary_payment_account_name: userData.bankDetails?.accountName || "None",
                    primary_payment_account_bank: userData.bankDetails?.bankName || "None",
                    primary_payment_account_currency: userData.bankDetails?.accountCurrency || "None",
                    location: `${userData.businessAddress?.country || ''}, ${userData.businessAddress?.city || ''}, ${userData.businessAddress?.state || ''}, ${userData.businessAddress?.addressLine1 || ''}`,
                    total_wallet_balance: userData.walletBalance ? `₦${userData.walletBalance.toLocaleString('en-NG')}` : '₦0',
                    device_type: typeof window !== 'undefined' && window.getDeviceType ? window.getDeviceType() : 'Unknown'
                }
            });
        }
    };

    return { initVisitor, initUser, shutdown, update };
}; 