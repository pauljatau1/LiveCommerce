import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

// Add this helper function for currency formatting
function formatMetricValue(value) {
    if (!value) return "0";
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toString();
  }

function formatChangeFromLastWeek (value, type) {
    if (type == 'number') {
      return `+₦${formatMetricValue(value)}`;
    } else if (type == 'percentage') {
      return `${value}%`;
    } else {
      return "";
    }
  };

const HomeAnalyticsCard = ({ card }) => {
    const Icon = card.icon;
    const navigate = useNavigate();
    const [isPressed, setIsPressed] = useState(false);

    const trend = card.value >= 0 ? 'up' : 'down';
    const percentage = formatChangeFromLastWeek(card.value, card.type);

    return (
        <div 
            onClick={() => navigate(card.link)}
            onTouchStart={() => setIsPressed(true)}
            onTouchEnd={() => setIsPressed(false)}
            className={`bg-white rounded-xl p-4 sm:h-full w-full border border-gray-200 
            ${isPressed ? 'bg-gray-50 scale-98' : 'hover:shadow-md'} 
            shadow-sm transition-all duration-150 ease-in-out relative overflow-hidden`}
        >
            {/* Mobile header with icon */}
            <div className="flex sm:hidden items-center justify-between mb-2">
                <div className={`p-3 rounded-full ${card.iconBackground}`}>
                    <Icon size={16} className={card.iconColor} />
                </div>
                <ChevronRight size={16} className="text-gray-400" />
            </div>

            <h4 className="text-xs md:text-sm font-medium font-inter text-[#718096]">{card.title}</h4>
            
            {/* Desktop layout */}
            <div className="hidden sm:flex items-center justify-between gap-2">
                <p className="text-2xl font-semibold font-inter text-[#16192C] mt-3">{card.current}</p>
                <div className={`p-4 rounded-full ${card.iconBackground}`}>
                    <Icon size={18} className={card.iconColor} />
                </div>
            </div>
            
            {/* Mobile value display */}
            <p className="sm:hidden text-xl font-semibold font-inter text-[#16192C] mt-1">{card.current}</p>
            
            <div className="flex flex-wrap items-center whitespace-nowrap gap-1 mt-2">
                <span className={`text-xs xl:text-sm rounded-md font-inter px-2 py-1 font-medium ${trend === 'up' ? 'text-[#66CB9F] bg-[#DEFFEE] ' : 'text-[#F16063] bg-[#FFE6E4] '}`}>
                    {percentage}
                </span>
                <span className="text-xs xl:text-sm font-inter text-[#718096]">vs last week</span>
            </div>
            
            {/* Mobile action hint */}
            <div className="sm:hidden mt-3 text-[10px] text-gray-400 flex items-center justify-end">
                <span>Tap to view details</span>
            </div>

            {/* Background decoration for visual interest */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-5 ${trend === 'up' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>
    )
};

HomeAnalyticsCard.propTypes = {
    card: PropTypes.shape({
        title: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
        current: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        iconColor: PropTypes.string.isRequired,
        iconBackground: PropTypes.string.isRequired,
        link: PropTypes.string.isRequired
    }).isRequired
};

export default HomeAnalyticsCard
