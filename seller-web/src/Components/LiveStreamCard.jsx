import { liveStreamCardData } from "../Utilities/data";
import ComingSoonTag from './ComingSoonTag';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

const LiveStreamCard = ({ item }) => {
    return (
        <div className="w-full xl:w-[404px] h-[159.5px] md:h-[239px] relative bg-[#05031F] rounded-lg py-3 px-4 md:py-6 md:px-7 space-y-3 md:space-y-6">
            <div className="absolute top-2 right-0">
                {
                    !item?.available && (
                        <ComingSoonTag />
                    )
                }
            </div>
            <div className="flex items-center gap-2">
                <img src={item?.icon} alt={item?.title} className="w-8 h-8 " />
                <h1 className="text-white text-sm md:text-lg xl:text-xl font-medium font-lexend">{item?.title}</h1>
            </div>
            <p className="text-white text-xs font-normal md:text-base font-cabin max-w-[500px] xl:max-w-none line-clamp-2">{item?.description}</p>
            <div className="flex items-center justify-center gap-2">
                <NavLink className="w-full flex items-center justify-center text-[#FFFFFF] text-xs md:text-base font-bold capitalize bg-[#0BB248] font-cabin rounded-lg px-6 py-2 hover:bg-[#0BB248]/80 transition-all duration-300 ease-in-out">{`Start ${item?.title}`}</NavLink>
            </div>
        </div>
    )
}

LiveStreamCard.propTypes = {
    item: PropTypes.object.isRequired
};

export default LiveStreamCard;