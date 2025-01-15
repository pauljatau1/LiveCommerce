import PropTypes from 'prop-types';

const QuickOrderCard = ({ product }) => {
    //const orderQuantityDisplay = order.quantity > 1 ? 'orders' : 'order';

    return (
        <div className="w-full cursor-pointer flex justify-between gap-4 items-center  hover:bg-gray-200">
            <div className="w-full px-4 py-3 flex justify-between gap-4 items-center">
                <div className="flex items-center gap-5 xl:gap-10">
                    <img src={product?.images[0].url} alt="order-image" className="w-[70px] md:w-[90px] h-[70px] md:h-[90px] rounded-md xl:rounded-lg " />
                    <div>
                        <p className="text-sm xl:text-base capitalize font-cabin font-normal text-[#05031F]">{product?.name}</p>
                        <p className="text-sm font-cabin font-normal text-[#05031F]">{product?.stats?.soldCount} {product?.stats?.soldCount > 1 ? 'orders' : 'order'} </p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    {/*<p className="text-sm font-cabin font-normal text-[#05031F]">{order.percentage}</p>*/}
                    <p className="text-sm xl:text-base font-cabin font-normal text-[#05031F]">₦{product?.price?.toLocaleString()}</p>
                </div>
            </div>
        </div>
    )
};

QuickOrderCard.propTypes = {
    product: PropTypes.object.isRequired
};

export default QuickOrderCard
