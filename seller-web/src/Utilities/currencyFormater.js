// Add this helper function for currency formatting
export const formatCurrency = (value) => {
    if (!value && value !== 0) return '₦0';
    if (value >= 1000000000) return `₦${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `₦${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `₦${(value / 1000).toFixed(2)}K`;
  
    return `₦${value.toFixed(2)}`;
  };
  