import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import ComingSoonTag from './ComingSoonTag';

const LiveStreamCard = ({ item }) => {
    return (
        <div className="bg-white relative pt-6 px-6 pb-20 xl:pb-20 shadow-sm border rounded-lg border-gray-200 hover:shadow-md transition-all duration-300">
            {!item?.available && <ComingSoonTag topPosition="top-3" rightPosition="right-3" />}
            <div className="flex flex-col items-center justify-center gap-4">

                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg">
                        <img src={item?.icon} alt={item?.title} className=" w-[104px] " />
                    </div>
                    <h2 className="text-lg font-inter font-semibold border-b border-gray-200 py-4 text-[#05031F]">{item?.title}</h2>
                </div>

                <div>
                    <p className="text-sm text-[#425466] text-center py-2 line-clamp">
                        {item?.description}
                    </p>
                </div>

                <NavLink
                    to={item?.link}
                    className={`w-fit absolute bottom-6 bg-[#16783A] text-white text-[13px] font-medium font-inter py-2.5 px-4 rounded-lg hover:bg-[#16783A]/90 transition-all duration-300 text-center ${!item?.available ? 'cursor-not-allowed' : ''}`}
                >
                    <button className={`${!item?.available ? 'cursor-not-allowed' : ''}`} disabled={!item?.available} >
                        Start {item?.title}
                    </button>
                </NavLink>
            </div>
        </div>
    )
}

LiveStreamCard.propTypes = {
    item: PropTypes.object.isRequired
};

export default LiveStreamCard;