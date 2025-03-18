import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigation, useOutletContext } from "react-router-dom";
import Header from "../../Components/ui/Header/Header";
//import Loader from '../../Components/Loader';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "../../Components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../Components/ui/popover";
//import { productPageCardData } from "../../Utilities/data";
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { fetchSellerProducts, fetchSellerAuctionProducts } from "../../Redux/Slices/ProductSlice";
import ProductCard from "../../Components/ui/ProductPageUi/ProductCard";
import NotFound from "../../assets/not-found-icon2.png";
import LinearProgress from "@mui/material/LinearProgress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../Components/ui/dialog";

import React from 'react';


const ProductsPage = () => {
    const { setHeaderName, setNavName } = useOutletContext()
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { products, auctionProducts, isLoading, isLoadingAuctions, deleteStatus } = useSelector((state) => state.product);
    const [isStockUpdated, setIsStockUpdated] = useState(false);
    const [activeTab, setActiveTab] = useState('products'); // 'products' or 'auctions'
    const [sortType, setSortType] = useState('newest-to-oldest'); // Updated default sort
    
    // Dialog states
    const [showDateDialog, setShowDateDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [showPriceDialog, setShowPriceDialog] = useState(false);

    useEffect(() => {
        setHeaderName('Products')
        setNavName('')
    }, [])

    useEffect(() => {
        if (activeTab === 'products') {
            dispatch(fetchSellerProducts());
        } else {
            dispatch(fetchSellerAuctionProducts());
        }
    }, [dispatch, isStockUpdated, activeTab]);

    // Sort function
    const getSortedProducts = (products) => {
        if (!products) return [];
        
        const productsCopy = [...products];
        
        switch (sortType) {
            case 'newest-to-oldest':
                return productsCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest-to-newest':
                return productsCopy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'active-only':
                return productsCopy.filter(product => product.status === 'active');
            case 'draft-only':
                return productsCopy.filter(product => product.status === 'draft');
            case 'price-high-to-low':
                return productsCopy.sort((a, b) => b.price - a.price);
            case 'price-low-to-high':
                return productsCopy.sort((a, b) => a.price - b.price);
            default:
                return productsCopy;
        }
    };

    // Get sorted products
    const displayedProducts = getSortedProducts(activeTab === 'products' ? products : auctionProducts);
    const isCurrentlyLoading = activeTab === 'products' ? isLoading : isLoadingAuctions;

    // Get active filter label
    const getActiveFilterLabel = () => {
        switch (sortType) {
            case 'newest-to-oldest':
                return 'Newest First';
            case 'oldest-to-newest':
                return 'Oldest First';
            case 'active-only':
                return 'Active Only';
            case 'draft-only':
                return 'Draft Only';
            case 'price-high-to-low':
                return 'Highest Price';
            case 'price-low-to-high':
                return 'Lowest Price';
            default:
                return 'Sort';
        }
    };

    // Memoize the products list
    const memoizedProducts = React.useMemo(() => {
        return displayedProducts.map((item) => (
            <ProductCard key={item._id} item={item} setIsStockUpdated={setIsStockUpdated} isAuction={activeTab === 'auctions'} />
        ));
    }, [displayedProducts]);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);



    return (
        <>
            {/*isLoading && <Loader />*/}
            {
                isCurrentlyLoading ? (
                    <div className="flex flex-col justify-center items-center h-[80dvh]">
                        <div className="w-1/4">
                            <LinearProgress color="success" />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-6 w-full">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                        activeTab === 'products'
                                            ? 'bg-[#17171B] text-white'
                                            : 'bg-[#0BB24817] text-[#17171B] hover:bg-[#0BB24820]'
                                    }`}
                                >
                                    Products
                                </button>
                                <button
                                    onClick={() => setActiveTab('auctions')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                        activeTab === 'auctions'
                                            ? 'bg-[#17171B] text-white'
                                            : 'bg-[#0BB24817] text-[#17171B] hover:bg-[#0BB24820]'
                                    }`}
                                >
                                    Offline Auctions
                                </button>
                            </div>
                            
                            <div className="flex items-center flex-wrap gap-4">
                                {displayedProducts.length > 0 && (
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <p className="text-base font-cabin font-normal text-[#17171B]">Sort By:</p>
                                        <div className="flex items-center flex-wrap gap-2">
                                            {/* Date Sort Button */}
                                            <button 
                                                onClick={() => setShowDateDialog(true)}
                                                className={`flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer ${sortType.includes('newest') || sortType.includes('oldest') ? 'bg-[#17171B] text-white' : 'bg-[#0BB24817] text-[#17171B]'} rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out`}
                                            >
                                                <Icon icon="solar:calendar-outline" width="20" height="20" color={sortType.includes('newest') || sortType.includes('oldest') ? "#FFFFFF" : "#17171B"} />
                                                <p className={`text-sm font-cabin font-normal`}>Date</p>
                                            </button>

                                            {/* Status Sort Button */}
                                            <button 
                                                onClick={() => setShowStatusDialog(true)}
                                                className={`flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer ${sortType.includes('active') || sortType.includes('draft') ? 'bg-[#17171B] text-white' : 'bg-[#0BB24817] text-[#17171B]'} rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out`}
                                            >
                                                <Icon icon="iconamoon:clock-thin" width="20" height="20" color={sortType.includes('active') || sortType.includes('draft') ? "#FFFFFF" : "#17171B"} />
                                                <p className={`text-sm font-cabin font-normal`}>Status</p>
                                            </button>

                                            {/* Price Sort Button */}
                                            <button 
                                                onClick={() => setShowPriceDialog(true)}
                                                className={`flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer ${sortType.includes('price') ? 'bg-[#17171B] text-white' : 'bg-[#0BB24817] text-[#17171B]'} rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out`}
                                            >
                                                <Icon icon="solar:sort-by-time-linear" width="20" height="20" color={sortType.includes('price') ? "#FFFFFF" : "#17171B"} />
                                                <p className={`text-sm font-cabin font-normal`}>Price</p>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <NavLink to="/dashboard/add-products" className="flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer text-[#FFFFFF] bg-[#17171B] rounded-[7.8px] py-3 px-4 hover:bg-[#17171B]/90 transition-all duration-500 ease-in-out">
                                    <Icon icon="tabler:plus" width="20" height="20" color="#FFFFFF" />
                                    <p className="text-sm font-cabin font-normal text-[#FFFFFF]">Add Product</p>
                                </NavLink>
                            </div>
                        </div>
                        <div className="flex flex-col w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                            {/* Table Headers - Desktop */}
                            <div className="hidden lg:grid grid-cols-[80px_1fr_1fr_1fr_1fr_100px_100px] gap-4 px-6 py-4 border-b border-[#E5E7EB] bg-white">
                                <div className="text-sm font-medium text-[#05031F]">Image</div>
                                <div className="text-sm font-medium text-[#05031F]">Product Name</div>
                                <div className="text-sm font-medium text-[#05031F]">Upload Status</div>
                                <div className="text-sm font-medium text-[#05031F]">
                                    {activeTab === 'auctions' ? 'Auction Status' : 'Stock'}
                                </div>
                                <div className="text-sm font-medium text-[#05031F]">
                                    {activeTab === 'auctions' ? 'Current Bid' : 'Price'}
                                </div>
                                <div className="text-sm font-medium text-[#05031F] text-center">
                                    {activeTab === 'auctions' ? 'Time Left' : 'Stock Status'}
                                </div>
                                <div className="text-sm font-medium text-[#05031F] text-center">Actions</div>
                            </div>

                            {/* Products List */}
                            <div className="divide-y divide-[#E5E7EB]">
                                {displayedProducts.length > 0 ? (
                                    memoizedProducts
                                ) : (
                                    <div className="flex flex-col h-[50dvh] items-center justify-center gap-4">
                                        <img src={NotFound} alt="not-found" className="w-[180px] md:w-[220px] h-[180px] md:h-[220px]" />
                                        <p className="text-base font-cabin font-normal text-[#05031F]">
                                            No {activeTab === 'auctions' ? 'auction' : ''} products found
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {
                            displayedProducts.length > 20 && (
                                <div className="flex items-center justify-center flex-wrap gap-4 mt-4  lg:mt-8 w-full">
                                    <button className="text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-2 rounded-full py-3 px-4 hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                                        <Icon icon="gg:arrow-long-left" width="20" height="20" color="#FFFFFF" />
                                        <p className="text-sm font-cabin font-normal text-[#FFFFFF]">Previous</p>
                                    </button>
                                    <button className="text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-2 rounded-full py-3 px-4 hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                                        <p className="text-sm font-cabin font-normal text-[#FFFFFF]">Next</p>
                                        <Icon icon="gg:arrow-long-right" width="20" height="20" color="#FFFFFF" />
                                    </button>
                                    <button className="text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-2 rounded-full py-3 px-4  whitespace-nowrap hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                                        <p className="text-sm font-cabin font-normal text-[#FFFFFF]">20 per page</p>
                                        <Icon icon="simple-line-icons:arrow-down" width="10" height="10" color="#FFFFFF" />
                                    </button>
                                </div>
                            )
                        }
                    </>
                )
            }

            {/* Date Sort Dialog */}
            <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Sort by Date</DialogTitle>
                        <DialogDescription>
                            Choose how to sort products by their creation date
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <button
                            onClick={() => {
                                setSortType('newest-to-oldest');
                                setShowDateDialog(false);
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                                sortType === 'newest-to-oldest' ? 'bg-[#17171B] text-white' : 'bg-[#0BB24817] text-[#17171B]'
                            }`}
                        >
                            <span>Newest to Oldest</span>
                            {sortType === 'newest-to-oldest' && <Icon icon="lucide:check" />}
                        </button>
                        <button
                            onClick={() => {
                                setSortType('oldest-to-newest');
                                setShowDateDialog(false);
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                                sortType === 'oldest-to-newest' ? 'bg-[#17171B] text-white' : 'bg-[#0BB24817] text-[#17171B]'
                            }`}
                        >
                            <span>Oldest to Newest</span>
                            {sortType === 'oldest-to-newest' && <Icon icon="lucide:check" />}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Status Sort Dialog */}
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Filter by Status</DialogTitle>
                        <DialogDescription>
                            Choose which product status to display
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <button
                            onClick={() => {
                                setSortType('active-only');
                                setShowStatusDialog(false);
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                                sortType === 'active-only' ? 'bg-[#17171B] text-white' : 'bg-[#0BB24817] text-[#17171B]'
                            }`}
                        >
                            <span>Show Active Only</span>
                            {sortType === 'active-only' && <Icon icon="lucide:check" />}
                        </button>
                        <button
                            onClick={() => {
                                setSortType('draft-only');
                                setShowStatusDialog(false);
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                                sortType === 'draft-only' ? 'bg-[#17171B] text-white' : 'bg-[#0BB24817] text-[#17171B]'
                            }`}
                        >
                            <span>Show Draft Only</span>
                            {sortType === 'draft-only' && <Icon icon="lucide:check" />}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Price Sort Dialog */}
            <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Sort by Price</DialogTitle>
                        <DialogDescription>
                            Choose how to sort products by price
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <button
                            onClick={() => {
                                setSortType('price-high-to-low');
                                setShowPriceDialog(false);
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                                sortType === 'price-high-to-low' ? 'bg-[#17171B] text-white' : 'bg-[#0BB24817] text-[#17171B]'
                            }`}
                        >
                            <span>Highest to Lowest</span>
                            {sortType === 'price-high-to-low' && <Icon icon="lucide:check" />}
                        </button>
                        <button
                            onClick={() => {
                                setSortType('price-low-to-high');
                                setShowPriceDialog(false);
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                                sortType === 'price-low-to-high' ? 'bg-[#17171B] text-white' : 'bg-[#0BB24817] text-[#17171B]'
                            }`}
                        >
                            <span>Lowest to Highest</span>
                            {sortType === 'price-low-to-high' && <Icon icon="lucide:check" />}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ProductsPage
