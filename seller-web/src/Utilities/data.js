import cat1 from '../assets/cat1.png';
import cat2 from '../assets/cat2.png';
import cat3 from '../assets/cat3.png';
import cat4 from '../assets/cat4.png';
import check from '../assets/checkmark-circle-02.png';
import ObjectID from 'bson-objectid';
import Order1 from '../assets/order-pic1.png'
import Order2 from '../assets/order-pic2.png'
import Order3 from '../assets/order-pic3.png'

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
        icon: 'fluent:data-pie-16-regular',
        path: '/dashboard/home'
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
        path: '/dashboard/products'
    },
    {
        id: ObjectID().toHexString(),
        name: 'Marketing',
        icon: 'mage:megaphone-a',
        path: '/dashboard/marketing'
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
        path: '/dashboard/live-streams'
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
    {
        id: ObjectID().toHexString(),
        name: 'Shop Manager',
        icon: 'bi:shop',
        path: '/dashboard/shop-manager'
    },
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
]
