import React from 'react';
import PropTypes from 'prop-types';

const QuickOrderCard = ({ order }) => {
    const orderQuantityDisplay = order.quantity > 1 ? 'orders' : 'order';

    return (
        <div className="w-full flex justify-between gap-4 items-center">
            <div className="flex items-center gap-2">
                <img src={order.image} alt="order-image" className="w-[70px] md:w-[100px] h-[70px] md:h-[100px]" />
                <div>
                    <p className="text-sm font-cabin font-normal text-[#05031F]">{order.name}</p>
                    <p className="text-sm font-cabin font-normal text-[#05031F]">{order.quantity} {orderQuantityDisplay}</p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <p className="text-sm font-cabin font-normal text-[#05031F]">{order.percentage}</p>
                <p className="text-sm font-cabin font-normal text-[#05031F]">₦{order.price.toLocaleString()}</p>
            </div>
        </div>
    )
};

QuickOrderCard.propTypes = {
    order: PropTypes.object.isRequired
};

export default QuickOrderCard
