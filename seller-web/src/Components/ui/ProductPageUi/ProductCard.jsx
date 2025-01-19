import { Icon } from '@iconify/react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteProduct } from '../../../Redux/Slices/ProductSlice';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';

const ProductCard = ({ item }) => {
    const dispatch = useDispatch();
    const { isLoading, deleteStatus, deletedProductId } = useSelector(state => state.product);
    const getStockStatus = (stock) => {
        if (stock > 50) return { text: 'In Stock', class: 'bg-[#0BB248]/10 text-[#0BB248]' };
        if (stock > 0) return { text: 'Low Stock', class: 'bg-[#FFA500]/10 text-[#FFA500]' };
        return { text: 'Out of Stock', class: 'bg-[#DF0707]/10 text-[#DF0707]' };
    };

    const status = getStockStatus(item?.stock);
    console.log(item.stock);

    const handleProductDelete = (productId) => {
        dispatch(deleteProduct(productId));
    };

    const SpecificDeletedProduct = item._id === deletedProductId;
    console.log('attempted deleted product', deletedProductId)
    console.log('specific deleted product', SpecificDeletedProduct)

    // Mobile Card Layout
    const MobileCard = () => (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-start gap-4">
                <img
                    src={item?.images[0]?.url}
                    alt={item?.name}
                    className="w-[60px] h-[60px] rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-[#05031F] truncate">
                        {item?.name}
                    </h3>
                    <p className="text-xs text-[#05031F]/60">
                        {item?.category}
                    </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${status.class}`}>
                    {status.text}
                </span>
            </div>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#05031F]">
                    ₦ {item?.price?.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-[#05031F]/5 transition-all duration-200">
                        <Icon icon="solar:pen-bold" className="w-4 h-4 text-[#05031F]" />
                    </button>
                    <button onClick={() => handleProductDelete(item._id)} className="p-2 rounded-lg hover:bg-[#DF0707]/5 transition-all duration-200">
                        {deleteStatus ? <CircularProgress color="#DF0707" size={20} /> : <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4 text-[#DF0707]" />}
                    </button>
                </div>
            </div>
        </div>
    );

    // Desktop Card Layout
    const DesktopCard = () => (
        <div className="hidden lg:grid grid-cols-[80px_2fr_1fr_1fr_100px_100px] gap-4 px-6 py-4 items-center hover:bg-[#F7F7F7] transition-all duration-200">
            <div className="w-12 h-12">
                <img
                    src={item?.images[0]?.url}
                    alt={item?.name}
                    className="w-full h-full rounded-lg object-cover"
                />
            </div>
            <div className="truncate pr-4">
                <p className="text-sm font-medium text-[#05031F] truncate">{item?.name}</p>
            </div>
            <div className="truncate">
                <p className="text-sm text-[#05031F] truncate">{item?.category}</p>
            </div>
            <div>
                <p className="text-sm text-[#05031F]">₦ {item?.price?.toLocaleString()}</p>
            </div>
            <div className="flex justify-center">
                <span className={`px-3 py-1 rounded-full text-xs ${status.class}`}>
                    {status.text}
                </span>
            </div>
            <div className="flex items-center justify-center gap-2">
                <button className="p-2 rounded-lg hover:bg-[#05031F]/5 transition-all duration-200">
                    <Icon icon="solar:pen-bold" className="w-4 h-4 text-[#05031F]" />
                </button>
                <button onClick={() => handleProductDelete(item._id)} className="p-2 rounded-lg hover:bg-[#DF0707]/5 transition-all duration-200">
                    {
                        SpecificDeletedProduct ? (
                            deleteStatus ? <CircularProgress color="#DF0707" size={13} /> : <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4 text-[#DF0707]" />
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
        </>
    );
};

ProductCard.propTypes = {
    item: PropTypes.object.isRequired,
};

export default ProductCard;
