export interface StreamConfig {
    appId: string;
    channel: string;
    token: string;
    uid: string;
}

export interface ProductImage {
    url: string;
    _id: string;
    id: string;
}

export interface Product {
    productId: string;
    name: string;
    quantity: number;
    description: string;
    price: number;
    discountedPrice: number;
    images: ProductImage[];
    seller: {
        storeName: string;
        businessName: string;
        storeAvatar: {
            url: string;
        };
    };
    id: string;
}

export interface StreamProduct {
    product: Product;
    currentBid: number;
    minBid?: number;  // Minimum bid for auction products
    maxBid?: number;  // Maximum bid for auction products
    _id: string;
}

export interface StreamDetails {
    channelName: string;
    token: string;
    uid: string;
    title?: string;
    category?: string;
    viewers?: Array<any>;
    likes?: number;
    comments?: number;
    products?: StreamProduct[];
    seller?: {
        storeName: string;
        businessName: string;
        storeAvatar: {
            url: string;
        };
        _id?: string;
    };
    stream?: {
        title: string;
        products: StreamProduct[];
        seller: {
            _id: string;
            businessName: string;
            storeAvatar: {
                url: string;
            };
            storeName: string;
        };
        coverImage?: {
            url: string;
        };
        _id?: string;
        actualStartTime?: string;
        agoraToken?: string;
        agoraUid?: number;
        bids?: any[];
        cancelledStream?: boolean;
        category?: string;
        channelName?: string;
        createdAt?: string;
        description?: string;
        isLive?: boolean;
        scheduledStartTime?: string;
        status?: string;
        tags?: string[];
        type?: string;
        updatedAt?: string;
        viewerCount?: number;
        viewers?: any[];
    };
}

export interface LivestreamContextType {
    activeStreamDetails: StreamDetails | null;
    joinStream: (streamId: string) => Promise<StreamDetails>;
    fetchActiveStreamDetails: (streamId: string) => Promise<StreamDetails>;
    leaveStream: (streamId: string) => Promise<any>;
    // Add other properties as needed
}
