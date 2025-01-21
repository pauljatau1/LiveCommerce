import PropTypes from 'prop-types';

const HomeAnalyticsCard = ({ card }) => {
    const Icon = card.icon;
    
    return (
        <div className={`bg-white rounded-xl p-4 h-[140px] w-full border border-gray-200 hover:cursor-pointer hover:shadow-md shadow-sm transition-all duration-300 ease-in-out`}>
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${card.iconBackground}`}>
                    <Icon size={18} className={card.iconColor} />
                </div>
                <h4 className="text-sm font-medium text-gray-600">{card.title}</h4>
            </div>
            <p className="text-2xl font-semibold text-gray-900 mt-3">{card.current}</p>
            <div className="flex items-center gap-1 mt-2">
                <span className={`text-sm font-medium ${card.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {card.percentage}
                </span>
                <span className="text-sm text-gray-500">vs last week</span>
            </div>
        </div>
    )
};

HomeAnalyticsCard.propTypes = {
    card: PropTypes.object.isRequired
};

export default HomeAnalyticsCard
