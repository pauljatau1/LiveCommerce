import PropTypes from 'prop-types';

const HomeAnalyticsCard = ({ card }) => {
    const Icon = card.icon;

    return (
        <div className={`bg-white rounded-xl p-4 h-[140px] w-full border border-gray-200 hover:cursor-pointer hover:shadow-md shadow-sm transition-all duration-300 ease-in-out`}>
            <h4 className="text-xs md:text-sm font-medium font-inter text-[#718096]">{card.title}</h4>
            <div className="flex items-center justify-between gap-2">
                <p className="text-2xl font-semibold font-inter text-[#16192C] mt-3">{card.current}</p>
                <div className={`p-4 rounded-full ${card.iconBackground}`}>
                    <Icon size={18} className={card.iconColor} />
                </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
                <span className={`text-xs xl:text-sm rounded-md font-inter px-2 py-1 font-medium ${card.trend === 'up' ? 'text-[#66CB9F] bg-[#DEFFEE] ' : 'text-[#F16063] bg-[#FFE6E4] '}`}>
                    {card.percentage}
                </span>
                <span className="text-xs xl:text-sm font-inter text-[#718096]">vs last week</span>
            </div>
        </div>
    )
};

HomeAnalyticsCard.propTypes = {
    card: PropTypes.object.isRequired
};

export default HomeAnalyticsCard
