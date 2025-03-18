import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const HomeAnalyticsCard = ({ card }) => {
    const Icon = card.icon;
    const navigate = useNavigate();

    return (
        <div 
            onClick={() => navigate(card.link)} 
            className={`bg-white rounded-xl p-4 h-[140px] w-full border border-gray-200 hover:cursor-pointer hover:shadow-md shadow-sm transition-all duration-300 ease-in-out`}
        >
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
    card: PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
        current: PropTypes.string.isRequired,
        percentage: PropTypes.string.isRequired,
        trend: PropTypes.oneOf(['up', 'down']).isRequired,
        iconColor: PropTypes.string.isRequired,
        iconBackground: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired
    }).isRequired
};

export default HomeAnalyticsCard
