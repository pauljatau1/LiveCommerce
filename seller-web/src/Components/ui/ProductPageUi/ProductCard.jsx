import { useState, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteProduct } from '../../../Redux/Slices/ProductSlice';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "../../ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../ui/popover";
import { BASE_URL } from '../../../Constants/Server';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import axios from 'axios';
import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "../../ui/dialog";

// Auction Performance Modal component
const AuctionPerformanceModal = ({ open, onClose, auctionId }) => {
    const [auctionData, setAuctionData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isRerunLoading, setIsRerunLoading] = useState(false);

    const fetchAuctionData = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };
            
            const response = await axios.get(`${BASE_URL}/products/${id}`, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });
            
            if (response.status === 200) {
                setAuctionData(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch auction data:", err);
            setError("Failed to load auction data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleRerunAuction = async () => {
        if (!auctionData || !auctionData._id) return;

        setIsRerunLoading(true);
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };
            
            // Rerun with default values from the API (will use previous settings)
            const response = await axios.post(`${BASE_URL}/products/${auctionData._id}/rerun-auction`, {}, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 200) {
                toast.success("Auction rerun successfully", {
                    description: "Your auction has been rescheduled with previous settings",
                    style: {
                        background: '#05031F',
                        color: '#fff',
                    }
                });
                fetchAuctionData(auctionData._id); // Refresh data
            }
        } catch (err) {
            console.error("Failed to rerun auction:", err);
            toast.error("Failed to rerun auction", {
                description: err.response?.data?.message || "Please try again later",
                style: {
                    background: '#05031F',
                    color: '#fff',
                }
            });
        } finally {
            setIsRerunLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "N/A";
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    React.useEffect(() => {
        if (open && auctionId) {
            fetchAuctionData(auctionId);
        }
    }, [open, auctionId, fetchAuctionData]);

    // Determine if there's a current leader (highest bidder) in the auction
    const getCurrentLeader = () => {
        if (!auctionData?.auction?.bids || auctionData.auction.bids.length === 0) return null;
        
        // Sort bids by amount in descending order and get the highest
        const sortedBids = [...auctionData.auction.bids].sort((a, b) => b.amount - a.amount);
        return sortedBids[0];
    };

    const currentLeader = auctionData?.auction?.currentHighestBid || getCurrentLeader();
    const isEnded = auctionData?.auction?.status === 'ended';
    const canRerun = isEnded && auctionData?.status === 'offline_auction';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Auction Performance</DialogTitle>
                    <DialogDescription>
                        Detailed information about this auction's performance
                    </DialogDescription>
                </DialogHeader>
                
                {loading ? (
                    <div className="flex justify-center py-12">
                        <CircularProgress color="inherit" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">
                        <Icon icon="solar:danger-bold" className="w-12 h-12 mx-auto mb-2" />
                        <p>{error}</p>
                    </div>
                ) : auctionData ? (
                    <div className="space-y-6">
                        {/* Product Basic Info */}
                        <div className="flex gap-4 items-start">
                            {auctionData.images && auctionData.images.length > 0 && (
                                <img 
                                    src={auctionData.images[0].url} 
                                    alt={auctionData.name} 
                                    className="w-24 h-24 rounded-lg object-cover"
                                />
                            )}
                            <div>
                                <h3 className="text-lg font-medium">{auctionData.name}</h3>
                                <p className="text-sm text-gray-500">{auctionData.category} • {auctionData.subCategory}</p>
                            </div>
                        </div>
                        
                        {/* Auction Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Status</p>
                                <p className="text-lg font-medium capitalize">
                                    {auctionData.auction?.status || "N/A"}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Min Bid</p>
                                <p className="text-lg font-medium">
                                    {formatCurrency(auctionData.auction?.minBid)}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Max Bid</p>
                                <p className="text-lg font-medium">
                                    {formatCurrency(auctionData.auction?.maxBid)}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Current Highest Bid</p>
                                <p className="text-lg font-medium">
                                    {formatCurrency(auctionData.auction?.currentHighestBid?.amount)}
                                </p>
                            </div>
                        </div>
                        
                        {/* Auction Timeline */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-4">Auction Timeline</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Start Date</p>
                                    <p className="font-medium">{formatDate(auctionData.auction?.startDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">End Date</p>
                                    <p className="font-medium">{formatDate(auctionData.auction?.endDate)}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-sm text-gray-500">End on Max Bid</p>
                                    <p className="font-medium">{auctionData.auction?.endOnMaxBid ? "Yes" : "No"}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Winner Info / Current Leader */}
                        {isEnded && auctionData.auction?.winner ? (
                            <div className="border border-green-100 bg-green-50 p-4 rounded-lg">
                                <h4 className="font-medium text-green-800 mb-4">Auction Winner</h4>
                                <div className="flex items-center gap-3">
                                    {auctionData.auction.winner.buyer?.profileImage && (
                                        <img 
                                            src={auctionData.auction.winner.buyer.profileImage.url} 
                                            alt={`${auctionData.auction.winner.buyer.firstName} ${auctionData.auction.winner.buyer.lastName}`}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">{auctionData.auction.winner.buyer?.firstName} {auctionData.auction.winner.buyer?.lastName}</p>
                                        <p className="text-sm text-green-800">
                                            Winning Bid: {formatCurrency(auctionData.auction.winner.bidAmount)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Won on: {formatDate(auctionData.auction.winner.winningDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : currentLeader ? (
                            <div className="border border-purple-100 bg-purple-50 p-4 rounded-lg">
                                <h4 className="font-medium text-purple-800 mb-4">Current Leader</h4>
                                <div className="flex items-center gap-3">
                                    {currentLeader.buyer?.profileImage && (
                                        <img 
                                            src={currentLeader.buyer.profileImage.url} 
                                            alt={`${currentLeader.buyer.firstName} ${currentLeader.buyer.lastName}`}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    )}
                                    <div>
                                        <p className="font-medium">{currentLeader.buyer?.firstName} {currentLeader.buyer?.lastName}</p>
                                        <p className="text-sm text-purple-800">
                                            Leading Bid: {formatCurrency(currentLeader.amount)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Bid on: {formatDate(currentLeader.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        
                        {/* Rerun Auction Button for ended auctions */}
                        {canRerun && (
                            <div className="flex justify-center">
                                <button 
                                    onClick={handleRerunAuction}
                                    disabled={isRerunLoading}
                                    className="bg-[#05031F] text-white px-6 py-3 rounded-md hover:bg-[#05031F]/90 transition-all duration-200 flex items-center gap-2"
                                >
                                    {isRerunLoading ? (
                                        <>
                                            <CircularProgress size={20} color="inherit" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="solar:restart-bold" className="w-5 h-5" />
                                            <span>Rerun Auction</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                        
                        {/* Bid History */}
                        {auctionData.auction?.bids && auctionData.auction.bids.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-4">Bid History ({auctionData.auction.bids.length})</h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Bidder
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {auctionData.auction.bids.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((bid) => (
                                                <tr key={bid._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {bid.buyer?.profileImage && (
                                                                <div className="flex-shrink-0 h-8 w-8 mr-3">
                                                                    <img className="h-8 w-8 rounded-full" src={bid.buyer.profileImage.url} alt="" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {bid.buyer?.firstName} {bid.buyer?.lastName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{formatCurrency(bid.amount)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{formatDate(bid.createdAt)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            bid.status === 'won' ? 'bg-green-100 text-green-800' : 
                                                            bid.amount === currentLeader?.amount ? 'bg-purple-100 text-purple-800' : 
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {bid.status === 'won' ? 'Won' : 
                                                             bid.amount === currentLeader?.amount ? 'Leading' : 'Lost'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        
                        {/* Analytics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Product Views</p>
                                <p className="text-xl font-medium">{auctionData.stats?.views || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Total Bids</p>
                                <p className="text-xl font-medium">{auctionData.auction?.bids?.length || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Last Viewed</p>
                                <p className="text-sm font-medium">{formatDate(auctionData.stats?.lastViewed)}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No auction data available</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

AuctionPerformanceModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    auctionId: PropTypes.string
};

// Create a separate component for the stock update modal
const StockUpdateModal = React.memo(({ open, onClose, item, onUpdate, isSubmitting }) => {
    const [newStock, setNewStock] = useState(item?.stock || null);
    

    // Modal style configuration
    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '425px',
        bgcolor: 'background.paper',
        borderRadius: '8px',
        boxShadow: 24,
        p: { xs: 2, sm: 4 },
        maxHeight: '90vh',
        overflow: 'auto',
        '&:focus': {
            outline: 'none',
        }
    };

    const handleStockChange = useCallback((e) => {
        const value = e.target.value;
        setNewStock(Math.max(0, parseInt(value) || 0));
    }, []);

    const handleStockIncreaseButton = () => {
        setNewStock((prev) => prev + 1)
    }

    const handleStockDecreaseButton = () => {
        setNewStock((prev) => {
            if (prev > 0) {
                return prev - 1
            } else {
                toast.error("Stock cannot be less than 0")
                return 0
            }
        })
    }

    const handleSubmit = async () => {
        await onUpdate(newStock);
    };


    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <div className="relative">
                    <button
                        onClick={onClose}
                        className="absolute right-0 top-0 rounded-full p-1.5 sm:p-2 hover:bg-gray-100"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="sm:w-6 sm:h-6">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div className="flex flex-col gap-6 pt-4">
                        <div className="text-center">
                            <h1 className="text-xl xl:text-2xl font-bold text-[#05031F]">Update Stock</h1>
                            <p className="text-sm text-gray-500 mt-2">Update stock quantity for {item?.name}</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                                <img
                                    src={item?.images[0]?.url}
                                    alt={item?.name}
                                    className="w-16 h-16 rounded-lg object-contain bg-white"
                                />
                                <div>
                                    <h3 className="font-medium text-[#05031F]">{item?.name}</h3>
                                    <p className="text-sm text-gray-500">Current Stock: {item?.stock}</p>
                                </div>
                            </div>

                          <div className="flex items-center justify-between gap-4">
                          <TextField
                                label="New Stock Quantity"
                                type="text"
                                disabled
                                value={newStock}
                                onChange={handleStockChange}
                               
                                variant="outlined"
                                InputProps={{
                                    inputProps: { min: 0 }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#05031F',
                                            borderWidth: '1px',
                                        },
                                    },
                                    '& label.Mui-focused': {
                                        color: '#05031F',
                                    },
                                    '&:hover': {
                                        borderColor: 'none',
                                    }
                                }}
                            />
                            <div className="flex items-center gap-4">
                                <button onClick={handleStockIncreaseButton} className="bg-[#05031F] text-white px-2 py-1 h-14 w-14 rounded-md">+</button>
                                <button onClick={handleStockDecreaseButton} className="bg-[#05031F] text-white px-2 py-1 h-14 w-14 rounded-md">-</button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3  mt-4">
                            <button
                                className=" border border-[#05031F] flex-1 text-[#05031F] px-2 py-1 h-14 w-14 rounded-md"
                                onClick={onClose}
                      
                            >
                                Cancel
                            </button>
                            <button
                                className="bg-[#05031F] flex-1 text-white px-2 py-1 h-14 w-14 rounded-md hover:bg-[#05031F]/80 transition-all duration-200"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                             
                            >
                                {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Update Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            </Box>
        </Modal>
    );
});

StockUpdateModal.displayName = 'StockUpdateModal';
StockUpdateModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    item: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
};

// Product Details Modal component
const ProductDetailsModal = ({ open, onClose, productId }) => {
    const [productData, setProductData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProductData = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };
            
            const response = await axios.get(`${BASE_URL}/products/${id}`, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });
            
            if (response.status === 200) {
                setProductData(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch product data:", err);
            setError("Failed to load product data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "N/A";
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    React.useEffect(() => {
        if (open && productId) {
            fetchProductData(productId);
        }
    }, [open, productId, fetchProductData]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[900px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Product Details</DialogTitle>
                    <DialogDescription>
                        Comprehensive information about this product
                    </DialogDescription>
                </DialogHeader>
                
                {loading ? (
                    <div className="flex justify-center py-12">
                        <CircularProgress color="inherit" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">
                        <Icon icon="solar:danger-bold" className="w-12 h-12 mx-auto mb-2" />
                        <p>{error}</p>
                    </div>
                ) : productData ? (
                    <div className="space-y-6">
                        {/* Product Basic Info */}
                        <div className="flex gap-6">
                            <div className="w-1/3">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                    <img 
                                        src={productData.images[0]?.url} 
                                        alt={productData.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {productData.images.slice(1).map((image, index) => (
                                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                            <img 
                                                src={image.url}
                                                alt={`${productData.name} ${index + 2}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="w-2/3 space-y-4">
                                <div>
                                    <h2 className="text-xl font-semibold">{productData.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            productData.status === 'active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {productData.status.charAt(0).toUpperCase() + productData.status.slice(1)}
                                        </span>
                                        <span className="text-sm text-gray-500">SKU: {productData.sku}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-500">Category</p>
                                        <p className="font-medium">{productData.category} • {productData.subCategory}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-500">Brand</p>
                                        <p className="font-medium">{productData.brand || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-500">Price</p>
                                        <p className="font-medium">{formatCurrency(productData.price)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-500">Current Stock</p>
                                        <p className="font-medium">{productData.stock}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500">Description</p>
                                    <p className="text-sm">{productData.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats and Performance */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Total Views</p>
                                    <p className="text-xl font-medium">{productData.stats?.views || 0}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Units Sold</p>
                                    <p className="text-xl font-medium">{productData.stats?.soldCount || 0}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Last Viewed</p>
                                    <p className="text-sm font-medium">{formatDate(productData.stats?.lastViewed)}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Last Restocked</p>
                                    <p className="text-sm font-medium">{formatDate(productData.stats?.lastRestocked)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Information */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Inventory Details</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Current Stock</p>
                                    <p className="text-xl font-medium">{productData.inventory?.currentStock || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Low Stock Alert: {productData.inventory?.lowStockThreshold || 0} units
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Minimum Purchase</p>
                                    <p className="text-xl font-medium">{productData.minimumPurchaseQuantity || 1} unit(s)</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">Product Condition</p>
                                    <p className="text-xl font-medium capitalize">{productData.condition || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Link
                                to={`/dashboard/edit-product/${productData._id}`}
                                className="px-4 py-2 bg-[#05031F] text-white rounded-md hover:bg-[#05031F]/90 transition-all duration-200 flex items-center gap-2"
                            >
                                <Icon icon="solar:pen-bold" className="w-4 h-4" />
                                Edit Product
                            </Link>
                            <button
                                onClick={() => {
                                    onClose();
                                    handleProductDelete(productData._id);
                                }}
                                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition-all duration-200 flex items-center gap-2"
                            >
                                <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                Delete Product
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No product data available</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

ProductDetailsModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    productId: PropTypes.string
};

const ProductCard = ({ item, setIsStockUpdated, isAuction = false }) => {
    // Separate states for mobile and desktop popovers
    const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false);
    const [isDesktopPopoverOpen, setIsDesktopPopoverOpen] = useState(false);
    const [openStockModal, setOpenStockModal] = useState(false);
    const [openAuctionModal, setOpenAuctionModal] = useState(false);
    const [openProductDetails, setOpenProductDetails] = useState(false);
    const dispatch = useDispatch();
    const { isLoading, deleteStatus, deletedProductId } = useSelector(state => state.product);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRerunLoading, setIsRerunLoading] = useState(false);



    const getStockStatus = (stock) => {
        if (stock > 50) return { text: 'In Stock', class: 'bg-[#0BB248]/10 text-[#0BB248]' };
        if (stock > 0) return { text: 'Low Stock', class: 'bg-[#FFA500]/10 text-[#FFA500]' };
        return { text: 'Out of Stock', class: 'bg-[#DF0707]/10 text-[#DF0707]' };
    };

    const getUploadStatus = (status) => {
        if (status === "active") return { text: 'Active', class: 'bg-[#0BB248]/10 text-[#0BB248]' };
        if (status === "draft") return { text: 'Draft', class: 'bg-[#FFA500]/10 text-[#FFA500]' };
        if (status === "offline_auction") return { text: 'Offline Auction', class: 'bg-[#9333EA]/10 text-[#9333EA]' };
        // Default case
        return { text: '', class: 'bg-green-200 text-gray-500' };
    };

    const getAuctionStatus = (auction) => {
        if (!auction) return { text: 'N/A', class: 'bg-gray-100 text-gray-500' };
        if (auction.status === 'ended') return { text: 'Ended', class: 'bg-[#DF0707]/10 text-[#DF0707]' };
        if (auction.status === 'ongoing') return { text: 'Ongoing', class: 'bg-[#0BB248]/10 text-[#0BB248]' };
        if (auction.status === 'active') return { text: 'Active', class: 'bg-[#0BB248]/10 text-[#0BB248]' };
        if (new Date(auction.startDate) > new Date()) return { text: 'Scheduled', class: 'bg-[#FFA500]/10 text-[#FFA500]' };
        return { text: auction.status || 'Unknown', class: 'bg-gray-100 text-gray-500' };
    };

    const getTimeLeft = (auction) => {
        if (!auction) return 'N/A';
        if (auction.status === 'ended') return 'Ended';
        
        const now = new Date();
        const end = new Date(auction.endDate);
        if (now > end) return 'Ended';
        
        const diff = end - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const status = isAuction ? getAuctionStatus(item.auction) : getStockStatus(item?.stock);
    const uploadStatus = getUploadStatus(item.status);

    const handleProductDelete = (productId) => {
        dispatch(deleteProduct(productId));
    };

    console.log(item)

    const SpecificDeletedProduct = item._id === deletedProductId;
    console.log('attempted deleted product', deletedProductId)
    console.log('specific deleted product', SpecificDeletedProduct)


    const handleStockUpdate = async (newStock) => {
        try {
            setIsSubmitting(true);
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null, isVerified: null };
            const response = await axios.put(`${BASE_URL}/products/${item._id}/inventory`, {
                quantity: newStock,
                operation: newStock > item?.stock ? "add" : "subtract"
            }, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });
            if (response.status === 200) {
                setOpenStockModal(false);
                setIsStockUpdated(prev => !prev);
                toast.success("Stock updated successfully");
            }
        } catch (error) {
            toast.error("Failed to update stock", {
                description: error.response.data.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStatusLoading = () => {
        if (item._id === deletedProductId) {
            return deleteStatus
        }
        return false
    }

    // Add function to handle rerun auction
    const handleRerunAuction = async (e) => {
        e.stopPropagation();
        setIsRerunLoading(true);
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null, isVerified: null };
            
            const response = await axios.post(`${BASE_URL}/products/${item._id}/rerun-auction`, {}, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 200) {
                toast.success("Auction rerun successfully", {
                    description: "Your auction has been rescheduled with previous settings",
                    style: {
                        background: '#05031F',
                        color: '#fff',
                    }
                });
                // Refresh product data
                setIsStockUpdated(prev => !prev);
            }
        } catch (error) {
            toast.error("Failed to rerun auction", {
                description: error.response?.data?.message || "Please try again later",
                style: {
                    background: '#05031F',
                    color: '#fff',
                }
            });
        } finally {
            setIsRerunLoading(false);
        }
    };

    // Check if the auction is ended and can be rerun
    const canRerunAuction = isAuction && 
                            item.auction?.status === 'ended' && 
                            item.status === 'offline_auction';

    // Desktop Card Layout
    const DesktopCard = () => (
        <div className="hidden lg:grid grid-cols-[80px_1fr_1fr_1fr_1fr_100px_120px] gap-4 px-6 py-4 items-center">
            <img
                src={item?.images[0]?.url}
                alt={item?.name}
                className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
                <Link to={`/dashboard/edit-product/${item._id}`} className="hover:text-[#05031F]/70 transition-all duration-200">
                    <h3 className="font-medium text-[#05031F] line-clamp-2">{item?.name}</h3>
                </Link>
                <p className="text-sm text-gray-500">{item?.category}</p>
            </div>
            <div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${uploadStatus.class}`}>
                    {uploadStatus.text}
                </div>
            </div>
            <div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${status.class}`}>
                    {status.text}
                </div>
                {canRerunAuction && (
                    <button
                        onClick={handleRerunAuction}
                        disabled={isRerunLoading}
                        className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-[#05031F] hover:bg-[#05031F]/90 text-white rounded-md text-xs transition-all duration-200"
                    >
                        {isRerunLoading ? (
                            <CircularProgress size={14} color="inherit" />
                        ) : (
                            <>
                                <Icon icon="solar:restart-bold" className="w-3 h-3" />
                                Rerun Auction
                            </>
                        )}
                    </button>
                )}
            </div>
            <div className="text-sm font-medium text-[#05031F]">
                {isAuction ? (
                    formatCurrency(item.auction?.currentHighestBid?.amount || 0)
                ) : (
                    formatCurrency(item?.price)
                )}
            </div>
            <div className="text-center">
                {isAuction ? (
                    <span className="text-sm text-gray-500">{getTimeLeft(item.auction)}</span>
                ) : (
                    <span className="text-sm text-gray-500">{item?.stock}</span>
                )}
            </div>
            <div className="flex items-center gap-2">
                {!isAuction && (
                    <button 
                        onClick={() => setOpenProductDetails(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-blue-100 text-blue-700 transition-all duration-200" 
                        title="View Product Details"
                    >
                        <Icon icon="solar:eye-bold" className="w-4 h-4" />
                    </button>
                )}
                {isAuction && (
                    <button 
                        onClick={() => setOpenAuctionModal(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-purple-100 text-purple-700 transition-all duration-200" 
                        title="View Auction Performance"
                    >
                        <Icon icon="solar:graph-bold" className="w-4 h-4" />
                    </button>
                )}
                <Popover open={isDesktopPopoverOpen} onOpenChange={setIsDesktopPopoverOpen}>
                    <PopoverTrigger asChild>
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#05031F]/5 transition-all duration-200">
                            <Icon icon="solar:pen-bold" className="w-4 h-4 text-[#05031F]" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="end">
                        <Command>
                            <CommandList>
                                <CommandGroup>
                                    <CommandItem onSelect={() => {
                                        setIsDesktopPopoverOpen(false)
                                        setOpenStockModal(true)
                                    }} className="cursor-pointer">
                                        <Icon icon="fluent:box-edit-24-filled" className="w-6 h-6 text-[#05031F]" />
                                        <span className="ml-2 text-[#05031F]">Change Stock</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => setIsDesktopPopoverOpen(false)} className="cursor-pointer">
                                        <Icon icon="clarity:clipboard-solid" className="w-6 h-6 text-[#05031F]" />
                                        <Link to={`/dashboard/edit-product/${item._id}`} className="ml-2 text-[#05031F]">Edit Product</Link>
                                    </CommandItem>
                                    {isAuction && (
                                        <CommandItem onSelect={() => {
                                            setIsDesktopPopoverOpen(false);
                                            setOpenAuctionModal(true);
                                        }} className="cursor-pointer">
                                            <Icon icon="solar:graph-bold" className="w-6 h-6 text-purple-700" />
                                            <span className="ml-2 text-purple-700">Auction Performance</span>
                                        </CommandItem>
                                    )}
                                    {canRerunAuction && (
                                        <CommandItem onSelect={() => {
                                            setIsDesktopPopoverOpen(false);
                                            handleRerunAuction(new Event('click'));
                                        }} className="cursor-pointer">
                                            <Icon icon="solar:restart-bold" className="w-6 h-6 text-[#05031F]" />
                                            <span className="ml-2 text-[#05031F]">Rerun Auction</span>
                                        </CommandItem>
                                    )}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <button 
                    onClick={() => handleProductDelete(item._id)} 
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#DF0707]/5 transition-all duration-200"
                >
                    {
                        SpecificDeletedProduct ? (
                            handleDeleteStatusLoading() ? <CircularProgress color="#DF0707" size={16} /> : <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4 text-[#DF0707]" />
                        ) : (
                            <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4 text-[#DF0707]" />
                        )
                    }
                </button>
            </div>
        </div>
    );

    // Mobile Card Layout
    const MobileCard = () => (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <img
                        src={item?.images[0]?.url}
                        alt={item?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="space-y-1">
                        <Link to={`/dashboard/edit-product/${item._id}`} className="hover:text-[#05031F]/70 transition-all duration-200">
                            <h3 className="font-medium text-[#05031F] line-clamp-2">{item?.name}</h3>
                        </Link>
                        <p className="text-sm text-gray-500">{item?.category}</p>
                        {isAuction ? (
                            <>
                                <p className="text-sm font-medium text-[#05031F]">
                                    Current Bid: {formatCurrency(item.auction?.currentHighestBid?.amount || 0)}
                                </p>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${status.class}`}>
                                    {status.text}
                                </div>
                                {canRerunAuction && (
                                    <button
                                        onClick={handleRerunAuction}
                                        disabled={isRerunLoading}
                                        className="mt-1 flex items-center gap-1.5 px-2 py-1 bg-[#05031F] hover:bg-[#05031F]/90 text-white rounded-md text-xs transition-all duration-200"
                                    >
                                        {isRerunLoading ? (
                                            <CircularProgress size={14} color="inherit" />
                                        ) : (
                                            <>
                                                <Icon icon="solar:restart-bold" className="w-3 h-3" />
                                                Rerun Auction
                                            </>
                                        )}
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-[#05031F]">{formatCurrency(item?.price)}</p>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${status.class}`}>
                                    {status.text}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-2 items-center justify-center">
                    <span className={`w-[90px] flex items-center justify-center py-1 rounded-md text-xs whitespace-nowrap ${status.class}`}>
                        {status.text}
                    </span>
                    <span className={`w-[90px] flex items-center justify-center py-1 rounded-md text-xs whitespace-nowrap ${uploadStatus?.class}`}>
                        {uploadStatus?.text}
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {!isAuction && (
                        <button 
                            onClick={() => setOpenProductDetails(true)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-blue-100 text-blue-700 transition-all duration-200" 
                            title="View Product Details"
                        >
                            <Icon icon="solar:eye-bold" className="w-4 h-4" />
                        </button>
                    )}
                    {isAuction && (
                        <button 
                            onClick={() => setOpenAuctionModal(true)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-purple-100 text-purple-700 transition-all duration-200" 
                            title="View Auction Performance"
                        >
                            <Icon icon="solar:graph-bold" className="w-4 h-4" />
                        </button>
                    )}
                    <Popover open={isMobilePopoverOpen} onOpenChange={setIsMobilePopoverOpen}>
                        <PopoverTrigger asChild>
                            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#05031F]/5 transition-all duration-200">
                                <Icon icon="solar:pen-bold" className="w-4 h-4 text-[#05031F]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="end">
                            <Command>
                                <CommandList>
                                    <CommandGroup>
                                        <CommandItem onSelect={() => {
                                            setIsMobilePopoverOpen(false)
                                            setOpenStockModal(true)
                                        }}>
                                            <Icon icon="fluent:box-edit-24-filled" className="w-6 h-6 text-[#05031F]" />
                                            <span className="ml-2 text-[#05031F]">Change Stock</span>
                                        </CommandItem>
                                        <CommandItem onSelect={() => setIsMobilePopoverOpen(false)} className="cursor-pointer">
                                            <Icon icon="clarity:clipboard-solid" className="w-6 h-6 text-[#05031F]" />
                                            <Link to={`/dashboard/edit-product/${item._id}`} className="ml-2 text-[#05031F]">Edit Product</Link>
                                        </CommandItem>
                                        {isAuction && (
                                            <CommandItem onSelect={() => {
                                                setIsMobilePopoverOpen(false);
                                                setOpenAuctionModal(true);
                                            }} className="cursor-pointer">
                                                <Icon icon="solar:graph-bold" className="w-6 h-6 text-purple-700" />
                                                <span className="ml-2 text-purple-700">Auction Performance</span>
                                            </CommandItem>
                                        )}
                                        {canRerunAuction && (
                                            <CommandItem onSelect={() => {
                                                setIsMobilePopoverOpen(false);
                                                handleRerunAuction(new Event('click'));
                                            }} className="cursor-pointer">
                                                <Icon icon="solar:restart-bold" className="w-6 h-6 text-[#05031F]" />
                                                <span className="ml-2 text-[#05031F]">Rerun Auction</span>
                                            </CommandItem>
                                        )}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <button 
                        onClick={() => handleProductDelete(item._id)} 
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#DF0707]/5 transition-all duration-200"
                    >
                        {handleDeleteStatusLoading() ? 
                            <CircularProgress color="#DF0707" size={16} /> : 
                            <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4 text-[#DF0707]" />
                        }
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="lg:hidden border-b border-[#E5E7EB] bg-white">
                <MobileCard />
            </div>
            <DesktopCard />
            
            {/* Modals */}
            <StockUpdateModal
                open={openStockModal}
                onClose={() => setOpenStockModal(false)}
                item={item}
                onUpdate={handleStockUpdate}
                isSubmitting={isSubmitting}
            />
            
            <AuctionPerformanceModal
                open={openAuctionModal}
                onClose={() => setOpenAuctionModal(false)}
                auctionId={item._id}
            />

            <ProductDetailsModal
                open={openProductDetails}
                onClose={() => setOpenProductDetails(false)}
                productId={item._id}
            />
        </>
    );
};

ProductCard.propTypes = {
    item: PropTypes.object.isRequired,
    setIsStockUpdated: PropTypes.func.isRequired,
    isAuction: PropTypes.bool
};

// Memoize the entire ProductCard component
export default React.memo(ProductCard, (prevProps, nextProps) => {
    return prevProps.item._id === nextProps.item._id &&
        prevProps.item.stock === nextProps.item.stock;
});
