import { Icon } from "@iconify/react";
import PropTypes from 'prop-types';


const HomeAnalyticsCard = ({ card }) => {
    return (
        <div className=" bg-[#05031F] rounded-3xl py-7 px-5 w-full md:w-[237px] h-[165px] hover:cursor-pointer hover:bg-[#05031F]/90 transition-all duration-300 ease-in-out">
            <div className="flex items-center gap-2">
                <Icon icon={card.icon} width="24" height="24" color="#FFFFFF" />
                <h4 className="text-lg font-lexend font-bold text-white">{card.title}</h4>
            </div>
            <p className="text-2xl font-lexend font-bold text-white mt-2">{card.current}</p>
            <p className="text-lg font-lexend font-normal text-[#0BB248] mt-4">{card.percentage} vs last week</p>
        </div>
    )
};

HomeAnalyticsCard.propTypes = {
    card: PropTypes.object.isRequired
};

export default HomeAnalyticsCard
