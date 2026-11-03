import PropTypes from 'prop-types';

const CustomerOrdersCard = ({ item }) => {
    return (
        <div className="flex items-center gap-4 py-4">
            <img src={item?.image} alt={item?.name} className="h-12 w-12 xl:h-20 xl:w-20 object-cover" />
            <div className="flex items-center flex-wrap w-full gap-4 justify-between">
                <div className="flex flex-col gap-2">
                    <p className="text-sm xl:text-base font-lexend font-normal text-[#17171B]">{item?.name}</p>
                    <div className="flex items-center flex-wrap gap-2">
                        <p className="text-sm  font-lexend font-normal text-[#17171B]">Color: {item?.color} </p>
                        <p className="text-sm font-bold text-[#17171B]">{item?.price.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} * {item?.quantity} </p>
                    </div>
                    <div className="flex flex-col xl:flex-row xl:gap-2">
                        <p className="text-sm font-lexend font-normal text-[#17171B] max-w-[100px] truncate">{item?.id}</p>
                        <p className="text-sm font-lexend font-normal text-[#17171B]">{item?.isPaid ? 'Paid' : 'Pending'}</p>
                        <p className="text-sm font-lexend font-normal text-[#17171B]">{item?.isDelivered ? 'Delivered' : 'Pending'}</p>
                    </div>
                </div>
                <p className="text-sm xl:text-base font-lexend font-normal text-[#17171B]">Total: {item?.total.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</p>
            </div>
        </div>
    )
};

CustomerOrdersCard.propTypes = {
    item: PropTypes.object.isRequired
};

export default CustomerOrdersCard
