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

const ProductCard = ({ item, setIsStockUpdated, isAuction = false }) => {
    // Separate states for mobile and desktop popovers
    const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false);
    const [isDesktopPopoverOpen, setIsDesktopPopoverOpen] = useState(false);
    const [openStockModal, setOpenStockModal] = useState(false);
    const dispatch = useDispatch();
    const { isLoading, deleteStatus, deletedProductId } = useSelector(state => state.product);
    const [isSubmitting, setIsSubmitting] = useState(false);



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
        return { text: 'Unknown', class: 'bg-gray-100 text-gray-500' };
    };

    const getAuctionStatus = (auction) => {
        if (!auction) return { text: 'N/A', class: 'bg-gray-100 text-gray-500' };
        if (auction.status === 'ended') return { text: 'Ended', class: 'bg-[#DF0707]/10 text-[#DF0707]' };
        if (auction.status === 'active') return { text: 'Active', class: 'bg-[#0BB248]/10 text-[#0BB248]' };
        if (new Date(auction.startDate) > new Date()) return { text: 'Scheduled', class: 'bg-[#FFA500]/10 text-[#FFA500]' };
        return { text: 'Unknown', class: 'bg-gray-100 text-gray-500' };
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
                        <h3 className="font-medium text-[#05031F] line-clamp-2">{item?.name}</h3>
                        <p className="text-sm text-gray-500">{item?.category}</p>
                        {isAuction ? (
                            <>
                                <p className="text-sm font-medium text-[#05031F]">
                                    Current Bid: {formatCurrency(item.auction?.currentHighestBid?.amount || 0)}
                                </p>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${status.class}`}>
                                    {status.text}
                                </div>
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
                <div className="grid grid-cols-[40px_40px] items-center gap-2 h-[40px]">
                    <Popover open={isMobilePopoverOpen} onOpenChange={setIsMobilePopoverOpen}>
                        <PopoverTrigger asChild>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#05031F]/5 transition-all duration-200">
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
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <button 
                        onClick={() => handleProductDelete(item._id)} 
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#DF0707]/5 transition-all duration-200"
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

    // Desktop Card Layout
    const DesktopCard = () => (
        <div className="hidden lg:grid grid-cols-[80px_1fr_1fr_1fr_1fr_100px_100px] gap-4 px-6 py-4 items-center">
            <img
                src={item?.images[0]?.url}
                alt={item?.name}
                className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
                <h3 className="font-medium text-[#05031F] line-clamp-2">{item?.name}</h3>
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
            <div className="grid grid-cols-[40px_40px] items-center gap-2 h-[40px]">
                <Popover open={isDesktopPopoverOpen} onOpenChange={setIsDesktopPopoverOpen}>
                    <PopoverTrigger asChild>
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#05031F]/5 transition-all duration-200">
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
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <button 
                    onClick={() => handleProductDelete(item._id)} 
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#DF0707]/5 transition-all duration-200"
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

    return (
        <>
            <div className="lg:hidden border-b border-[#E5E7EB] bg-white">
                <MobileCard />
            </div>
            <DesktopCard />
            <StockUpdateModal
                open={openStockModal}
                onClose={() => setOpenStockModal(false)}
                item={item}
                onUpdate={handleStockUpdate}
                isSubmitting={isSubmitting}
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
