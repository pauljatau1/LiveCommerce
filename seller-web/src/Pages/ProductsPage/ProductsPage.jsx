import React from 'react';
import { useState, useEffect} from "react";
import { Icon } from "@iconify/react";
import { useOutletContext } from "react-router-dom";
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
import { NavLink, Link } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { fetchSellerProducts, fetchSellerAuctionProducts, searchSellerProducts, deleteProduct } from "../../Redux/Slices/ProductSlice";
import ProductCard from "../../Components/ui/ProductPageUi/ProductCard";
import { BlipUploadModal } from "../../Components/ui/ProductPageUi/ProductCard";
import NotFound from "../../assets/not-found-icon2.png";
import LinearProgress from "@mui/material/LinearProgress";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../Components/ui/dialog";
import PickupAddressVerificationModal from "../../Components/PickupAddressVerificationModal";
import { useAuthContext } from "../../Hooks/useAuthContext";
import StockUpdateModal from "../../Components/ui/ProductPageUi/StockUpdateModal";
import { BASE_URL } from "../../Constants/Server";
import axios from 'axios';
import { toast } from "sonner";
import EmailVerificationModal from "../../Components/EmailVerificationModal";


// Import all icons directly
import plusIcon from '@iconify-icons/tabler/plus';
import magnifyingGlassIcon from '@iconify-icons/heroicons/magnifying-glass';
import xMarkIcon from '@iconify-icons/heroicons/x-mark';
import adjustmentsHorizontalIcon from '@iconify-icons/heroicons/adjustments-horizontal';
import calendarOutlineIcon from '@iconify-icons/solar/calendar-outline';
import clockThinIcon from '@iconify-icons/iconamoon/clock-thin';
import sortByTimeLinearIcon from '@iconify-icons/solar/sort-by-time-linear';
import clockIcon from '@iconify-icons/heroicons/clock';
import graphBoldIcon from '@iconify-icons/solar/graph-bold';
import restartBoldIcon from '@iconify-icons/solar/restart-bold';
import eyeBoldIcon from '@iconify-icons/solar/eye-bold';
import boxEdit24FilledIcon from '@iconify-icons/fluent/box-edit-24-filled';
import videoFrameBoldIcon from '@iconify-icons/solar/video-frame-bold';
import penBoldIcon from '@iconify-icons/solar/pen-bold';
import trashBinTrashBoldIcon from '@iconify-icons/solar/trash-bin-trash-bold';
import arrowLongLeftIcon from '@iconify-icons/gg/arrow-long-left';
import arrowLongRightIcon from '@iconify-icons/gg/arrow-long-right';
import arrowDownIcon from '@iconify-icons/simple-line-icons/arrow-down';
import checkIcon from '@iconify-icons/lucide/check';

const ProductsPage = () => {
    const { setHeaderName, setNavName } = useOutletContext()
    const dispatch = useDispatch();
    const { products, auctionProducts, isLoading, isLoadingAuctions } = useSelector((state) => state.product);
    const [isStockUpdated, setIsStockUpdated] = useState(false);
    const [activeTab, setActiveTab] = useState('products'); 
    const [sortType, setSortType] = useState('newest-to-oldest'); 
    const { seller, fetchSellerDetails } = useAuthContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    
    // Dialog states
    const [showDateDialog, setShowDateDialog] = useState(false);
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [showPriceDialog, setShowPriceDialog] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    
    // Modal states for card interactions
    const [openProductDetails, setOpenProductDetails] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [openStockModal, setOpenStockModal] = useState(false);
    const [openAuctionModal, setOpenAuctionModal] = useState(false);
    const [showRerunDialog, setShowRerunDialog] = useState(false);
    const [openBlipUploadModal, setOpenBlipUploadModal] = useState(false);
    
    // Delete confirmation dialog state
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Email Verification Modal state
    const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);

    // Pickup Address Verification Modal state
    const [showPickupAddressModal, setShowPickupAddressModal] = useState(false);

    useEffect(() => {
        setHeaderName('Products')
        setNavName('')
        
        // If seller is null, fetch seller details
        if (!seller) {
            fetchSellerDetails();
        }
        
        console.log("Full authentication context:", { seller })
        console.log("Verification states:", { 
            isVerified: seller?.isVerified, 
            accountPending: seller?.accountPending,
            shouldShowVerificationDialog: seller !== null && seller.isVerified === false
        })
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

    // Create global handlers for mobile card actions
    useEffect(() => {
        // Define handlers that can be called from mobile card views
        window.productDetailsOpen = (productId) => {
            const foundProduct = displayedProducts.find(p => p._id === productId);
            if (foundProduct) {
                setSelectedProduct(foundProduct);
                setOpenProductDetails(true);
            }
        };
        
        window.stockModalOpen = (productId) => {
            const foundProduct = displayedProducts.find(p => p._id === productId);
            if (foundProduct) {
                setSelectedProduct(foundProduct);
                setOpenStockModal(true);
            }
        };
        
        window.auctionModalOpen = (productId) => {
            const foundProduct = displayedProducts.find(p => p._id === productId);
            if (foundProduct) {
                setSelectedProduct(foundProduct);
                setOpenAuctionModal(true);
            }
        };
        
        window.rerunAuctionOpen = (productId) => {
            const foundProduct = displayedProducts.find(p => p._id === productId);
            if (foundProduct) {
                setSelectedProduct(foundProduct);
                setShowRerunDialog(true);
            }
        };
        
        window.deleteProduct = (productId) => {
            const foundProduct = displayedProducts.find(p => p._id === productId);
            if (foundProduct) {
                setProductToDelete(foundProduct);
                setShowDeleteDialog(true);
            }
        };
        
        window.uploadBlipOpen = (productId) => {
            const foundProduct = displayedProducts.find(p => p._id === productId);
            if (foundProduct) {
                setSelectedProduct(foundProduct);
                setOpenBlipUploadModal(true);
            }
        };
        
        // Cleanup
        return () => {
            delete window.productDetailsOpen;
            delete window.stockModalOpen;
            delete window.auctionModalOpen;
            delete window.rerunAuctionOpen;
            delete window.deleteProduct;
            delete window.uploadBlipOpen;
        };
    }, [displayedProducts, dispatch, setSelectedProduct, setOpenProductDetails, setOpenStockModal, setOpenAuctionModal, setShowRerunDialog, setOpenBlipUploadModal, setProductToDelete, setShowDeleteDialog]);

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

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Toggle mobile filter menu
    const toggleFilterMenu = () => {
        setShowFilterMenu(!showFilterMenu);
    };

    // Handle product deletion
    const handleDeleteProduct = () => {
        if (productToDelete) {
            dispatch(deleteProduct(productToDelete._id));
            setShowDeleteDialog(false);
            setProductToDelete(null);
            // If we're viewing the product details, close that modal too
            if (selectedProduct && selectedProduct._id === productToDelete._id) {
                setOpenProductDetails(false);
            }
        }
    };

    // Handle stock update
    const handleStockUpdate = async (quantity, operation) => {
        if (!selectedProduct) return;
        
        setIsSubmitting(true);
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null, isVerified: null };
            
            // Using the same endpoint pattern as in ProductCard.jsx
            const response = await axios.put(`${BASE_URL}/products/${selectedProduct._id}/inventory`, {
                quantity: quantity,
                operation: operation // "add" or "subtract"
            }, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });
            
            if (response.status === 200) {
                // Refresh products to show updated stock
                setIsStockUpdated(prev => !prev);
                setOpenStockModal(false);
                toast.success(`Stock ${operation === 'add' ? 'increased' : 'decreased'} successfully`);
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.error("Failed to update stock", {
                description: error.response?.data?.message || "Please try again"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Listen for verification completed event
    useEffect(() => {
        const handleVerificationCompleted = () => {
            console.log("Verification completed event received, refreshing seller data...");
            fetchSellerDetails();
        };

        window.addEventListener('seller-verification-completed', handleVerificationCompleted);
        
        return () => {
            window.removeEventListener('seller-verification-completed', handleVerificationCompleted);
        };
    }, []);

    const isPickupAddressRequired = seller?.accountType === 'individual' ? seller?.hasFilledAddress === false : seller?.hasFilledBusinessAddress === false;

    return (
        <>
            {/* Verification Dialog */}
            <PickupAddressVerificationModal 
                isOpen={showPickupAddressModal} 
                onClose={() => setShowPickupAddressModal(false)} 
                isPending={seller?.accountPending}
            />

            {/* Email Verification Modal */}
            <EmailVerificationModal
                isOpen={showEmailVerificationModal}
                onClose={() => setShowEmailVerificationModal(false)}
                userEmail={seller?.email || ''}
            />

            {/*isLoading && <Loader />*/}
            {
                isCurrentlyLoading ? (
                    <div className="flex flex-col justify-center items-center h-[80dvh]">
                        <div className="w-3/4 sm:w-1/2 md:w-1/3 lg:w-1/4">
                            <LinearProgress color="success" />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mobile header area */}
                        <div className="flex flex-col gap-4 py-4 w-full">
                            {/* Product/Auction Tabs */}
                            <div className="flex items-center justify-between gap-4 w-full">
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        className={`px-2 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-base transition-all duration-300 ${
                                            activeTab === 'products'
                                                ? 'bg-[#0BB248] text-white'
                                                : 'bg-[#0BB24817] text-[#0BB248] hover:bg-[#0BB24820]'
                                        }`}
                                    >
                                        Products
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('auctions')}
                                        className={`px-2 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-base transition-all duration-300 ${
                                            activeTab === 'auctions'
                                                ? 'bg-[#0BB248] text-white'
                                                : 'bg-[#0BB24817] text-[#0BB248] hover:bg-[#0BB24820]'
                                        }`}
                                    >
                                        Offline Auctions
                                    </button>
                                    <NavLink
                                        to="/dashboard/blips"
                                        className="px-2 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-base transition-all duration-300 bg-[#0BB24817] text-[#0BB248] hover:bg-[#0BB24820]"
                                    >
                                        Product Blips
                                    </NavLink>
                                </div>

                                {/* Add Product Button - Always visible */}
                                {console.log("Render-time seller check:", { seller, isVerified: seller?.isVerified })}
                                <NavLink 
                                    to={activeTab === 'auctions' ? "/dashboard/add-products?type=auction" : "/dashboard/add-products"} 
                                    className="flex items-center gap-1 text-xs sm:text-sm font-cabin font-normal cursor-pointer text-[#FFFFFF] bg-[#0BB248] rounded-[7.8px] py-1.5 sm:py-2 px-2.5 sm:px-4 hover:bg-[#0BB248]/90 transition-all duration-500 ease-in-out"
                                    onClick={(e) => {
                                        // Strictly compare with boolean false to avoid undefined comparison issues
                                        if (seller && seller?.emailVerified === false) {
                                            e.preventDefault();
                                            setShowEmailVerificationModal(true);
                                        } else if (seller && isPickupAddressRequired) {
                                            e.preventDefault();
                                            setShowPickupAddressModal(true);
                                        }
                                    }}
                                >
                                    <Icon icon={plusIcon} width="16" height="16" color="#FFFFFF" />
                                    <span className="hidden sm:inline">
                                        {activeTab === 'auctions' ? 'Add Offline Auction' : 'Add Product'}
                                    </span>
                                    <span className="sm:hidden">Add</span>
                                </NavLink>
                            </div>
                            
                            {/* Search and filter row */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
                                {/* Search Form */}
                                <form onSubmit={handleSearch} className="relative w-full sm:w-auto max-w-full sm:max-w-[400px] flex">
                                    <div className="flex items-center relative flex-grow">
                                        <Icon
                                            icon={magnifyingGlassIcon}
                                            className="absolute left-3 text-gray-400"
                                            width="18"
                                        />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            placeholder="Search products..."
                                            className="pl-9 pr-3 py-2 w-full text-sm border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#0BB248] focus:border-transparent"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-[#0BB248] text-white px-3 py-2 rounded-r-lg hover:bg-[#0BB248]/90 transition-all duration-300"
                                    >
                                        <Icon icon={magnifyingGlassIcon} width="18" />
                                    </button>
                                    
                                    {isSearchMode && (
                                        <button
                                            type="button"
                                            onClick={handleClearSearch}
                                            className="ml-2 bg-gray-200 text-gray-600 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-300 transition-all duration-300 flex items-center gap-1"
                                        >
                                            <Icon icon={xMarkIcon} width="16" />
                                            <span className="hidden sm:inline">Clear</span>
                                        </button>
                                    )}
                                    
                                    {isSearching && (
                                        <div className="absolute w-full h-1 bottom-0 left-0">
                                            <LinearProgress color="success" sx={{ height: 2 }} />
                                        </div>
                                    )}
                                </form>

                                {/* Mobile filter button */}
                                <div className="sm:hidden flex items-center w-full mt-2">
                                    <button 
                                        onClick={toggleFilterMenu}
                                        className="flex items-center justify-between w-full gap-2 text-xs font-cabin font-normal bg-[#0BB24817] text-[#0BB248] rounded-lg py-2 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Icon icon={adjustmentsHorizontalIcon} width="16" height="16" />
                                            Filter Products
                                        </span>
                                        <span className="text-[#0BB248] font-medium">
                                            {getActiveFilterLabel()}
                                        </span>
                                    </button>
                                </div>

                                {/* Mobile filter menu */}
                                {showFilterMenu && (
                                    <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
                                        <div className="bg-white rounded-t-xl p-4 w-full max-h-[80vh] overflow-y-auto animate-slide-up">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-base font-semibold">Filter Options</h3>
                                                <button onClick={toggleFilterMenu} className="p-1">
                                                    <Icon icon={xMarkIcon} width="20" />
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Date</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSortType('newest-to-oldest');
                                                                toggleFilterMenu();
                                                            }}
                                                            className={`text-left px-3 py-2 rounded-lg text-sm ${
                                                                sortType === 'newest-to-oldest' ? 'bg-[#0BB248] text-white' : 'bg-gray-100'
                                                            }`}
                                                        >
                                                            Newest First
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSortType('oldest-to-newest');
                                                                toggleFilterMenu();
                                                            }}
                                                            className={`text-left px-3 py-2 rounded-lg text-sm ${
                                                                sortType === 'oldest-to-newest' ? 'bg-[#0BB248] text-white' : 'bg-gray-100'
                                                            }`}
                                                        >
                                                            Oldest First
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Status</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSortType('active-only');
                                                                toggleFilterMenu();
                                                            }}
                                                            className={`text-left px-3 py-2 rounded-lg text-sm ${
                                                                sortType === 'active-only' ? 'bg-[#0BB248] text-white' : 'bg-gray-100'
                                                            }`}
                                                        >
                                                            Active Only
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSortType('draft-only');
                                                                toggleFilterMenu();
                                                            }}
                                                            className={`text-left px-3 py-2 rounded-lg text-sm ${
                                                                sortType === 'draft-only' ? 'bg-[#0BB248] text-white' : 'bg-gray-100'
                                                            }`}
                                                        >
                                                            Draft Only
                                                        </button>
                                                        {(sortType === 'active-only' || sortType === 'draft-only') && (
                                                            <button
                                                                onClick={() => {
                                                                    setSortType('newest-to-oldest');
                                                                    toggleFilterMenu();
                                                                }}
                                                                className="text-left px-3 py-2 rounded-lg text-sm bg-gray-100"
                                                            >
                                                                Show All
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Price</h4>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSortType('price-high-to-low');
                                                                toggleFilterMenu();
                                                            }}
                                                            className={`text-left px-3 py-2 rounded-lg text-sm ${
                                                                sortType === 'price-high-to-low' ? 'bg-[#0BB248] text-white' : 'bg-gray-100'
                                                            }`}
                                                        >
                                                            Highest to Lowest
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSortType('price-low-to-high');
                                                                toggleFilterMenu();
                                                            }}
                                                            className={`text-left px-3 py-2 rounded-lg text-sm ${
                                                                sortType === 'price-low-to-high' ? 'bg-[#0BB248] text-white' : 'bg-gray-100'
                                                            }`}
                                                        >
                                                            Lowest to Highest
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Desktop filters - only visible on larger screens */}
                                {displayedProducts.length > 0 && (
                                    <div className="hidden sm:flex w-full sm:w-auto flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-2">
                                        <p className="text-base font-cabin font-normal text-[#0BB248] mb-2 sm:mb-0">Sort By:</p>
                                        <div className="flex items-center flex-wrap gap-2">
                                            {/* Date Sort Button */}
                                            <button 
                                                onClick={() => setShowDateDialog(true)}
                                                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-cabin font-normal cursor-pointer ${sortType.includes('newest') || sortType.includes('oldest') ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'} rounded-[7.8px] py-2 sm:py-3 px-3 sm:px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out`}
                                            >
                                                <Icon icon={calendarOutlineIcon} width="18" height="18" color={sortType.includes('newest') || sortType.includes('oldest') ? "#FFFFFF" : "#0BB248"} />
                                                <p className={`text-xs sm:text-sm font-cabin font-normal`}>Date</p>
                                            </button>

                                            {/* Status Sort Button */}
                                            <button 
                                                onClick={() => setShowStatusDialog(true)}
                                                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-cabin font-normal cursor-pointer ${sortType.includes('active') || sortType.includes('draft') ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'} rounded-[7.8px] py-2 sm:py-3 px-3 sm:px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out`}
                                            >
                                                <Icon icon={clockThinIcon} width="18" height="18" color={sortType.includes('active') || sortType.includes('draft') ? "#FFFFFF" : "#0BB248"} />
                                                <p className={`text-xs sm:text-sm font-cabin font-normal`}>Status</p>
                                            </button>

                                            {/* Price Sort Button */}
                                            <button 
                                                onClick={() => setShowPriceDialog(true)}
                                                className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-cabin font-normal cursor-pointer ${sortType.includes('price') ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'} rounded-[7.8px] py-2 sm:py-3 px-3 sm:px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out`}
                                            >
                                                <Icon icon={sortByTimeLinearIcon} width="18" height="18" color={sortType.includes('price') ? "#FFFFFF" : "#0BB248"} />
                                                <p className={`text-xs sm:text-sm font-cabin font-normal`}>Price</p>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Product Table/Grid */}
                        <div className="w-full">
                            {/* Desktop/Tablet Table View - Hidden on mobile */}
                            <div className="hidden sm:block overflow-x-auto">
                                <div className="flex flex-col w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden min-w-[768px]">
                                    {/* Table Headers */}
                                    <div className={`grid ${activeTab === 'auctions' ? 'grid-cols-[80px_1fr_1fr_1fr_100px_100px]' : 'grid-cols-[80px_1fr_1fr_1fr_1fr_100px_100px]'} gap-4 px-6 py-4 border-b border-[#E5E7EB] bg-white`}>
                                        <div className="text-sm font-medium text-[#17171B]">Image</div>
                                        <div className="text-sm font-medium text-[#17171B]">Product Name</div>
                                        {activeTab !== 'auctions' && (
                                            <div className="text-sm font-medium text-[#17171B]">Upload Status</div>
                                        )}
                                        <div className="text-sm font-medium text-[#17171B]">
                                            {activeTab === 'auctions' ? 'Auction Status' : 'Sold Count'}
                                        </div>
                                        <div className="text-sm font-medium text-[#17171B]">
                                            {activeTab === 'auctions' ? 'Current Bid' : 'Price'}
                                        </div>
                                        <div className="text-sm font-medium text-[#17171B] text-center">
                                            {activeTab === 'auctions' ? 'Time Left' : 'Stock Count'}
                                        </div>
                                        <div className="text-sm font-medium text-[#17171B] text-center">Actions</div>
                                    </div>

                                    {/* Products List for Desktop/Tablet */}
                                    <div className="divide-y divide-[#E5E7EB]">
                                        {displayedProducts.length > 0 ? (
                                            memoizedProducts
                                        ) : (
                                            <div className="flex flex-col h-[50dvh] items-center justify-center gap-4">
                                                <img src={NotFound} alt="not-found" className="w-[120px] sm:w-[180px] md:w-[220px] h-[120px] sm:h-[180px] md:h-[220px]" />
                                                <p className="text-sm sm:text-base font-cabin font-normal text-[#17171B] text-center px-4">
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

                            {/* Mobile Card View - Only visible on mobile screens */}
                            <div className="sm:hidden">
                                {displayedProducts.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {displayedProducts.map((item) => (
                                            <div key={item._id} className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                                                <div className="p-4 flex flex-col gap-3">
                                                    {/* Product Basic Info */}
                                                    <div className="flex gap-3">
                                                        <img 
                                                            src={item?.images[0]?.url}
                                                            alt={item?.name}
                                                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <Link to={`/dashboard/edit-product/${item._id}`} className="hover:text-[#17171B]/70 transition-all duration-200">
                                                                <h3 className="font-medium text-[#17171B] text-sm line-clamp-2">{item?.name}</h3>
                                                            </Link>
                                                            <p className="text-xs text-gray-500 truncate">{item?.category}</p>
                                                            
                                                            {/* Status Badges */}
                                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                                <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                                                                    item.status === 'active' 
                                                                        ? 'bg-[#0BB248]/10 text-[#0BB248]' 
                                                                        : item.status === 'draft'
                                                                            ? 'bg-[#FFA500]/10 text-[#FFA500]'
                                                                            : 'bg-[#9333EA]/10 text-[#9333EA]'
                                                                }`}>
                                                                    {item.status === 'active' ? 'Active' : 
                                                                     item.status === 'draft' ? 'Draft' : 
                                                                     'Auction'}
                                                                </span>
                                                                
                                                                {activeTab === 'auctions' && item.auction && (
                                                                    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                                                                        item.auction.status === 'ended' ? 'bg-[#DF0707]/10 text-[#DF0707]' :
                                                                        item.auction.status === 'ongoing' ? 'bg-[#0BB248]/10 text-[#0BB248]' :
                                                                        'bg-[#FFA500]/10 text-[#FFA500]'
                                                                    }`}>
                                                                        {item.auction.status === 'ended' ? 'Ended' : 
                                                                         item.auction.status === 'ongoing' ? 'Ongoing' : 
                                                                         'Scheduled'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Price, Stock, Bid Info */}
                                                    <div className="grid grid-cols-2 gap-2 mt-1 border-t border-gray-100 pt-3">
                                                        {activeTab === 'auctions' ? (
                                                            <>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Current Bid</p>
                                                                    <p className="text-sm font-medium">
                                                                        {new Intl.NumberFormat('en-NG', {
                                                                            style: 'currency',
                                                                            currency: 'NGN',
                                                                            minimumFractionDigits: 0
                                                                        }).format(item.auction?.currentHighestBid?.amount || 0)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Time Left</p>
                                                                    <div className="flex items-center gap-1">
                                                                        <Icon icon={clockIcon} className="w-3.5 h-3.5 text-gray-500" />
                                                                        <p className="text-sm">
                                                                            {(() => {
                                                                                if (!item.auction) return 'N/A';
                                                                                if (item.auction.status === 'ended') return 'Ended';
                                                                                
                                                                                const now = new Date();
                                                                                const end = new Date(item.auction.endDate);
                                                                                if (now > end) return 'Ended';
                                                                                
                                                                                const diff = end - now;
                                                                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                                                
                                                                                if (days > 0) return `${days}d ${hours}h`;
                                                                                return `${hours}h`;
                                                                            })()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Price</p>
                                                                    <p className="text-sm font-medium">
                                                                        {new Intl.NumberFormat('en-NG', {
                                                                            style: 'currency',
                                                                            currency: 'NGN',
                                                                            minimumFractionDigits: 0
                                                                        }).format(item.price)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Stock</p>
                                                                    <div className="flex gap-2 items-center">
                                                                        <p className="text-sm">{item.stock || 0}</p>
                                                                        <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                                                                            item.stock > 50 ? 'bg-[#0BB248]/10 text-[#0BB248]' :
                                                                            item.stock > 0 ? 'bg-[#FFA500]/10 text-[#FFA500]' :
                                                                            'bg-[#DF0707]/10 text-[#DF0707]'
                                                                        }`}>
                                                                            {item.stock > 50 ? 'In Stock' : 
                                                                             item.stock > 0 ? 'Low Stock' : 
                                                                             'Out of Stock'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Units Sold</p>
                                                                    <p className="text-sm">{item.stats?.soldCount || 0}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-500">Last Updated</p>
                                                                    <p className="text-sm">
                                                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
                                                                    </p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1">
                                                        <div className="flex flex-wrap gap-2 max-w-[70%]">
                                                            {activeTab === 'auctions' ? (
                                                                <>
                                                                    <button 
                                                                        onClick={() => {
                                                                            const event = document.createEvent('MouseEvents');
                                                                            event.initEvent('click', true, true);
                                                                            document.getElementById(`auction-performance-${item._id}`)?.dispatchEvent(event);
                                                                        }}
                                                                        className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1.5 rounded-md w-[calc(50%-4px)]"
                                                                    >
                                                                        <Icon icon={graphBoldIcon} className="w-3.5 h-3.5" />
                                                                        <span>Performance</span>
                                                                    </button>
                                                                    {item.auction?.status === 'ended' && (
                                                                        <button 
                                                                            onClick={() => {
                                                                                const event = document.createEvent('MouseEvents');
                                                                                event.initEvent('click', true, true);
                                                                                document.getElementById(`rerun-auction-${item._id}`)?.dispatchEvent(event);
                                                                            }}
                                                                            className="inline-flex items-center gap-1 text-xs bg-[#17171B] text-white px-2 py-1.5 rounded-md w-[calc(50%-4px)]"
                                                                        >
                                                                            <Icon icon={restartBoldIcon} className="w-3.5 h-3.5" />
                                                                            <span>Rerun</span>
                                                                        </button>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button 
                                                                        onClick={() => {
                                                                            const event = document.createEvent('MouseEvents');
                                                                            event.initEvent('click', true, true);
                                                                            document.getElementById(`product-details-${item._id}`)?.dispatchEvent(event);
                                                                        }}
                                                                        className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1.5 rounded-md w-[calc(50%-4px)]"
                                                                    >
                                                                        <Icon icon={eyeBoldIcon} className="w-3.5 h-3.5" />
                                                                        <span>Details</span>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            const event = document.createEvent('MouseEvents');
                                                                            event.initEvent('click', true, true);
                                                                            document.getElementById(`update-stock-${item._id}`)?.dispatchEvent(event);
                                                                        }}
                                                                        className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1.5 rounded-md w-[calc(50%-4px)]"
                                                                    >
                                                                        <Icon icon={boxEdit24FilledIcon} className="w-3.5 h-3.5" />
                                                                        <span>Stock</span>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            const event = document.createEvent('MouseEvents');
                                                                            event.initEvent('click', true, true);
                                                                            document.getElementById(`upload-blip-${item._id}`)?.dispatchEvent(event);
                                                                        }}
                                                                        className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1.5 rounded-md w-[calc(50%-4px)]"
                                                                    >
                                                                        <Icon icon={videoFrameBoldIcon} className="w-3.5 h-3.5" />
                                                                        <span>Blip</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Link 
                                                                to={`/dashboard/edit-product/${item._id}`}
                                                                className="inline-flex items-center gap-1 text-xs bg-[#17171B]/10 text-[#17171B] px-2 py-1.5 rounded-md"
                                                            >
                                                                <Icon icon={penBoldIcon} className="w-3.5 h-3.5" />
                                                                <span>Edit</span>
                                                            </Link>
                                                            <button 
                                                                onClick={() => {
                                                                    const event = document.createEvent('MouseEvents');
                                                                    event.initEvent('click', true, true);
                                                                    document.getElementById(`delete-product-${item._id}`)?.dispatchEvent(event);
                                                                }}
                                                                className="inline-flex items-center gap-1 text-xs bg-[#DF0707]/10 text-[#DF0707] px-2 py-1.5 rounded-md"
                                                            >
                                                                <Icon icon={trashBinTrashBoldIcon} className="w-3.5 h-3.5" />
                                                                <span>Delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Hidden buttons that will be triggered programmatically */}
                                                    <div className="hidden">
                                                        <button id={`product-details-${item._id}`} onClick={() => window.productDetailsOpen(item._id)}></button>
                                                        <button id={`update-stock-${item._id}`} onClick={() => window.stockModalOpen(item._id)}></button>
                                                        <button id={`auction-performance-${item._id}`} onClick={() => window.auctionModalOpen(item._id)}></button>
                                                        <button id={`rerun-auction-${item._id}`} onClick={() => window.rerunAuctionOpen(item._id)}></button>
                                                        <button id={`delete-product-${item._id}`} onClick={() => window.deleteProduct(item._id)}></button>
                                                        <button id={`upload-blip-${item._id}`} onClick={() => window.uploadBlipOpen(item._id)}></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-[50dvh] items-center justify-center gap-4 bg-white rounded-xl border border-[#E5E7EB] p-4">
                                        <img src={NotFound} alt="not-found" className="w-[120px]" />
                                        <p className="text-sm font-cabin font-normal text-[#17171B] text-center px-4">
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

                        {/* Pagination Controls - Improved for mobile */}
                        {paginationData && paginationData.totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between flex-wrap gap-3 mt-4 lg:mt-8 w-full px-2 sm:px-4 py-3">
                                <div className="text-xs sm:text-sm text-gray-600 w-full sm:w-auto text-center sm:text-left">
                                    Showing {displayedProducts.length} of {paginationData.totalProducts} products
                                </div>
                                <div className="flex items-center justify-center flex-wrap gap-3 w-full sm:w-auto">
                                    {/* Mobile pagination display */}
                                    <div className="flex sm:hidden items-center justify-center w-full">
                                        <button 
                                            onClick={handlePreviousPage}
                                            disabled={currentPage <= 1}
                                            className={`flex-1 ${
                                                currentPage <= 1 
                                                    ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                                                    : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                                            } flex items-center justify-center gap-1 rounded-l-lg py-2 transition-all duration-300 ease-in-out`}
                                        >
                                            <Icon icon={arrowLongLeftIcon} width="14" height="14" color={currentPage <= 1 ? "#a0a0a0" : "#FFFFFF"} />
                                            <span className="text-xs">Prev</span>
                                        </button>
                                        
                                        <span className="px-4 py-2 text-xs bg-gray-50 border-t border-b border-gray-200">
                                            Page {currentPage} of {paginationData.totalPages}
                                        </span>
                                        
                                        <button 
                                            onClick={handleNextPage}
                                            disabled={currentPage >= paginationData.totalPages}
                                            className={`flex-1 ${
                                                currentPage >= paginationData.totalPages 
                                                    ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                                                    : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                                            } flex items-center justify-center gap-1 rounded-r-lg py-2 transition-all duration-300 ease-in-out`}
                                        >
                                            <span className="text-xs">Next</span>
                                            <Icon icon={arrowLongRightIcon} width="14" height="14" color={currentPage >= paginationData.totalPages ? "#a0a0a0" : "#FFFFFF"} />
                                        </button>
                                    </div>
                                    
                                    {/* Desktop pagination controls */}
                                    <div className="hidden sm:flex items-center justify-center gap-3">
                                        <button 
                                            onClick={handlePreviousPage}
                                            disabled={currentPage <= 1}
                                            className={`text-xs sm:text-sm font-cabin font-normal ${
                                                currentPage <= 1 
                                                    ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                                                    : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                                            } flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 transition-all duration-500 ease-in-out`}
                                        >
                                            <Icon icon={arrowLongLeftIcon} width="16" height="16" color={currentPage <= 1 ? "#a0a0a0" : "#FFFFFF"} />
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
                                                    : 'text-[#ffffff] bg-[#17171B] hover:bg-[#17171B]/90'
                                            } flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 transition-all duration-500 ease-in-out`}
                                        >
                                            <p className="text-xs sm:text-sm font-cabin font-normal">Next</p>
                                            <Icon icon={arrowLongRightIcon} width="16" height="16" color={currentPage >= paginationData.totalPages ? "#a0a0a0" : "#FFFFFF"} />
                                        </button>
                                    </div>
                                        
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="text-xs sm:text-sm font-cabin font-normal text-[#ffffff] bg-[#17171B] flex items-center gap-1 sm:gap-2 rounded-full py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap hover:bg-[#17171B]/90 transition-all duration-500 ease-in-out">
                                                <p className="text-xs sm:text-sm font-cabin font-normal text-[#FFFFFF]">{itemsPerPage} per page</p>
                                                <Icon icon={arrowDownIcon} width="8" height="8" color="#FFFFFF" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                            <Command>
                                                <CommandList>
                                                    <CommandGroup>
                                                        <CommandItem onSelect={() => handleItemsPerPageChange(10)}>
                                                            <span>10 per page</span>
                                                            {itemsPerPage === 10 && <Icon icon={checkIcon} className="ml-auto" />}
                                                        </CommandItem>
                                                        <CommandItem onSelect={() => handleItemsPerPageChange(20)}>
                                                            <span>20 per page</span>
                                                            {itemsPerPage === 20 && <Icon icon={checkIcon} className="ml-auto" />}
                                                        </CommandItem>
                                                        <CommandItem onSelect={() => handleItemsPerPageChange(50)}>
                                                            <span>50 per page</span>
                                                            {itemsPerPage === 50 && <Icon icon={checkIcon} className="ml-auto" />}
                                                        </CommandItem>
                                                        <CommandItem onSelect={() => handleItemsPerPageChange(100)}>
                                                            <span>100 per page</span>
                                                            {itemsPerPage === 100 && <Icon icon={checkIcon} className="ml-auto" />}
                                                        </CommandItem>
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}
                    </>
                )
            }

            {/* Date Sort Dialog */}
            <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
                <DialogContent className="sm:max-w-[425px] p-4 sm:p-6 max-w-[90vw] mx-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Sort by Date</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Choose how to sort products by their creation date
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <button
                            onClick={() => {
                                setSortType('newest-to-oldest');
                                setShowDateDialog(false);
                            }}
                            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg text-sm ${
                                sortType === 'newest-to-oldest' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
                            }`}
                        >
                            <span>Newest to Oldest</span>
                            {sortType === 'newest-to-oldest' && <Icon icon={checkIcon} />}
                        </button>
                        <button
                            onClick={() => {
                                setSortType('oldest-to-newest');
                                setShowDateDialog(false);
                            }}
                            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg text-sm ${
                                sortType === 'oldest-to-newest' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
                            }`}
                        >
                            <span>Oldest to Newest</span>
                            {sortType === 'oldest-to-newest' && <Icon icon={checkIcon} />}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Status Sort Dialog */}
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <DialogContent className="sm:max-w-[425px] max-w-[90vw] mx-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Filter by Status</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Choose which product status to display
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <button
                            onClick={() => {
                                setSortType('active-only');
                                setShowStatusDialog(false);
                            }}
                            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg text-sm ${
                                sortType === 'active-only' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
                            }`}
                        >
                            <span>Show Active Only</span>
                            {sortType === 'active-only' && <Icon icon={checkIcon} />}
                        </button>
                        <button
                            onClick={() => {
                                setSortType('draft-only');
                                setShowStatusDialog(false);
                            }}
                            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg text-sm ${
                                sortType === 'draft-only' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
                            }`}
                        >
                            <span>Show Draft Only</span>
                            {sortType === 'draft-only' && <Icon icon={checkIcon} />}
                        </button>
                        <button
                            onClick={() => {
                                setSortType('newest-to-oldest');
                                setShowStatusDialog(false);
                            }}
                            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg text-sm ${
                                sortType === 'newest-to-oldest' && !sortType.includes('active') && !sortType.includes('draft') 
                                    ? 'bg-[#0BB248] text-white' 
                                    : 'bg-[#0BB24817] text-[#0BB248]'
                            }`}
                        >
                            <span>Show All</span>
                            {sortType === 'newest-to-oldest' && !sortType.includes('active') && !sortType.includes('draft') && <Icon icon={checkIcon} />}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Price Sort Dialog */}
            <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
                <DialogContent className="sm:max-w-[425px] max-w-[90vw] mx-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Sort by Price</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Choose how to sort products by price
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <button
                            onClick={() => {
                                setSortType('price-high-to-low');
                                setShowPriceDialog(false);
                            }}
                            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg text-sm ${
                                sortType === 'price-high-to-low' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
                            }`}
                        >
                            <span>Highest to Lowest</span>
                            {sortType === 'price-high-to-low' && <Icon icon={checkIcon} />}
                        </button>
                        <button
                            onClick={() => {
                                setSortType('price-low-to-high');
                                setShowPriceDialog(false);
                            }}
                            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg text-sm ${
                                sortType === 'price-low-to-high' ? 'bg-[#0BB248] text-white' : 'bg-[#0BB24817] text-[#0BB248]'
                            }`}
                        >
                            <span>Lowest to Highest</span>
                            {sortType === 'price-low-to-high' && <Icon icon={checkIcon} />}
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Product Details Modal */}
            {selectedProduct && (
                <Dialog open={openProductDetails} onOpenChange={setOpenProductDetails}>
                    <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Product Details</DialogTitle>
                            <DialogDescription>
                                Comprehensive information about this product
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                            {/* Product Basic Info */}
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-1/3">
                                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                        <img 
                                            src={selectedProduct.images[0]?.url} 
                                            alt={selectedProduct.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {selectedProduct.images.slice(1, 4).map((image, index) => (
                                            <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                <img 
                                                    src={image.url}
                                                    alt={`${selectedProduct.name} ${index + 2}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-full md:w-2/3 space-y-4">
                                    <div>
                                        <h2 className="text-xl font-semibold">{selectedProduct.name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                selectedProduct.status === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {selectedProduct.status.charAt(0).toUpperCase() + selectedProduct.status.slice(1)}
                                            </span>
                                            <span className="text-sm text-gray-500">SKU: {selectedProduct.sku || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-500">Category</p>
                                            <p className="font-medium">{selectedProduct.category} • {selectedProduct.subCategory}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-500">Brand</p>
                                            <p className="font-medium">{selectedProduct.brand || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-500">Price</p>
                                            <p className="font-medium">
                                                {new Intl.NumberFormat('en-NG', {
                                                    style: 'currency',
                                                    currency: 'NGN',
                                                    minimumFractionDigits: 0
                                                }).format(selectedProduct.price)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-500">Current Stock</p>
                                            <p className="font-medium">{selectedProduct.stock}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500">Description</p>
                                        <div className="text-sm prose prose-sm max-w-none overflow-auto max-h-[200px]" 
                                            dangerouslySetInnerHTML={{ __html: selectedProduct.description || '' }}>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Link
                                            to={`/dashboard/edit-product/${selectedProduct._id}`}
                                            className="px-4 py-2 bg-[#17171B] text-white rounded-md hover:bg-[#17171B]/90 transition-all duration-200 flex items-center gap-2"
                                        >
                                            <Icon icon={penBoldIcon} className="w-4 h-4" />
                                            Edit Product
                                        </Link>
                                        <button 
                                            onClick={() => {
                                                setOpenProductDetails(false);
                                                setProductToDelete(selectedProduct);
                                                setShowDeleteDialog(true);
                                            }}
                                            className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-all duration-200 flex items-center gap-2"
                                        >
                                            <Icon icon={trashBinTrashBoldIcon} className="w-4 h-4" />
                                            Delete Product
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            
            {/* Stock Update Modal */}
            <StockUpdateModal
                open={openStockModal}
                onClose={() => setOpenStockModal(false)}
                item={selectedProduct}
                onUpdate={handleStockUpdate}
                isSubmitting={isSubmitting}
            />
            
            {/* Auction Performance Modal */}
            {selectedProduct && activeTab === 'auctions' && (
                <Dialog open={openAuctionModal} onOpenChange={setOpenAuctionModal}>
                    <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-xl sm:text-2xl font-bold text-[#17171B]">Auction Performance</DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Detailed information about this auction's performance
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                            {/* This is a placeholder for auction details */}
                            <div className="text-center text-sm text-gray-500 py-8">
                                This is a placeholder for the auction performance details.
                                In a real implementation, this would include auction statistics, bidding history, etc.
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            
            {/* Rerun Auction Dialog */}
            {selectedProduct && activeTab === 'auctions' && (
                <Dialog open={showRerunDialog} onOpenChange={setShowRerunDialog}>
                    <DialogContent className="sm:max-w-[500px] max-w-[90vw] mx-auto p-6">
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-xl sm:text-2xl font-bold text-[#17171B]">Rerun Auction</DialogTitle>
                            <DialogDescription className="text-sm sm:text-base">
                                Configure the new auction parameters. End date is required, other fields are optional.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4">
                            {/* This is a placeholder for the rerun auction form */}
                            <div className="text-center text-sm text-gray-500 py-8">
                                This is a placeholder for the auction rerun form.
                                In a real implementation, this would include date pickers, bid settings, etc.
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setShowRerunDialog(false)}
                                    className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-medium transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => setShowRerunDialog(false)}
                                    className="px-6 py-3 bg-[#17171B] text-white rounded-lg hover:bg-[#17171B]/90 font-medium transition-all flex items-center gap-2"
                                >
                                    <Icon icon={restartBoldIcon} className="w-5 h-5" />
                                    <span>Rerun Auction</span>
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* BlipUploadModal - For product blip video uploads */}
            {selectedProduct && (
                <BlipUploadModal
                    open={openBlipUploadModal}
                    onClose={() => setOpenBlipUploadModal(false)}
                    productId={selectedProduct._id}
                    product={selectedProduct}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-[500px] max-w-[90vw] mx-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl text-red-600">Confirm Product Deletion</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            Are you sure you want to delete this product? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-4">
                        {productToDelete && (
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                <img
                                    src={productToDelete?.images[0]?.url}
                                    alt={productToDelete?.name}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-contain bg-white"
                                />
                                <div>
                                    <h3 className="font-medium text-[#17171B] text-sm sm:text-base line-clamp-2">{productToDelete?.name}</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">SKU: {productToDelete?.sku || 'N/A'}</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                            <h4 className="font-medium text-yellow-800 mb-2">What happens when you delete this product?</h4>
                            <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                                <li>The product will be permanently removed from your inventory</li>
                                <li>Any active orders containing this product will not be affected</li>
                                <li>Product analytics and historical data will be lost</li>
                                <li>The product will no longer appear in your store</li>
                                {activeTab === 'auctions' && (
                                    <li>All auction data and bids associated with this product will be lost</li>
                                )}
                            </ul>
                        </div>
                        
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => setShowDeleteDialog(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteProduct}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
                            >
                                <Icon icon={trashBinTrashBoldIcon} className="w-4 h-4" />
                                Delete Product
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ProductsPage
