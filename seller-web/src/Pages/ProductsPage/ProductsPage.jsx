import { useState, useEffect, useRef } from "react";
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
import { fetchSellerProducts, fetchSellerAuctionProducts, searchSellerProducts } from "../../Redux/Slices/ProductSlice";
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
import VerificationDialog from "../../Components/VerificationDialog";
import { useAuthContext } from "../../Hooks/useAuthContext";

import React from 'react';


const ProductsPage = () => {
    const { setHeaderName, setNavName } = useOutletContext()
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { products, auctionProducts, isLoading, isLoadingAuctions, deleteStatus } = useSelector((state) => state.product);
    const [isStockUpdated, setIsStockUpdated] = useState(false);
    const [activeTab, setActiveTab] = useState('products'); 
    const [sortType, setSortType] = useState('newest-to-oldest'); 
    const { seller } = useAuthContext();
    const [showVerificationDialog, setShowVerificationDialog] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    
    // Dialog states
    const [showDateDialog, setShowDateDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [showPriceDialog, setShowPriceDialog] = useState(false);

    useEffect(() => {
        setHeaderName('Products')
        setNavName('')
    }, [])

    // Reset page when sort type or tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [sortType, activeTab]);

    // Fetch products when pagination, sort type, or tab changes (but not when search query changes)
    useEffect(() => {
        // Only fetch when not in search mode or when clearing search
        if (!isSearchMode) {
            fetchProducts();
        }
    }, [sortType, activeTab, itemsPerPage, currentPage, isStockUpdated, isSearchMode]);

    const fetchProducts = () => {
        // Skip fetch if we're in search mode - search is handled by the search button
        if (isSearchMode) return;
        
        if (activeTab === 'products') {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                sortBy: mapSortTypeToAPI(sortType),
            };
            
            // Add status filter if applicable
            if (sortType === 'active-only') {
                params.status = 'active';
            } else if (sortType === 'draft-only') {
                params.status = 'draft';
            }
            
            dispatch(fetchSellerProducts(params));
        } else {
            const params = {
                page: currentPage,
                limit: itemsPerPage,
            };
            
            dispatch(fetchSellerAuctionProducts(params));
        }
    };

    // Handle search form submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsSearchMode(true);
            setIsSearching(true);
            setCurrentPage(1);
            
            // Create search parameters
            const params = {
                page: 1,
                limit: itemsPerPage,
                sortBy: mapSortTypeToAPI(sortType),
                search: searchQuery
            };
            
            // Add status filter if applicable
            if (sortType === 'active-only') {
                params.status = 'active';
            } else if (sortType === 'draft-only') {
                params.status = 'draft';
            }
            
            // Directly dispatch the search without using fetchProducts
            if (activeTab === 'products') {
                dispatch(searchSellerProducts(params))
                    .finally(() => setIsSearching(false));
            } else {
                dispatch(fetchSellerAuctionProducts(params))
                    .finally(() => setIsSearching(false));
            }
        }
    };

    // Clear search and return to normal product view
    const handleClearSearch = () => {
        setSearchQuery('');
        setIsSearchMode(false);
        setCurrentPage(1);
        
        // Create standard fetch parameters
        const params = {
            page: 1,
            limit: itemsPerPage,
            sortBy: mapSortTypeToAPI(sortType)
        };
        
        // Add status filter if applicable
        if (sortType === 'active-only') {
            params.status = 'active';
        } else if (sortType === 'draft-only') {
            params.status = 'draft';
        }
        
        // Directly dispatch the fetch without using fetchProducts
        if (activeTab === 'products') {
            dispatch(fetchSellerProducts(params));
        } else {
            dispatch(fetchSellerAuctionProducts(params));
        }
    };

    // Check if seller is verified
    useEffect(() => {
        if (seller && seller.isVerified === false) {
            setShowVerificationDialog(true);
        }
    }, [seller]);

    // Handle add product click for unverified sellers
    const handleAddProductClick = (e) => {
        if (seller && !seller.isVerified) {
            e.preventDefault();
            setShowVerificationDialog(true);
        }
    };

    // Map UI sort type to API sortBy parameter
    const mapSortTypeToAPI = (uiSortType) => {
        switch (uiSortType) {
            case 'newest-to-oldest':
                return 'newest';
            case 'oldest-to-newest':
                return 'oldest';
            case 'price-high-to-low':
                return 'price_desc';
            case 'price-low-to-high':
                return 'price_asc';
            default:
                return 'newest';
        }
    };

    // Get pagination data
    const paginationData = activeTab === 'products' 
        ? useSelector(state => state.product.pagination) 
        : useSelector(state => state.product.auctionPagination);

    // Handle page navigation
    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
            
            // If in search mode, need to manually trigger search with new page
            if (isSearchMode && searchQuery) {
                handlePageChange(newPage);
            }
        }
    };

    const handleNextPage = () => {
        if (currentPage < paginationData.totalPages) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            
            // If in search mode, need to manually trigger search with new page
            if (isSearchMode && searchQuery) {
                handlePageChange(newPage);
            }
        }
    };

    // Handle pagination when in search mode
    const handlePageChange = (newPage) => {
        setIsSearching(true);
        
        const params = {
            page: newPage,
            limit: itemsPerPage,
            sortBy: mapSortTypeToAPI(sortType),
            search: searchQuery
        };
        
        // Add status filter if applicable
        if (sortType === 'active-only') {
            params.status = 'active';
        } else if (sortType === 'draft-only') {
            params.status = 'draft';
        }
        
        if (activeTab === 'products') {
            dispatch(searchSellerProducts(params))
                .finally(() => setIsSearching(false));
        } else {
            dispatch(fetchSellerAuctionProducts(params))
                .finally(() => setIsSearching(false));
        }
    };

    // Handle items per page change
    const handleItemsPerPageChange = (newLimit) => {
        setItemsPerPage(newLimit);
        setCurrentPage(1); // Reset to first page when changing items per page
        
        // If in search mode, need to manually trigger search with new limit
        if (isSearchMode && searchQuery) {
            const params = {
                page: 1,
                limit: newLimit,
                sortBy: mapSortTypeToAPI(sortType),
                search: searchQuery
            };
            
            // Add status filter if applicable
            if (sortType === 'active-only') {
                params.status = 'active';
            } else if (sortType === 'draft-only') {
                params.status = 'draft';
            }
            
            setIsSearching(true);
            if (activeTab === 'products') {
                dispatch(searchSellerProducts(params))
                    .finally(() => setIsSearching(false));
            } else {
                dispatch(fetchSellerAuctionProducts(params))
                    .finally(() => setIsSearching(false));
            }
        }
    };

    // Sort function
    const getSortedProducts = (products) => {
        if (!products) return [];
        
        // For status filtering on client side if needed
        if (sortType === 'active-only') {
            return products.filter(product => product.status === 'active');
        } else if (sortType === 'draft-only') {
            return products.filter(product => product.status === 'draft');
        }
        
        // All other sorting is handled by the API
        return products;
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

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return (
        <>
            {/* Verification Dialog */}
            <VerificationDialog 
                isOpen={showVerificationDialog} 
                onClose={() => setShowVerificationDialog(false)} 
                isPending={seller?.accountPending}
            />

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
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
                                        activeTab === 'products'
                                            ? 'bg-[#0BB248] text-white'
                                            : 'bg-[#0BB24817] text-[#0BB248] hover:bg-[#0BB24820]'
                                    }`}
                                >
                                    Products
                                </button>
                                <button
                                    onClick={() => setActiveTab('auctions')}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
                                        activeTab === 'auctions'
                                            ? 'bg-[#0BB248] text-white'
                                            : 'bg-[#0BB24817] text-[#0BB248] hover:bg-[#0BB24820]'
                                    }`}
                                >
                                    Offline Auctions
                                </button>
                            </div>
                            
                            <div className="flex items-center flex-wrap gap-4">
                                {/* Search Form */}
                                <form onSubmit={handleSearch} className="relative w-full sm:w-auto max-w-[400px] flex">
                                    <div className="flex items-center relative flex-grow">
                                        <Icon
                                            icon="heroicons:magnifying-glass"
                                            className="absolute left-3 text-gray-400"
                                            width="20"
                                        />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            placeholder="Search products..."
                                            className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248] focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-[#0BB248] text-white px-3 py-2 rounded-r-lg hover:bg-[#0BB248]/90 transition-all duration-300"
                                    >
                                        <Icon icon="heroicons:magnifying-glass" width="20" />
                                    </button>
                                    
                                    {isSearchMode && (
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="ml-2 bg-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 flex items-center gap-1"
                                        >
                                            <Icon icon="heroicons:x-mark" width="16" />
                                            <span className="hidden sm:inline">Clear</span>
                                        </button>
                                    )}
                                    
                                    {isSearching && (
                                        <div className="absolute w-full h-1 bottom-0 left-0">
                                            <LinearProgress color="success" sx={{ height: 2 }} />
                                        </div>
                                    )}
                                </form>

                                {displayedProducts.length > 0 && (
                                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-2">
                                        <p className="text-base font-cabin font-normal text-[#0BB248] mb-2 sm:mb-0">Sort By:</p>
                                        <div className="flex items-center flex-wrap gap-2">
                                            {/* Date Sort Button */}
                                            <button 
                                                onClick={() => setShowDateDialog(true)}
                                                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-cabin font-normal cursor-pointer ${sortType.includes('newest') || sortType.includes('oldest') ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'} rounded-[7.8px] py-2 sm:py-3 px-3 sm:px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out`}
                                            >
                                                <Icon icon="solar:calendar-outline" width="18" height="18" color={sortType.includes('newest') || sortType.includes('oldest') ? "#FFFFFF" : "#0BB248"} />
                                                <p className={`text-xs sm:text-sm font-cabin font-normal`}>Date</p>
                                            </button>

                                            {/* Status Sort Button */}
                                            <button 
                                                onClick={() => setShowStatusDialog(true)}
                                                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-cabin font-normal cursor-pointer ${sortType.includes('active') || sortType.includes('draft') ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'} rounded-[7.8px] py-2 sm:py-3 px-3 sm:px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out`}
                                            >
                                                <Icon icon="iconamoon:clock-thin" width="18" height="18" color={sortType.includes('active') || sortType.includes('draft') ? "#FFFFFF" : "#0BB248"} />
                                                <p className={`text-xs sm:text-sm font-cabin font-normal`}>Status</p>
                                            </button>

                                            {/* Price Sort Button */}
                                            <button 
                                                onClick={() => setShowPriceDialog(true)}
                                                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-cabin font-normal cursor-pointer ${sortType.includes('price') ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'} rounded-[7.8px] py-2 sm:py-3 px-3 sm:px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out`}
                                            >
                                                <Icon icon="solar:sort-by-time-linear" width="18" height="18" color={sortType.includes('price') ? "#FFFFFF" : "#0BB248"} />
                                                <p className={`text-xs sm:text-sm font-cabin font-normal`}>Price</p>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {seller?.isVerified ? (
                                    <NavLink 
                                        to={activeTab === 'auctions' ? "/dashboard/add-products?type=auction" : "/dashboard/add-products"} 
                                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-cabin font-normal cursor-pointer text-[#FFFFFF] bg-[#0BB248] rounded-[7.8px] py-2 sm:py-3 px-3 sm:px-4 hover:bg-[#0BB248]/90 transition-all duration-500 ease-in-out"
                                    >
                                        <Icon icon="tabler:plus" width="18" height="18" color="#FFFFFF" />
                                        <p className="text-xs sm:text-sm font-cabin font-normal text-[#FFFFFF]">
                                            {activeTab === 'auctions' ? 'Add Offline Auction' : 'Add Product'}
                                        </p>
                                    </NavLink>
                                ) : (
                                    <button
                                        onClick={() => setShowVerificationDialog(true)}
                                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-cabin font-normal cursor-pointer text-[#FFFFFF] bg-[#0BB248] rounded-[7.8px] py-2 sm:py-3 px-3 sm:px-4 hover:bg-[#0BB248]/90 transition-all duration-500 ease-in-out"
                                    >
                                        <Icon icon="tabler:plus" width="18" height="18" color="#FFFFFF" />
                                        <p className="text-xs sm:text-sm font-cabin font-normal text-[#FFFFFF]">
                                            {activeTab === 'auctions' ? 'Add Offline Auction' : 'Add Product'}
                                        </p>
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="w-full overflow-x-auto">
                            <div className="flex flex-col w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden min-w-[768px]">
                                {/* Table Headers - Now visible on all screen sizes with min-width */}
                                <div className={`grid ${activeTab === 'auctions' ? 'grid-cols-[80px_1fr_1fr_1fr_100px_100px]' : 'grid-cols-[80px_1fr_1fr_1fr_1fr_100px_100px]'} gap-4 px-6 py-4 border-b border-[#E5E7EB] bg-white`}>
                                    <div className="text-sm font-medium text-[#05031F]">Image</div>
                                    <div className="text-sm font-medium text-[#05031F]">Product Name</div>
                                    {activeTab !== 'auctions' && (
                                        <div className="text-sm font-medium text-[#05031F]">Upload Status</div>
                                    )}
                                    <div className="text-sm font-medium text-[#05031F]">
                                        {activeTab === 'auctions' ? 'Auction Status' : 'Sold Count'}
                                    </div>
                                    <div className="text-sm font-medium text-[#05031F]">
                                        {activeTab === 'auctions' ? 'Current Bid' : 'Price'}
                                    </div>
                                    <div className="text-sm font-medium text-[#05031F] text-center">
                                        {activeTab === 'auctions' ? 'Time Left' : 'Stock Count'}
                                    </div>
                                    <div className="text-sm font-medium text-[#05031F] text-center">Actions</div>
                                </div>

                                {/* Products List */}
                                <div className="divide-y divide-[#E5E7EB]">
                                    {displayedProducts.length > 0 ? (
                                        memoizedProducts
                                    ) : (
                                        <div className="flex flex-col h-[50dvh] items-center justify-center gap-4">
                                            <img src={NotFound} alt="not-found" className="w-[120px] sm:w-[180px] md:w-[220px] h-[120px] sm:h-[180px] md:h-[220px]" />
                                            <p className="text-sm sm:text-base font-cabin font-normal text-[#05031F] text-center px-4">
                                                {searchQuery ? `No results found for "${searchQuery}"` : 
                                                sortType.includes('active') ? 'No active products found' : 
                                                sortType.includes('draft') ? 'No draft products found' : 
                                                `No ${activeTab === 'auctions' ? 'auction' : ''} products found`}
                                            </p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {searchQuery && (
                                                    <button 
                                                        onClick={handleClearSearch}
                                                        className="bg-[#0BB248] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0BB248]/90 transition-all duration-300"
                                                    >
                                                        Clear search
                                                    </button>
                                                )}
                                                {(sortType.includes('active') || sortType.includes('draft')) && (
                                                    <button 
                                                        onClick={() => {
                                                            setSortType('newest-to-oldest');
                                                            setCurrentPage(1);
                                                        }}
                                                        className="bg-[#0BB248] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0BB248]/90 transition-all duration-300"
                                                    >
                                                        Show all products
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {
                            paginationData && paginationData.totalPages > 1 && (
                                <div className="flex items-center justify-between flex-wrap gap-3 sm:gap-4 mt-4 lg:mt-8 w-full px-4 py-3">
                                    <div className="text-sm text-gray-600">
                                        Showing {displayedProducts.length} of {paginationData.totalProducts} products
                                    </div>
                                    <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-4">
                                        <button 
                                            onClick={handlePreviousPage}
                                            disabled={currentPage <= 1}
                                            className={`text-xs sm:text-sm font-cabin font-normal ${
                                                currentPage <= 1 
                                                    ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                                                    : 'text-[#ffffff] bg-[#05031F] hover:bg-[#05031F]/90'
                                            } flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 transition-all duration-500 ease-in-out`}
                                        >
                                            <Icon icon="gg:arrow-long-left" width="16" height="16" color={currentPage <= 1 ? "#a0a0a0" : "#FFFFFF"} />
                                            <p className="text-xs sm:text-sm font-cabin font-normal">Previous</p>
                                        </button>
                                        
                                        <div className="flex items-center gap-1">
                                            <span className="px-3 py-2 rounded-md bg-[#0BB248] text-white">
                                                {currentPage}
                                            </span>
                                            <span className="text-gray-600">of</span>
                                            <span className="px-3 py-2 rounded-md border border-gray-200">
                                                {paginationData.totalPages}
                                            </span>
                                        </div>
                                        
                                        <button 
                                            onClick={handleNextPage}
                                            disabled={currentPage >= paginationData.totalPages}
                                            className={`text-xs sm:text-sm font-cabin font-normal ${
                                                currentPage >= paginationData.totalPages 
                                                    ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                                                    : 'text-[#ffffff] bg-[#05031F] hover:bg-[#05031F]/90'
                                            } flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 transition-all duration-500 ease-in-out`}
                                        >
                                            <p className="text-xs sm:text-sm font-cabin font-normal">Next</p>
                                            <Icon icon="gg:arrow-long-right" width="16" height="16" color={currentPage >= paginationData.totalPages ? "#a0a0a0" : "#FFFFFF"} />
                                        </button>
                                        
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="text-xs sm:text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                                                    <p className="text-xs sm:text-sm font-cabin font-normal text-[#FFFFFF]">{itemsPerPage} per page</p>
                                                    <Icon icon="simple-line-icons:arrow-down" width="8" height="8" color="#FFFFFF" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandList>
                                                        <CommandGroup>
                                                            <CommandItem onSelect={() => handleItemsPerPageChange(10)}>
                                                                <span>10 per page</span>
                                                                {itemsPerPage === 10 && <Icon icon="lucide:check" className="ml-auto" />}
                                                            </CommandItem>
                                                            <CommandItem onSelect={() => handleItemsPerPageChange(20)}>
                                                                <span>20 per page</span>
                                                                {itemsPerPage === 20 && <Icon icon="lucide:check" className="ml-auto" />}
                                                            </CommandItem>
                                                            <CommandItem onSelect={() => handleItemsPerPageChange(50)}>
                                                                <span>50 per page</span>
                                                                {itemsPerPage === 50 && <Icon icon="lucide:check" className="ml-auto" />}
                                                            </CommandItem>
                                                            <CommandItem onSelect={() => handleItemsPerPageChange(100)}>
                                                                <span>100 per page</span>
                                                                {itemsPerPage === 100 && <Icon icon="lucide:check" className="ml-auto" />}
                                                            </CommandItem>
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            )
                        }
                    </>
                )
            }

            {/* Date Sort Dialog */}
            <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
                <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
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
                                sortType === 'newest-to-oldest' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
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
                                sortType === 'oldest-to-newest' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
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
                                sortType === 'active-only' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
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
                                sortType === 'draft-only' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
                            }`}
                        >
                            <span>Show Draft Only</span>
                            {sortType === 'draft-only' && <Icon icon="lucide:check" />}
                        </button>
                        <button
                            onClick={() => {
                                setSortType('newest-to-oldest');
                                setShowStatusDialog(false);
                            }}
                            className={`flex items-center justify-between p-4 rounded-lg ${
                                sortType === 'newest-to-oldest' && !sortType.includes('active') && !sortType.includes('draft') 
                                    ? 'bg-[#0BB248] text-white' 
                                    : 'bg-[#0BB24817] text-[#0BB248]'
                            }`}
                        >
                            <span>Show All</span>
                            {sortType === 'newest-to-oldest' && !sortType.includes('active') && !sortType.includes('draft') && <Icon icon="lucide:check" />}
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
                                sortType === 'price-high-to-low' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
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
                                sortType === 'price-low-to-high' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
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
