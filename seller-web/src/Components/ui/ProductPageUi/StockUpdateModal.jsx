import { Icon } from "@iconify/react";
import { useNotification } from '@/Hooks/useNotification';
import NotificationBanner from '@/Components/ui/NotificationBanner';
import { BASE_URL } from '../../../Constants/Server';
import { useAuthContext } from '@/Hooks/useAuthContextV2';
import { Modal, Box, TextField, CircularProgress } from '@mui/material';
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

// StockUpdateModal component for updating product stock
const StockUpdateModal = React.memo(({ open, onClose, item, onUpdate, isSubmitting, setIsStockUpdated }) => {
    const { token } = useAuthContext();
    const { showNotification, notification, hideNotification } = useNotification();
    const [stockChange, setStockChange] = useState(0); // Integer value for calculations
    const [stockInputValue, setStockInputValue] = useState(''); // String value for TextField input
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
        // Allow empty string for clearing the field
        setStockInputValue(value);
        
        // Parse to integer, defaulting to 0 if empty or invalid
        const numValue = value === '' ? 0 : parseInt(value, 10);
        // Ensure non-negative integer
        const validNum = isNaN(numValue) ? 0 : Math.max(0, numValue);
        setStockChange(validNum);
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
            showNotification("Please enter a valid quantity", 'error', 'dismissible');
            return;
        }

        if (onUpdate) {
            // Use the provided onUpdate function
            await onUpdate(stockChange, operation);
        } else {
            // Default implementation if no onUpdate is provided - exactly matching ProductCard.jsx
            try {
                setLocalIsSubmitting(true);
                const sellerToken = token?.data;

                // Exactly matching the implementation in ProductCard.jsx
                const response = await axios.put(`${BASE_URL}/products/${item._id}/inventory`, {
                    quantity: stockChange,
                    operation: operation // "add" or "subtract"
                }, {
                    headers: {
                        Authorization: `Bearer ${sellerToken}`
                    }
                });

                if (response.status === 200) {
                    onClose();
                    // Update stock information if setIsStockUpdated is provided
                    if (setIsStockUpdated) {
                        setIsStockUpdated(prev => !prev);
                    }
                    showNotification(`Stock ${operation === 'add' ? 'increased' : 'decreased'} successfully`, 'information', 'dismissible');
                }
            } catch (error) {
                console.error("Stock update error:", error);
                showNotification(`Failed to update stock: ${error.response?.data?.message || "Please try again"}`, 'error', 'dismissible');
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
                {notification.isVisible && notification.type && (
                    <NotificationBanner
                        message={notification.message}
                        type={notification.type}
                        visibility={notification.visibility}
                        onClose={hideNotification}
                    />
                )}
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
                                        className={`flex-1 py-3 px-4 rounded-lg font-medium text-center ${operation === 'add'
                                                ? 'bg-[#0BB248]/10 text-[#0BB248] border-2 border-[#0BB248]'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        Add Stock
                                    </button>
                                    <button
                                        onClick={handleStockDecreaseButton}
                                        className={`flex-1 py-3 px-4 rounded-lg font-medium text-center ${operation === 'subtract'
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
                                        value={stockInputValue}
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
                                            onClick={() => {
                                                const newValue = stockChange + 1;
                                                setStockChange(newValue);
                                                setStockInputValue(newValue.toString());
                                            }}
                                            className={`h-14 w-14 rounded-md flex items-center justify-center ${operation === 'add'
                                                    ? 'bg-[#0BB248] text-white'
                                                    : 'bg-[#DF0707] text-white'
                                                }`}
                                        >
                                            <Icon icon="solar:add-circle-bold" className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const newValue = Math.max(0, stockChange - 1);
                                                setStockChange(newValue);
                                                setStockInputValue(newValue.toString());
                                            }}
                                            className={`h-14 w-14 rounded-md flex items-center justify-center ${operation === 'add'
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
                                className={`flex-1 text-white px-2 py-1 h-14 rounded-md transition-all duration-200 ${operation === 'add'
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