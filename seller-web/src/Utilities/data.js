import cat1 from '../assets/cat1.png';
import cat2 from '../assets/cat2.png';
import cat3 from '../assets/cat3.png';
import cat4 from '../assets/cat4.png';
import check from '../assets/checkmark-circle-02.png';
import ObjectID from 'bson-objectid';
import Order1 from '../assets/order-pic1.png';
import Order2 from '../assets/order-pic2.png';
import Order3 from '../assets/order-pic3.png';
import Order4 from '../assets/order-pic-4.png';
import Order5 from '../assets/order-pic-5.png';
import thumbnail1 from '../assets/sg-v1.png';
import thumbnail2 from '../assets/sg-v2.png';
import thumbnail3 from '../assets/sg-v3.png';
import ProductImage from '../assets/p-card.png';
import LiveIcon1 from '../assets/live-icon1.png';
import LiveIcon2 from '../assets/live-icon2.png';
import LiveIcon3 from '../assets/live-icon3.png';
import { 
    MdDashboard, 
    MdPeople, 
    MdShoppingBag,
    MdInventory2,
    MdCampaign,
    MdMessage,
    MdLiveTv,
    MdInsights,
    MdPayments,
    MdLink,
    MdSchool,
    MdHelpOutline,
    MdSettings,
    MdLogout
} from 'react-icons/md';
import { 
    BsBoxSeam, 
    BsFileEarmarkText, 
    BsFileX,
    BsTicketPerforated,
    BsLightning,
    BsInbox,
    BsShare 
} from 'react-icons/bs';


export const categoriesData = [
    {
        id: ObjectID().toHexString(),
        name: 'Cloths',
        image: cat1,
        checkedImage: check
    },
    {
        id: ObjectID().toHexString(),
        name: 'Accessories',
        image: cat2,
        checkedImage: check
    },
    {
        id: ObjectID().toHexString(),
        name: 'Foot Wears',
        image: cat3,
        checkedImage: check
    },
    {
        id: ObjectID().toHexString(),
        name: 'Baby Wears',
        image: cat4,
        checkedImage: check
    }
];

export const sideBarNavData = [
    {
        id: ObjectID().toHexString(),
        name: 'Dashboard',
        icon: 'bi:house',
        path: '/dashboard/home',
    },
    {
        id: ObjectID().toHexString(),
        name: 'Customers',
        icon: 'eva:people-outline',
        path: '/dashboard/customers'
    },
    {
        id: ObjectID().toHexString(),
        name: 'Orders',
        icon: 'heroicons:shopping-bag',
        path: '/dashboard/orders'
    },
    {
        id: ObjectID().toHexString(),
        name: 'Products',
        icon: 'iconoir:box-iso',
        path: '/dashboard/products',
        subNav: [
            {
                id: ObjectID().toHexString(),
                name: 'Add Products',
                path: 'add-products',
            },
            {
                id: ObjectID().toHexString(),
                name: 'Drafts',
                path: 'drafts'
            }, {
                id: ObjectID().toHexString(),
                name: 'Inactive',
                path: 'inactive'
            }
        ]
    },
    {
        id: ObjectID().toHexString(),
        name: 'Marketing',
        icon: 'mage:megaphone-a',
        path: '/dashboard/marketing',
        subNav: [
            {
                id: ObjectID().toHexString(),
                name: 'Coupons',
                path: 'coupons'
            },
            {
                id: ObjectID().toHexString(),
                name: 'Flash Sales',
                path: 'flash-sales'
            },
            {
                id: ObjectID().toHexString(),
                name: 'Inbox Campaigns',
                path: 'inbox-campaigns'
            },
            {
                id: ObjectID().toHexString(),
                name: 'Referrals',
                path: 'referrals'
            }
        ]
    },
    {
        id: ObjectID().toHexString(),
        name: 'Messages',
        icon: 'token:chat',
        path: '/dashboard/messages'
    },
    {
        id: ObjectID().toHexString(),
        name: 'Live Streams',
        icon: 'mynaui:video',
        path: '/dashboard/live-streams/live-stream',
        subNav: [
            {
                id: ObjectID().toHexString(),
                name: 'Scheduled Shows',
                path: '/dashboard/live-streams/scheduled-shows'
            },
            {
                id: ObjectID().toHexString(),
                name: 'Past Shows',
                path: '/dashboard/live-streams/past-shows'
            }
        ]
    },
    {
        id: ObjectID().toHexString(),
        name: 'Analytics & Insights',
        icon: 'mage:chart-up',
        path: '/dashboard/analytics-insights'
    },
    {
        id: ObjectID().toHexString(),
        name: 'Earnings & Payouts',
        icon: 'solar:dollar-linear',
        path: '/dashboard/earnings-payouts'
    },
    {
        id: ObjectID().toHexString(),
        name: 'Auqli Connect',
        icon: 'system-uicons:chain',
        path: '/dashboard/auqli-connect'
    },
    // {
    //     id: ObjectID().toHexString(),
    //     name: 'Shop Manager',
    //     icon: 'bi:shop',
    //     path: '/dashboard/shop-manager'
    // },
];

export const homeAnalyticsCardData = [
    {
        id: ObjectID().toHexString(),
        title: 'Store Visits',
        icon: 'bi:person-walking',
        current: '23K visits',
        previous: '18K visits',
        percentage: '+27.6%',
        color: '#0BB248',
        backgroundColor: '#05031F'
    },
    {
        id: ObjectID().toHexString(),
        title: 'Total Sales',
        icon: 'emojione-monotone:money-bag',
        current: '₦3.5m',
        previous: '₦2.5m',
        percentage: '+40%',
        color: '#0BB248',
        backgroundColor: '#05031F'
    },
    {
        id: ObjectID().toHexString(),
        title: 'Total Orders',
        icon: 'icon-park-solid:shopping-bag',
        current: '12K',
        previous: '10K',
        percentage: '+20%',
        color: '#0BB248',
        backgroundColor: '#05031F'
    },
    {
        id: ObjectID().toHexString(),
        title: 'Conversion Rate',
        icon: 'fluent:people-team-toolbox-24-filled',
        current: '10%',
        previous: '8%',
        percentage: '+25%',
        color: '#0BB248',
        backgroundColor: '#05031F'
    },
    {
        id: ObjectID().toHexString(),
        title: 'New Customers',
        icon: 'fluent:people-checkmark-20-filled',
        current: 444,
        previous: 333,
        percentage: '+33.3%',
        color: '#0BB248',
        backgroundColor: '#05031F'
    }
];

export const orderTempData = [
    {
        id: ObjectID().toHexString(),
        name: 'Turtleneck Polo Long Sleeve',
        price: 1000000,
        quantity: 250,
        percentage: '+47%',
        image: Order1
    },
    {
        id: ObjectID().toHexString(),
        name: 'Turtleneck Polo Long Sleeve',
        price: 1000000,
        quantity: 250,
        percentage: '+47%',
        image: Order2
    },
    {
        id: ObjectID().toHexString(),
        name: 'Turtleneck Polo Long Sleeve',
        price: 1000000,
        quantity: 250,
        percentage: '+47%',
        image: Order3
    }
]

export const toDoCardTempData = [
    {
        id: ObjectID().toHexString(),
        title: 'You have 10 orders to ship today!',
    },
    {
        id: ObjectID().toHexString(),
        title: '10 of your products are disabled!',
    },
    {
        id: ObjectID().toHexString(),
        title: 'You have 7 return requests',
    },
    {
        id: ObjectID().toHexString(),
        title: 'You have 33 unread messages!',
    },
    {
        id: ObjectID().toHexString(),
        title: '55 products are sold out',
    },
    {
        id: ObjectID().toHexString(),
        title: '55 products are sold out',
    },
];

export const suggestVideosData = [
    {
        id: ObjectID().toHexString(),
        title: 'Lesson 1: Getting Started',
        thumbnail: thumbnail1,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
        id: ObjectID().toHexString(),
        title: 'Lesson 2: Creating Your First Product',
        thumbnail: thumbnail2,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
        id: ObjectID().toHexString(),
        title: 'Lesson 3: Shipping Your Products',
        thumbnail: thumbnail3,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
        id: ObjectID().toHexString(),
        title: 'Lesson 4: All about payouts',
        thumbnail: thumbnail3,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
        id: ObjectID().toHexString(),
        title: 'Lesson 5: All about payouts',
        thumbnail: thumbnail3,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
        id: ObjectID().toHexString(),
        title: 'Lesson 6: All about payouts',
        thumbnail: thumbnail3,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
        id: ObjectID().toHexString(),
        title: 'Lesson 7: All about payouts',
        thumbnail: thumbnail3,
        link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
];

export const platformAnnouncementData = [
    {
        id: ObjectID().toHexString(),
        date: 'Jan 2, 2025',
        title: 'Updates on Shipping to lagos and other states across nigeria'
    },
    {
        id: ObjectID().toHexString(),
        date: 'March 1, 2025',
        title: 'Join Auqli promotions and increase boost on your listings'
    },
    {
        id: ObjectID().toHexString(),
        date: 'Feb 20, 2025',
        title: 'The latest updates you missed last week on Auqli'
    },
    {
        id: ObjectID().toHexString(),
        date: 'May 1, 2025',
        title: 'Auqli launches in Ghana'
    }
];

export const productPageCardData = [
    {
        id: ObjectID().toHexString(),
        name: 'Rolex Choreographs Day Date Watch',
        skuTag: 'KL65KG',
        stock: 10,
        price: 1000000,
        image: ProductImage
    },
    {
        id: ObjectID().toHexString(),
        name: 'Rolex Choreographs Day Date Watch',
        skuTag: 'KL65KG',
        stock: 20,
        price: 1000000,
        image: ProductImage
    },
    {
        id: ObjectID().toHexString(),
        name: 'Rolex Choreographs Day Date Watch',
        skuTag: 'KL65KG',
        stock: 25,
        price: 1000000,
        image: ProductImage
    },
    {
        id: ObjectID().toHexString(),
        name: 'Rolex Choreographs Day Date Watch',
        skuTag: 'KL65KG',
        stock: 20,
        price: 1000000,
        image: ProductImage
    },
    {
        id: ObjectID().toHexString(),
        name: 'Rolex Choreographs Day Date Watch',
        skuTag: 'KL65KG',
        stock: 20,
        price: 1000000,
        image: ProductImage
    },
    {
        id: ObjectID().toHexString(),
        name: 'Rolex Choreographs Day Date Watch',
        skuTag: 'KL65KG',
        stock: 2,
        price: 1000000,
        image: ProductImage
    },
    {
        id: ObjectID().toHexString(),
        name: 'Rolex Choreographs Day Date Watch',
        skuTag: 'KL65KG',
        stock: 20,
        price: 1000000,
        image: ProductImage
    },
    {
        id: ObjectID().toHexString(),
        name: 'Rolex Choreographs Day Date Watch',
        skuTag: 'KL65KG',
        stock: 40,
        price: 1000000,
        image: ProductImage
    },
];

export const marketingAdsData = [
    {
        id: ObjectID().toHexString(),
        title: 'Auqli Ads',
        description: 'Increase sales & exposure with Auqli In-app Platform Ads',
        link: '/dashboard/auqli-ads',
        tags: [
            {
                id: ObjectID().toHexString(),
                name: 'Paid'
            },
            {
                id: ObjectID().toHexString(),
                name: 'Free'
            }
        ],
        available: false
    },
    {
        id: ObjectID().toHexString(),
        title: 'Coupons',
        description: 'Create coupons and distribute. Drive up sales and increase the average order value for your store!',
        link: '/dashboard/coupons',
        tags: [
            {
                id: ObjectID().toHexString(),
                name: 'Free'
            }
        ],
        available: true
    },
    {
        id: ObjectID().toHexString(),
        title: 'Flash Sales',
        description: 'Create urgency, FOMO and limited sales for your buyers. Helps increase visibility and get in front of buyers',
        link: '/dashboard/flash-sales',
        tags: [
            {
                id: ObjectID().toHexString(),
                name: 'Free'
            }
        ],
        available: true
    },
    {
        id: ObjectID().toHexString(),
        title: 'Inbox Campaigns',
        description: 'Directly send messages to your followers using our in-built direct marketing feature for your business!',
        link: '/dashboard/inbox-campaigns',
        tags: [
            {
                id: ObjectID().toHexString(),
                name: 'Free'
            },
            {
                id: ObjectID().toHexString(),
                name: 'Paid'
            }
        ],
        available: true
    },
    {
        id: ObjectID().toHexString(),
        title: 'Referral',
        description: 'Refer people and earn when they join Auqli and makes a purchase. Increase followers and get passive income',
        link: '/dashboard/referrals',
        tags: [
            {
                id: ObjectID().toHexString(),
                name: 'Free'
            },
            {
                id: ObjectID().toHexString(),
                name: 'Paid'
            }
        ],
        available: true
    },
];

export const customerLatestOrdersTempData = [
    {
        id: ObjectID().toHexString(),
        name: 'Turtleneck Polo Long Sleeve',
        color: 'Orange Stripe',
        isPaid: true,
        isDelivered: true,
        image: Order1,
        price: 1000000,
        quantity: 2,
        total: 2000000
    },
    {
        id: ObjectID().toHexString(),
        name: 'Turtleneck Polo Long Sleeve',
        color: 'Orange Stripe',
        isPaid: true,
        isDelivered: true,
        image: Order2,
        price: 1000000,
        quantity: 2,
        total: 2000000
    },
    {
        id: ObjectID().toHexString(),
        name: 'Turtleneck Polo Long Sleeve',
        color: 'Orange Stripe',
        isPaid: true,
        isDelivered: true,
        image: Order3,
        price: 1000000,
        quantity: 2,
        total: 2000000
    },
    {
        id: ObjectID().toHexString(),
        name: 'Turtleneck Polo Long Sleeve',
        color: 'Orange Stripe',
        isPaid: true,
        isDelivered: true,
        image: Order4,
        price: 1000000,
        quantity: 2,
        total: 2000000
    },
    {
        id: ObjectID().toHexString(),
        name: 'Turtleneck Polo Long Sleeve',
        color: 'Orange Stripe',
        isPaid: true,
        isDelivered: true,
        image: Order5,
        price: 1000000,
        quantity: 2,
        total: 2000000
    },
];


export const liveStreamCardData = [
    {
        id: ObjectID().toHexString(),
        icon: LiveIcon1,
        title: 'Auctions',
        description: 'Start a live and entertaining bidding on Auqli! Perfect for auctioning off your pre-loved items.',
        link: '/dashboard/live-streams/create-live-auction',
        available: true
    },
    {
        id: ObjectID().toHexString(),
        icon: LiveIcon2,
        title: 'Open Live Show',
        description: 'Showcase all products in your store through open live shows, engage with customers and increase sales!',
        link: '/dashboard/live-streams/create-live-show',
        available: true
    },
    {
        id: ObjectID().toHexString(),
        icon: LiveIcon3,
        title: 'Live Giveaways',
        description: 'Run giveaways on Auqli! An exciting way to increase your reach, gain followers and potential future customers.',
        link: '/dashboard/live-streams/live-giveaways',
        available: false
    }
]

// Add these utility navigation items if you want to use them separately
export const utilityNavData = [
    {
        id: ObjectID().toHexString(),
        name: 'Auqli University',
        icon: MdSchool,
        path: '/dashboard/university'
    },
    {
        id: ObjectID().toHexString(),
        name: 'Help & Support',
        icon: MdHelpOutline,
        path: '/dashboard/help'
    },
    {
        id: ObjectID().toHexString(),
        name: 'Settings',
        icon: MdSettings,
        path: '/dashboard/settings'
    },
    {
        id: ObjectID().toHexString(),
        name: 'Log Out',
        icon: MdLogout,
        path: '/logout'
    }
];


