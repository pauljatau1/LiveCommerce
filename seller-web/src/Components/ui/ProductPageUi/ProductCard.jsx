import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteProduct, fetchSellerProducts } from '../../../Redux/Slices/ProductSlice';
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
import { Calendar } from "../calendar";
import { Input } from "../input";
import { Progress } from "../progress";
import VideoPlayer from "@shared/VideoPlayer"; 
// Import all icons directly
import plusIcon from '@iconify-icons/tabler/plus';
import magnifyingGlassIcon from '@iconify-icons/heroicons/magnifying-glass';
import checkIcon from '@iconify-icons/lucide/check';

import { BiPlayCircle } from 'react-icons/bi';

// Auction Performance Modal component
const AuctionPerformanceModal = ({ open, onClose, auctionId, setShowRerunDialog }) => {
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
                        background: '#17171B',
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
                    background: '#17171B',
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
            <DialogContent className="max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl sm:text-2xl font-bold text-[#17171B]">Auction Performance</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
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
                        {/* Product Basic Info - More responsive */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-auto">
                                <img 
                                    src={auctionData.images[0].url} 
                                    alt={auctionData.name} 
                                    className="w-full sm:w-24 h-24 rounded-lg object-cover"
                                />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-medium">{auctionData.name}</h3>
                                <p className="text-sm text-gray-500">{auctionData.category} • {auctionData.subCategory}</p>
                            </div>
                        </div>
                        
                        {/* Auction Stats - More responsive grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                        
                        {/* Auction Timeline - Better mobile layout */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium mb-4">Auction Timeline</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Start Date</p>
                                    <p className="font-medium">{formatDate(auctionData.auction?.startDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">End Date</p>
                                    <p className="font-medium">{formatDate(auctionData.auction?.endDate)}</p>
                                </div>
                                <div className="sm:col-span-2">
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
                                    onClick={() => {
                                        onClose();
                                        setShowRerunDialog(true);
                                    }}
                                    className="bg-[#17171B] text-white px-6 py-3 rounded-md hover:bg-[#17171B]/90 transition-all duration-200 flex items-center gap-2"
                                >
                                    <Icon icon="solar:restart-bold" className="w-5 h-5" />
                                    <span>Rerun Auction</span>
                                </button>
                            </div>
                        )}
                        
                        {/* Bid History - Responsive table */}
                        {auctionData.auction?.bids && auctionData.auction.bids.length > 0 && (
                            <div className="overflow-x-auto">
                                <div className="min-w-full">
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
                            </div>
                        )}
                        
                        {/* Analytics - Responsive grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
    auctionId: PropTypes.string,
    setShowRerunDialog: PropTypes.func.isRequired
};

// Create a separate component for the stock update modal
const StockUpdateModal = React.memo(({ open, onClose, item, onUpdate, isSubmitting }) => {
    const [stockChange, setStockChange] = useState(0);
    const [operation, setOperation] = useState('add'); // 'add' or 'subtract'
    

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
        setStockChange(Math.max(0, parseInt(value) || 0));
    }, []);

    const handleStockIncreaseButton = () => {
        setOperation('add');
    }

    const handleStockDecreaseButton = () => {
        setOperation('subtract');
    }

    const handleSubmit = async () => {
        if (stockChange <= 0) {
            toast.error("Please enter a valid quantity");
            return;
        }
        await onUpdate(stockChange, operation);
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
                            <h1 className="text-xl xl:text-2xl font-bold text-[#17171B]">Update Stock</h1>
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
                                    <h3 className="font-medium text-[#17171B]">{item?.name}</h3>
                                    <p className="text-sm text-gray-500">Current Stock: {item?.stock}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleStockIncreaseButton}
                                        className={`flex-1 py-3 px-4 rounded-lg font-medium text-center ${
                                            operation === 'add' 
                                                ? 'bg-[#0BB248]/10 text-[#0BB248] border-2 border-[#0BB248]' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        Add Stock
                                    </button>
                                    <button 
                                        onClick={handleStockDecreaseButton}
                                        className={`flex-1 py-3 px-4 rounded-lg font-medium text-center ${
                                            operation === 'subtract' 
                                                ? 'bg-[#DF0707]/10 text-[#DF0707] border-2 border-[#DF0707]' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        Remove Stock
                                    </button>
                                </div>

                                <p className="text-sm text-gray-500 text-center">
                                    {operation === 'add' 
                                        ? `Adding stock will increase total to: ${item?.stock + stockChange}` 
                                        : `Removing stock will decrease total to: ${Math.max(0, item?.stock - stockChange)}`
                                    }
                                </p>

                                <div className="flex items-center justify-between gap-4">
                                    <TextField
                                        label={`${operation === 'add' ? 'Add' : 'Remove'} Quantity`}
                                        type="number"
                                        value={stockChange}
                                        onChange={handleStockChange}
                                        variant="outlined"
                                        InputProps={{
                                            inputProps: { min: 0 }
                                        }}
                                        sx={{
                                            flex: 1,
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: operation === 'add' ? '#0BB248' : '#DF0707',
                                                    borderWidth: '1px',
                                                },
                                            },
                                            '& label.Mui-focused': {
                                                color: operation === 'add' ? '#0BB248' : '#DF0707',
                                            },
                                        }}
                                    />
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setStockChange(prev => prev + 1)} 
                                            className={`h-14 w-14 rounded-md flex items-center justify-center ${
                                                operation === 'add' 
                                                    ? 'bg-[#0BB248] text-white' 
                                                    : 'bg-[#DF0707] text-white'
                                            }`}
                                        >
                                            <Icon icon="solar:add-circle-bold" className="w-6 h-6" />
                                        </button>
                                        <button 
                                            onClick={() => setStockChange(prev => Math.max(0, prev - 1))} 
                                            className={`h-14 w-14 rounded-md flex items-center justify-center ${
                                                operation === 'add' 
                                                    ? 'bg-[#0BB248] text-white' 
                                                    : 'bg-[#DF0707] text-white'
                                            }`}
                                            disabled={stockChange <= 0}
                                        >
                                            <Icon icon="solar:minus-circle-bold" className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                className="border border-[#17171B] flex-1 text-[#17171B] px-2 py-1 h-14 rounded-md"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                className={`flex-1 text-white px-2 py-1 h-14 rounded-md transition-all duration-200 ${
                                    operation === 'add' 
                                        ? 'bg-[#0BB248] hover:bg-[#0BB248]/80' 
                                        : 'bg-[#DF0707] hover:bg-[#DF0707]/80'
                                }`}
                                onClick={handleSubmit}
                                disabled={isSubmitting || stockChange <= 0}
                            >
                                {isSubmitting ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    `${operation === 'add' ? 'Add' : 'Remove'} ${stockChange} ${stockChange === 1 ? 'Unit' : 'Units'}`
                                )}
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
const ProductDetailsModal = ({ open, onClose, productId, handleDelete }) => {
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
                                    <div className="text-sm prose prose-sm max-w-none overflow-auto max-h-[200px]" 
                                        dangerouslySetInnerHTML={{ __html: productData.description || '' }}>
                                    </div>
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
                                className="px-4 py-2 bg-[#17171B] text-white rounded-md hover:bg-[#17171B]/90 transition-all duration-200 flex items-center gap-2"
                            >
                                <Icon icon="solar:pen-bold" className="w-4 h-4" />
                                Edit Product
                            </Link>
                            <button
                                onClick={() => {
                                    onClose();
                                    handleDelete(productId);
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
    productId: PropTypes.string,
    handleDelete: PropTypes.func.isRequired
};

// Add RerunAuctionDialog component before the ProductCard component
const RerunAuctionDialog = ({ open, onClose, onSubmit, isLoading, defaultValues }) => {
    const [formData, setFormData] = useState({
        startDate: '',
        endDate: '',
        minBid: defaultValues?.minBid || '',
        maxBid: defaultValues?.maxBid || '',
        endOnMaxBid: defaultValues?.endOnMaxBid || false
    });
    const [formErrors, setFormErrors] = useState({});

    const handleStartNow = () => {
        setFormData(prev => ({
            ...prev,
            startDate: new Date().toISOString().slice(0, 16)
        }));
    };

    useEffect(() => {
        if (defaultValues) {
            setFormData(prev => ({
                ...prev,
                minBid: defaultValues.minBid || '',
                maxBid: defaultValues.maxBid || '',
                endOnMaxBid: defaultValues.endOnMaxBid || false
            }));
        }
    }, [defaultValues]);

    const validateForm = () => {
        const errors = {};
        if (!formData.endDate) {
            errors.endDate = "End date is required";
        } else {
            const endDate = new Date(formData.endDate);
            const now = new Date();
            if (endDate <= now) {
                errors.endDate = "End date must be in the future";
            }
            if (formData.startDate && new Date(formData.startDate) >= endDate) {
                errors.startDate = "Start date must be before end date";
            }
        }
        if (formData.minBid && formData.maxBid && Number(formData.minBid) >= Number(formData.maxBid)) {
            errors.minBid = "Minimum bid must be less than maximum bid";
            errors.maxBid = "Maximum bid must be greater than minimum bid";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when field is changed
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        const submitData = {
            ...formData,
            minBid: formData.minBid ? Number(formData.minBid) : undefined,
            maxBid: formData.maxBid ? Number(formData.maxBid) : undefined
        };
        onSubmit(submitData);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-6">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl font-bold text-[#17171B]">Rerun Auction</DialogTitle>
                    <DialogDescription className="text-base">
                        Configure the new auction parameters. End date is required, other fields are optional.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Start Date</label>
                                <button
                                    type="button"
                                    onClick={handleStartNow}
                                    className="text-sm text-[#17171B] hover:text-[#17171B]/80 font-medium flex items-center gap-1"
                                >
                                    <Icon icon="solar:play-bold" className="w-4 h-4" />
                                    Start Now
                                </button>
                            </div>
                            <input
                                type="datetime-local"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#17171B]/20 focus:border-[#17171B] transition-all ${
                                    formErrors.startDate ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                }`}
                                min={new Date().toISOString().slice(0, 16)}
                            />
                            {formErrors.startDate && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <Icon icon="solar:danger-bold" className="w-4 h-4" />
                                    {formErrors.startDate}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">End Date (Required)</label>
                            <input
                                type="datetime-local"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#17171B]/20 focus:border-[#17171B] transition-all ${
                                    formErrors.endDate ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                }`}
                                min={new Date().toISOString().slice(0, 16)}
                            />
                            {formErrors.endDate && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <Icon icon="solar:danger-bold" className="w-4 h-4" />
                                    {formErrors.endDate}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Minimum Bid</label>
                                <input
                                    type="number"
                                    name="minBid"
                                    value={formData.minBid}
                                    onChange={handleChange}
                                    placeholder={`Previous: ₦${defaultValues?.minBid || 0}`}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#17171B]/20 focus:border-[#17171B] transition-all ${
                                        formErrors.minBid ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                    }`}
                                    min="0"
                                />
                                {formErrors.minBid && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <Icon icon="solar:danger-bold" className="w-4 h-4" />
                                        {formErrors.minBid}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Maximum Bid</label>
                                <input
                                    type="number"
                                    name="maxBid"
                                    value={formData.maxBid}
                                    onChange={handleChange}
                                    placeholder={`Previous: ₦${defaultValues?.maxBid || 0}`}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#17171B]/20 focus:border-[#17171B] transition-all ${
                                        formErrors.maxBid ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                    }`}
                                    min="0"
                                />
                                {formErrors.maxBid && (
                                    <p className="text-sm text-red-500 flex items-center gap-1">
                                        <Icon icon="solar:danger-bold" className="w-4 h-4" />
                                        {formErrors.maxBid}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg">
                            <input
                                type="checkbox"
                                name="endOnMaxBid"
                                id="endOnMaxBid"
                                checked={formData.endOnMaxBid}
                                onChange={handleChange}
                                className="rounded border-gray-300 text-[#17171B] focus:ring-[#17171B]"
                            />
                            <label htmlFor="endOnMaxBid" className="text-sm font-medium text-gray-700">
                                End auction when max bid is reached
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-medium transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !formData.endDate}
                            className="px-6 py-3 bg-[#17171B] text-white rounded-lg hover:bg-[#17171B]/90 disabled:opacity-50 font-medium transition-all flex items-center gap-2"
                        >
                            {isLoading ? (
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
                </form>
            </DialogContent>
        </Dialog>
    );
};

RerunAuctionDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    defaultValues: PropTypes.object
};

// Update the BlipUploadModal to include product information
export const BlipUploadModal = ({ open, onClose, productId, product }) => {
    const [blipVideos, setBlipVideos] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    const [existingBlips, setExistingBlips] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingBlipId, setDeletingBlipId] = useState(null);
    const [isLoadingProduct, setIsLoadingProduct] = useState(false);

    // Fetch complete product data with blips when modal opens
    const fetchProductWithBlips = useCallback(async () => {
        if (!productId) return;
        
        setIsLoadingProduct(true);
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };
            
            const response = await axios.get(`${BASE_URL}/products/${productId}`, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });
            
            if (response.status === 200 && response.data) {
                // Check if the returned product has blips
                if (response.data.blips && Array.isArray(response.data.blips)) {
                    setExistingBlips(response.data.blips);
                }
            }
        } catch (error) {
            console.error('Error fetching product blips:', error);
            toast.error('Failed to load product blips', {
                description: error.response?.data?.message || 'Please try again',
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            setIsLoadingProduct(false);
        }
    }, [productId]);

    // Fetch existing blips when modal opens
    useEffect(() => {
        if (open && productId) {
            // First check if product prop already has blips
            if (product?.blips && Array.isArray(product.blips)) {
                setExistingBlips(product.blips);
            }
            
            // Then fetch the latest data from API to ensure we have the most recent blips
            fetchProductWithBlips();
        }
    }, [open, productId, product, fetchProductWithBlips]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const newPreviewUrls = [];
        
        // Validate each file
        files.forEach(file => {
            // Check if file is a video
            if (!file.type.startsWith('video/')) {
                toast.error(`${file.name} is not a video file`);
                return;
            }
            
            // Check file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 50MB)`);
                return;
            }

            validFiles.push(file);
            
            // Create preview URL
            const objectUrl = URL.createObjectURL(file);
            newPreviewUrls.push(objectUrl);
        });
        
        // Check if adding these files would exceed limit of 5 total blips
        if (existingBlips.length + validFiles.length > 5) {
            toast.error(`You can only have a maximum of 5 blips per product. You currently have ${existingBlips.length}.`);
            // Clear previews
            newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
            return;
        }

        setBlipVideos(prev => [...prev, ...validFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    };

    const handleRemoveFile = (index) => {
        // Revoke the URL to prevent memory leaks
        URL.revokeObjectURL(previewUrls[index]);
        
        // Remove the file and preview
        setBlipVideos(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (blipVideos.length === 0) {
            toast.error('Please select at least one video to upload');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        
        try {
            const formData = new FormData();
            blipVideos.forEach(file => {
                formData.append('blipVideos', file);
            });
            
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };
            
            // Create upload request with progress tracking
            const response = await axios.post(
                `${BASE_URL}/products/${productId}/blips`, 
                formData, 
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.data}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                }
            );
            
            if (response.status === 201) {
                toast.success(`${blipVideos.length} blip video${blipVideos.length > 1 ? 's' : ''} uploaded successfully`, {
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
                
                // Update existing blips with new ones from response
                if (response.data && response.data.blips) {
                    setExistingBlips(response.data.blips);
                }
                
                // Clear the selected files
                setBlipVideos([]);
                setPreviewUrls([]);
            }
        } catch (error) {
            console.error('Error uploading blips:', error);
            toast.error('Failed to upload blip videos', {
                description: error.response?.data?.message || 'Please try again',
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteBlip = async (blipId) => {
        if (!blipId) return;
        
        setIsDeleting(true);
        setDeletingBlipId(blipId);
        
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };
            
            const response = await axios.delete(
                `${BASE_URL}/products/${productId}/blips/${blipId}`, 
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.data}`
                    }
                }
            );
            
            if (response.status === 200) {
                toast.success('Blip video deleted successfully', {
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
                
                // Remove the deleted blip from the list
                setExistingBlips(prev => prev.filter(blip => blip._id !== blipId));
            }
        } catch (error) {
            console.error('Error deleting blip:', error);
            toast.error('Failed to delete blip video', {
                description: error.response?.data?.message || 'Please try again',
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            setIsDeleting(false);
            setDeletingBlipId(null);
        }
    };

    const handleTriggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleClose = () => {
        // Clean up preview URLs to prevent memory leaks
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setBlipVideos([]);
        setPreviewUrls([]);
        setUploadProgress(0);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[700px] p-6 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl font-bold text-[#17171B]">Manage Product Blips</DialogTitle>
                    <DialogDescription className="text-base">
                        Add up to 5 short video blips to showcase your product
                    </DialogDescription>
                </DialogHeader>
                
                {/* Product Information */}
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg my-4">
                    <img 
                        src={product?.images[0]?.url} 
                        alt={product?.name}
                        className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                        <h3 className="font-medium text-[#17171B]">{product?.name}</h3>
                        <p className="text-sm text-gray-500">
                            {product?.category} • {product?.subCategory}
                        </p>
                        <p className="text-xs mt-1">
                            {existingBlips.length}/5 blips used
                        </p>
                    </div>
                </div>
                
                {/* Existing Blips Section */}
                {existingBlips.length > 0 ? (
                    <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-medium text-lg">Existing Blips</h4>
                            <button 
                                onClick={fetchProductWithBlips}
                                disabled={isLoadingProduct}
                                className="text-xs flex items-center gap-1 text-[#17171B] hover:text-[#17171B]/80"
                            >
                                <Icon icon={isLoadingProduct ? "mdi:loading" : "solar:refresh-bold"} className={`w-4 h-4 ${isLoadingProduct ? "animate-spin" : ""}`} />
                                <span>Refresh</span>
                            </button>
                        </div>
                        
                        {isLoadingProduct ? (
                            <div className="flex justify-center items-center py-8">
                                <CircularProgress size={30} color="inherit" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {existingBlips.map((blip) => (
                                    <div key={blip._id} className="border rounded-lg p-3 relative">
                                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                            <VideoPlayer 
                                                src={blip.url} 
                                                poster={blip.thumbnail}  
                                                style={{ borderRadius: 0, maxHeight: 360 }}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-gray-500">
                                                <div className="flex items-center">
                                                {/* Added date */}
                                                <span>
                                                    Added:&nbsp;{new Date(blip.createdAt).toLocaleDateString()}
                                                </span>

                                                {/* show only while NOT processed */}
                                                {!blip.processed && (
                                                    <span className="flex items-center gap-2 text-red-500 ml-5">
                                                    {/* loader */}
                                                    <svg
                                                        className="h-4 w-4 animate-spin"
                                                        viewBox="0 0 24 24"
                                                        aria-hidden="true"
                                                    >
                                                        <circle
                                                        className="opacity-25"
                                                        cx="12" cy="12" r="10"
                                                        stroke="currentColor" strokeWidth="4" fill="none"
                                                        />
                                                        <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
                                                        />
                                                    </svg>
                                                    <span>Processing…</span>
                                                    </span>
                                                )}
                                                </div>
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteBlip(blip._id)}
                                                disabled={isDeleting && deletingBlipId === blip._id}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete blip"
                                            >
                                                {isDeleting && deletingBlipId === blip._id ? (
                                                    <CircularProgress size={20} color="inherit" />
                                                ) : (
                                                    <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 p-6 border rounded-lg bg-gray-50 text-center">
                        {isLoadingProduct ? (
                            <div className="flex flex-col items-center gap-3">
                                <CircularProgress size={30} color="inherit" />
                                <p className="text-gray-500">Loading product blips...</p>
                            </div>
                        ) : (
                            <>
                                <Icon icon="solar:video-frame-broken-bold" className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                <p className="text-gray-500">No blips have been added to this product yet</p>
                                <p className="text-sm text-gray-400 mt-1">Upload your first blip below</p>
                            </>
                        )}
                    </div>
                )}
                
                {/* Add New Blips Section */}
                <div className="space-y-6 mt-6">
                    <h4 className="font-medium text-lg">Add New Blips {blipVideos.length > 0 ? `(${blipVideos.length})` : ''}</h4>
                    
                    {/* Only show upload area if not at max capacity */}
                    {existingBlips.length < 5 ? (
                        <div 
                            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all
                                ${blipVideos.length > 0 ? 'border-[#17171B]' : 'border-gray-300'}`}
                            onClick={handleTriggerFileInput}
                        >
                            <input 
                                type="file" 
                                accept="video/*"
                                className="hidden" 
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                multiple
                            />
                            
                            <div className="text-center space-y-3">
                                <Icon icon="solar:video-frame-bold" className="w-12 h-12 text-gray-400 mx-auto" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-700">Click to select video files</p>
                                    <p className="text-xs text-gray-500">MP4, MOV, or WebM up to 50MB each</p>
                                    <p className="text-xs text-gray-500">You can add {5 - existingBlips.length} more blip(s)</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border rounded-lg p-6 bg-yellow-50 text-yellow-800">
                            <p className="text-center">You've reached the maximum limit of 5 blips for this product. Delete existing blips to add new ones.</p>
                        </div>
                    )}
                    
                    {/* Selected Files Preview */}
                    {blipVideos.length > 0 && (
                        <div className="space-y-4">
                            <h5 className="font-medium">Selected Videos</h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {blipVideos.map((file, index) => (
                                    <div key={index} className="border rounded-lg p-3 relative">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFile(index);
                                            }}
                                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm hover:bg-gray-100 z-10"
                                        >
                                            <Icon icon="solar:close-circle-bold" className="w-6 h-6 text-gray-700" />
                                        </button>
                                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                            <video 
                                                src={previewUrls[index]} 
                                                className="w-full h-full object-contain" 
                                                controls
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 truncate">
                                            {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {isUploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Uploading {blipVideos.length} video{blipVideos.length > 1 ? 's' : ''}...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-medium transition-all"
                            disabled={isUploading || isDeleting}
                        >
                            {blipVideos.length > 0 || existingBlips.length > 0 ? 'Done' : 'Cancel'}
                        </button>
                        {blipVideos.length > 0 && (
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={blipVideos.length === 0 || isUploading || isDeleting}
                                className="px-6 py-3 bg-[#17171B] text-white rounded-lg hover:bg-[#17171B]/90 disabled:opacity-50 font-medium transition-all flex items-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <CircularProgress size={20} color="inherit" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:upload-bold" className="w-5 h-5" />
                                        <span>Upload {blipVideos.length} Blip{blipVideos.length > 1 ? 's' : ''}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

BlipUploadModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    productId: PropTypes.string.isRequired,
    product: PropTypes.object.isRequired
};

const ProductCard = ({ item, setIsStockUpdated, isAuction = false }) => {
    // Separate states for mobile and desktop popovers
    const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false);
    const [isDesktopPopoverOpen, setIsDesktopPopoverOpen] = useState(false);
    const [openStockModal, setOpenStockModal] = useState(false);
    const [openAuctionModal, setOpenAuctionModal] = useState(false);
    const [openProductDetails, setOpenProductDetails] = useState(false);
    const [openBlipUploadModal, setOpenBlipUploadModal] = useState(false);
    const dispatch = useDispatch();
    const { isLoading, deleteStatus, deletedProductId } = useSelector(state => state.product);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRerunLoading, setIsRerunLoading] = useState(false);
    const [showRerunDialog, setShowRerunDialog] = useState(false);
    // Add the missing state declaration for delete confirmation dialog
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const pagination = useSelector((state) => state.product.pagination);

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

    const handleProductDelete = useCallback(async (productId) => {
        await dispatch(deleteProduct(productId)).unwrap();
        const params = {
            page: 1,
            limit: 10
        }; 
        dispatch(fetchSellerProducts(params)); 
    }, [dispatch]);

    console.log(item)

    const SpecificDeletedProduct = item._id === deletedProductId;
    console.log('attempted deleted product', deletedProductId)
    console.log('specific deleted product', SpecificDeletedProduct)

    const handleStockUpdate = async (stockChange, operation) => {
        try {
            setIsSubmitting(true);
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null, isVerified: null };
            const response = await axios.put(`${BASE_URL}/products/${item._id}/inventory`, {
                quantity: stockChange,
                operation: operation // "add" or "subtract"
            }, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`
                }
            });
            if (response.status === 200) {
                setOpenStockModal(false);
                setIsStockUpdated(prev => !prev);
                toast.success(`Stock ${operation === 'add' ? 'increased' : 'decreased'} successfully`);
            }
        } catch (error) {
            toast.error("Failed to update stock", {
                description: error.response?.data?.message || "Please try again"
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

    // Update handleRerunAuction function
    const handleRerunAuction = async (formData) => {
        setIsRerunLoading(true);
        try {
            const sellerToken = localStorage.getItem('sellerToken');
            const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null };
            
            const response = await axios.post(`${BASE_URL}/products/${item._id}/rerun-auction`, formData, {
                headers: {
                    Authorization: `Bearer ${tokenData.data}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 200) {
                toast.success("Auction rerun successfully", {
                    description: "Your auction has been rescheduled with the new settings",
                    style: {
                        background: '#17171B',
                        color: '#fff',
                    }
                });
                setShowRerunDialog(false);
                setIsStockUpdated(prev => !prev);
            }
        } catch (error) {
            toast.error("Failed to rerun auction", {
                description: error.response?.data?.message || "Please try again later",
                style: {
                    background: '#17171B',
                    color: '#fff',
                }
            });
        } finally {
            setIsRerunLoading(false);
        }
    };

    // Update the rerun button click handler
    const handleRerunClick = (e) => {
        e.stopPropagation();
        setShowRerunDialog(true);
    };

    // Check if the auction is ended and can be rerun
    const canRerunAuction = isAuction && 
                            item.auction?.status === 'ended' && 
                            item.status === 'offline_auction';

    // Desktop Card Layout
    const DesktopCard = () => (
        <div className="hidden lg:grid grid-cols-[80px_1.5fr_0.8fr_0.8fr_0.8fr_80px_120px_120px] gap-4 px-6 py-4 items-center">
            <img
                src={item?.images[0]?.url}
                alt={item?.name}
                className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
                <Link to={`/dashboard/edit-product/${item._id}`} className="hover:text-[#17171B]/70 transition-all duration-200">
                    <h3 className="font-medium text-[#17171B] line-clamp-2">{item?.name}</h3>
                </Link>
                <p className="text-sm text-gray-500">{item?.category}</p>
            </div>
            <div>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${uploadStatus.class}`}>
                    {uploadStatus.text}
                </div>
            </div>
            <div>
                {isAuction ? (
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${status.class}`}>
                        {status.text}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">{item?.stats?.soldCount || 0}</p>
                )}
                {canRerunAuction && (
                    <button
                        onClick={handleRerunClick}
                        className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-[#17171B] hover:bg-[#17171B]/90 text-white rounded-md text-xs transition-all duration-200"
                        title="Schedule a new auction with this product"
                    >
                        <Icon icon="solar:restart-bold" className="w-3 h-3" />
                        <span>Rerun Auction</span>
                    </button>
                )}
            </div>
            <div className="text-sm font-medium text-[#17171B]">
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
            {!isAuction && (
                <div className="text-center">
                    <button
                        onClick={() => setOpenBlipUploadModal(true)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                            item?.blips?.length > 0 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                        title="Blips are short promotional videos that showcase your product in action"
                    >
                        <BiPlayCircle className="w-4 h-4" />
                        <span>{item?.blips?.length > 0 ? `${item?.blips.length} Blips` : 'Add Blip'}</span>
                    </button>
                </div>
            )}
            <div className="flex items-center gap-2">
                {!isAuction && (
                    <>
                        <button 
                            onClick={() => setOpenProductDetails(true)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-blue-100 text-blue-700 transition-all duration-200" 
                            title="View detailed information about this product"
                        >
                            <Icon icon="solar:eye-bold" className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setOpenBlipUploadModal(true)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-green-100 text-green-600 transition-all duration-200" 
                            title="Upload a short promotional video for this product"
                        >
                            <BiPlayCircle className="w-4 h-4" />
                        </button>
                    </>
                )}
                {isAuction && (
                    <button 
                        onClick={() => setOpenAuctionModal(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-purple-100 text-purple-700 transition-all duration-200" 
                        title="View auction statistics and bidding history"
                    >
                        <Icon icon="solar:graph-bold" className="w-4 h-4" />
                    </button>
                )}
                <Popover open={isDesktopPopoverOpen} onOpenChange={setIsDesktopPopoverOpen}>
                    <PopoverTrigger asChild>
                        <button 
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#17171B]/5 transition-all duration-200"
                            title="More actions"
                        >
                            <Icon icon="solar:menu-dots-bold" width="18" height="18" color="#17171B" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48" align="end">
                        <div className="flex flex-col">
                            <Link
                                to={`/dashboard/edit-product/${item._id}`}
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#17171B]/5 rounded-md transition-all duration-200"
                            >
                                <Icon icon="solar:pen-bold" width="14" height="14" />
                                <span className="text-sm">Edit Product</span>
                            </Link>
                            {!isAuction && (
                                <button
                                    onClick={() => setOpenStockModal(true)}
                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#17171B]/5 rounded-md transition-all duration-200 text-left"
                                >
                                    <Icon icon="fluent:box-edit-24-filled" width="14" height="14" />
                                    <span className="text-sm">Update Stock</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-600 rounded-md transition-all duration-200 text-left"
                                disabled={handleDeleteStatusLoading()}
                            >
                                {
                                    handleDeleteStatusLoading() ? (
                                        <Icon icon="mdi:loader" className="animate-spin" width="14" height="14" />
                                    ) : (
                                        <Icon icon="solar:trash-bin-trash-bold" width="14" height="14" />
                                    )
                                }
                                <span className="text-sm">{handleDeleteStatusLoading() ? 'Deleting...' : 'Delete Product'}</span>
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );

    // Mobile Card Layout
    const MobileCard = () => (
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 relative">
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                <img
                    src={item?.images[0]?.url}
                    alt={item?.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                    <Link to={`/dashboard/edit-product/${item._id}`} className="hover:text-[#17171B]/70 transition-all duration-200">
                        <h3 className="font-medium text-[#17171B] line-clamp-2 text-sm sm:text-base">{item?.name}</h3>
                    </Link>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{item?.category}</p>
                    {isAuction ? (
                        <>
                            <p className="text-xs sm:text-sm font-medium text-[#17171B]">
                                Current Bid: {formatCurrency(item.auction?.currentHighestBid?.amount || 0)}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${status.class}`}>
                                    {status.text}
                                </div>
                                {canRerunAuction && (
                                    <button
                                        onClick={handleRerunClick}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#17171B] hover:bg-[#17171B]/90 text-white rounded-md text-xs transition-all duration-200"
                                        title="Schedule a new auction with this product"
                                    >
                                        <Icon icon="solar:restart-bold" className="w-3 h-3" />
                                        <span className="text-xs">Rerun</span>
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <p className="text-xs sm:text-sm font-medium text-[#17171B]">{formatCurrency(item?.price)}</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${uploadStatus?.class}`}>
                                    {uploadStatus?.text}
                                </span>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-500">
                                <p>Stock: {item?.stock}</p>
                                <p>Sold: {item?.stats?.soldCount || 0}</p>
                                <p>Blips: {item?.blips?.length || 0}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="absolute right-4 top-4">
                <Popover open={isMobilePopoverOpen} onOpenChange={setIsMobilePopoverOpen}>
                    <PopoverTrigger asChild>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#17171B]/5 transition-all duration-200">
                            <Icon icon="solar:menu-dots-bold" width="16" height="16" color="#17171B" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48" align="end">
                        <div className="flex flex-col">
                            <Link
                                to={`/dashboard/edit-product/${item._id}`}
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#17171B]/5 rounded-md transition-all duration-200"
                            >
                                <Icon icon="solar:pen-bold" width="14" height="14" />
                                <span className="text-sm">Edit Product</span>
                            </Link>
                            {!isAuction ? (
                                <>
                                    <button
                                        id={`product-details-${item._id}`}
                                        onClick={() => setOpenProductDetails(true)}
                                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#17171B]/5 rounded-md transition-all duration-200 text-left"
                                    >
                                        <Icon icon="solar:eye-bold" width="14" height="14" />
                                        <span className="text-sm">View Details</span>
                                    </button>
                                    <button
                                        onClick={() => setOpenStockModal(true)}
                                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#17171B]/5 rounded-md transition-all duration-200 text-left"
                                    >
                                        <Icon icon="fluent:box-edit-24-filled" width="14" height="14" />
                                        <span className="text-sm">Update Stock</span>
                                    </button>
                                    <button
                                        id={`upload-blip-${item._id}`}
                                        onClick={() => setOpenBlipUploadModal(true)}
                                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#17171B]/5 rounded-md transition-all duration-200 text-left"
                                    >
                                        <BiPlayCircle width="14" height="14" />
                                        <span className="text-sm">Blip{item?.blips?.length > 0 ? ` (${item?.blips.length})` : ''} </span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        id={`auction-performance-${item._id}`}
                                        onClick={() => setOpenAuctionModal(true)}
                                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#17171B]/5 rounded-md transition-all duration-200 text-left"
                                    >
                                        <Icon icon="solar:graph-bold" width="14" height="14" />
                                        <span className="text-sm">Auction Performance</span>
                                    </button>
                                    {canRerunAuction && (
                                        <button
                                            id={`rerun-auction-${item._id}`}
                                            onClick={() => setShowRerunDialog(true)}
                                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[#17171B]/5 rounded-md transition-all duration-200 text-left"
                                        >
                                            <Icon icon="solar:restart-bold" width="14" height="14" />
                                            <span className="text-sm">Rerun Auction</span>
                                        </button>
                                    )}
                                </>
                            )}
                            <button
                                id={`delete-product-${item._id}`}
                                onClick={() => setShowDeleteDialog(true)}
                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-600 rounded-md transition-all duration-200 text-left"
                                disabled={handleDeleteStatusLoading()}
                            >
                                {
                                    handleDeleteStatusLoading() ? (
                                        <Icon icon="mdi:loader" className="animate-spin" width="14" height="14" />
                                    ) : (
                                        <Icon icon="solar:trash-bin-trash-bold" width="14" height="14" />
                                    )
                                }
                                <span className="text-sm">{handleDeleteStatusLoading() ? 'Deleting...' : 'Delete Product'}</span>
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );

    return (
        <>
            <div className="bg-white">
                {DesktopCard()}
                {MobileCard()}
            </div>
            
            {/* Stock Update Modal */}
            <StockUpdateModal 
                open={openStockModal} 
                onClose={() => setOpenStockModal(false)} 
                item={item}
                onUpdate={handleStockUpdate}
                isSubmitting={isSubmitting}
            />
            
            {/* Product Details Modal */}
            <ProductDetailsModal 
                open={openProductDetails} 
                onClose={() => setOpenProductDetails(false)}
                productId={item._id}
                handleDelete={() => setShowDeleteDialog(true)}
            />
            
            {/* Auction Performance Modal */}
            <AuctionPerformanceModal 
                open={openAuctionModal} 
                onClose={() => setOpenAuctionModal(false)}
                auctionId={item._id}
                setShowRerunDialog={setShowRerunDialog}
            />
            
            {/* Rerun Auction Dialog */}
            <RerunAuctionDialog 
                open={showRerunDialog}
                onClose={() => setShowRerunDialog(false)}
                onSubmit={handleRerunAuction}
                isLoading={isRerunLoading}
                defaultValues={{
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
                    startingBid: item.auction?.startingBid || item.price
                }}
            />
            
            {/* Blip Upload Modal */}
            <BlipUploadModal
                open={openBlipUploadModal}
                onClose={() => setOpenBlipUploadModal(false)}
                productId={item._id}
                product={item}
            />
            
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
                        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                            <img
                                src={item?.images[0]?.url}
                                alt={item?.name}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-contain bg-white"
                            />
                            <div>
                                <h3 className="font-medium text-[#17171B] text-sm sm:text-base line-clamp-2">{item?.name}</h3>
                                <p className="text-xs sm:text-sm text-gray-500">SKU: {item?.sku || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                            <h4 className="font-medium text-yellow-800 mb-2">What happens when you delete this product?</h4>
                            <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                                <li>The product will be permanently removed from your inventory</li>
                                <li>Any active orders containing this product will not be affected</li>
                                <li>Product analytics and historical data will be lost</li>
                                <li>The product will no longer appear in your store</li>
                                {isAuction && (
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
                                onClick={() => {
                                    handleProductDelete(item._id);
                                    setShowDeleteDialog(false);
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
                                disabled={handleDeleteStatusLoading()}
                            >
                                {handleDeleteStatusLoading() ? (
                                    <Icon icon="mdi:loader" className="animate-spin w-4 h-4" />
                                ) : (
                                    <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                                )}
                                <span>{handleDeleteStatusLoading() ? 'Deleting...' : 'Delete Product'}</span>
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

ProductCard.propTypes = {
    item: PropTypes.object.isRequired,
    isAuction: PropTypes.bool,
    canRerunAuction: PropTypes.bool,
    handleRerunClick: PropTypes.func,
    handleStockUpdate: PropTypes.func,
}

export default ProductCard;
