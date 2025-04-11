import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Icon } from "@iconify/react";
import { Modal, Box, TextField, CircularProgress } from '@mui/material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { BASE_URL } from '../../../Constants/Server';

// StockUpdateModal component for updating product stock
const StockUpdateModal = React.memo(({ open, onClose, item, onUpdate, isSubmitting, setIsStockUpdated }) => {
    const [stockChange, setStockChange] = useState(0);
    const [operation, setOperation] = useState('add'); // 'add' or 'subtract'
    const [localIsSubmitting, setLocalIsSubmitting] = useState(false);
    
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

    // If onUpdate is provided as a prop, use it; otherwise use the local implementation
    const handleSubmit = async () => {
        if (stockChange <= 0) {
            toast.error("Please enter a valid quantity");
            return;
        }
        
        if (onUpdate) {
            // Use the provided onUpdate function
            await onUpdate(stockChange, operation);
        } else {
            // Default implementation if no onUpdate is provided - exactly matching ProductCard.jsx
            try {
                setLocalIsSubmitting(true);
                const sellerToken = localStorage.getItem('sellerToken');
                const tokenData = sellerToken ? JSON.parse(sellerToken) : { data: null, isVerified: null };
                
                // Exactly matching the implementation in ProductCard.jsx
                const response = await axios.put(`${BASE_URL}/products/${item._id}/inventory`, {
                    quantity: stockChange,
                    operation: operation // "add" or "subtract"
                }, {
                    headers: {
                        Authorization: `Bearer ${tokenData.data}`
                    }
                });
                
                if (response.status === 200) {
                    onClose();
                    // Update stock information if setIsStockUpdated is provided
                    if (setIsStockUpdated) {
                        setIsStockUpdated(prev => !prev);
                    }
                    toast.success(`Stock ${operation === 'add' ? 'increased' : 'decreased'} successfully`);
                }
            } catch (error) {
                console.error("Stock update error:", error);
                toast.error("Failed to update stock", {
                    description: error.response?.data?.message || "Please try again"
                });
            } finally {
                setLocalIsSubmitting(false);
            }
        }
    };

    // Determine whether to use local or prop-based submission state
    const effectiveIsSubmitting = isSubmitting || localIsSubmitting;

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
                                className="border border-[#05031F] flex-1 text-[#05031F] px-2 py-1 h-14 rounded-md"
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
                                disabled={effectiveIsSubmitting || stockChange <= 0}
                            >
                                {effectiveIsSubmitting ? (
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
    onUpdate: PropTypes.func,
    isSubmitting: PropTypes.bool,
    setIsStockUpdated: PropTypes.func
};

StockUpdateModal.defaultProps = {
    isSubmitting: false
};

export default StockUpdateModal; 