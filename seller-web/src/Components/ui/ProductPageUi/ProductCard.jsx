import { Icon } from '@iconify/react';
import PropTypes from 'prop-types';

const ProductCard = ({ item }) => {
    return (
        <div className='w-[176px] lg:w-fit border border-[#00000029] rounded-lg overflow-hidden'>
            <img src={item.image} alt="product" className='w-full lg:w-[272px]  object-cover' />
            <div className="py-2 lg:py-3 px-2 lg:px-4">
                <p className='text-sm lg:text-base font-lexend font-bold text-[#05031F] max-w-[156px] mb-2 lg:mb-0 lg:max-w-[232px]'>{item.name}</p>
                <div className='flex flex-col lg:flex-row lg:items-center lg:gap-6'>
                    <p className='text-sm font-cabin font-normal text-[#05031F]'>SKU: {item.skuTag}</p>
                    <div className='flex items-center gap-1 mt-1 lg:mt-0'>
                        <Icon icon="fluent:box-checkmark-20-filled" width="18" height="18" color={item.stock > 5 ? "#0BB248" : "#FF0000"} />
                        <p className={`text-sm font-cabin font-normal ${item.stock > 5 ? "text-[#0BB248]" : "text-[#FF0000]"}`}>{item.stock} in stock</p>
                    </div>
                </div>
                <p className='text-base lg:text-lg font-cabin font-bold text-[#05031F] mt-1 lg:mt-3 '>${item.price.toLocaleString()}</p>
                <button className='w-full border border-[#05031F] bg-transparent rounded-full text-[#05031F] text-sm font-cabin font-bold py-2 mt-2 lg:mt-3 hover:bg-[#05031F] hover:text-white transition-all duration-500 ease-in-out'>View Product</button>
            </div>
        </div>
    )
};

ProductCard.propTypes = {
    item: PropTypes.object.isRequired,
};

export default ProductCard
