import { Icon } from "@iconify/react";
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import DraftThumbnail from '../assets/young-woman-organizing-live-shop 1.png'

const ActiveLiveStreamCard = ({
    streamerName,
    streamerImage,
    streamTitle,
    thumbnailImage,
    tags = [],
    startTime,
    isLive = false,
    category,
    businessAddress,
    livestream,
    id
}) => {
    const formatDateTime = (isoString) => {
        const date = new Date(isoString);
        
        // Format: "25 Jan, 03:34 AM"
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace(',', ' •').replace(/\s+/g, ' ');
    };

    return (
        <div className="bg-[#000000] p-4 rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {streamerImage ? <img src={streamerImage} alt="thumbnail" className="w-5 xl:w-10 h-5 xl:h-10 rounded-full" /> : <Icon
                        icon="iconamoon:profile-circle-fill"
                        className="w-5 h-5 xl:w-10 xl:h-10 text-white"
                    />}
                    <div className="flex items-center gap-2">
                        <h3 className="text-white text-sm capitalize font-lexendDeca font-semibold">{streamerName}</h3>
                        {/* Live Badge */}
                        {isLive && (
                            <div className="bg-red-500 px-2 py-1 rounded-md flex items-center gap-1">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                <span className="text-xs text-white font-medium">LIVE</span>
                            </div>
                        )}
                    </div>
                </div>
                <Icon
                    icon="material-symbols:verified"
                    className="w-5 xl:w-7 h-5 xl:h-7 text-green-500"
                />
            </div>
            {
                livestream && (
                    <div className="mt-4 flex items-center justify-center aspect-[3/4] w-full">
                        <img src={DraftThumbnail} alt="thumbnail" className="w-[200px] h-[264px] rounded-md object-cover" />
                    </div>
                )
            }
            <div>
                <h3 className="text-white text-sm xl:text-base mt-3 capitalize font-inter font-semibold">{streamTitle}</h3>
                <div className="flex mt-2 flex-wrap gap-2">
                    <span className="text-xs text-[#8492A6] px-2 py-1 bg-[#1F2937] rounded-full">
                        {category}
                    </span>
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="text-xs text-[#8492A6] px-2 py-1 bg-[#1F2937] rounded-full"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
            <p className="text-[#2F2E41] w-fit rounded-md px-2 py-1 bg-[#FFFFFF] capitalize font-inter text-xs mt-2">
                {formatDateTime(startTime)}
            </p>
            <p className="text-[#425466] capitalize font-inter text-xs mt-2">lagos, Nigeria</p>
            <NavLink to={`/dashboard/live-streams/live-stream-studio/${id}`}>
                <button className="w-full py-2 mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Enter Studio
                </button>
            </NavLink>

        </div>
    );
};

ActiveLiveStreamCard.propTypes = {
    streamerName: PropTypes.string.isRequired,
    streamerImage: PropTypes.string.isRequired,
    streamTitle: PropTypes.string.isRequired,
    thumbnailImage: PropTypes.string.isRequired,
    tags: PropTypes.array.isRequired,
    startTime: PropTypes.string.isRequired,
    isLive: PropTypes.bool.isRequired,
    category: PropTypes.string.isRequired,
    businessAddress: PropTypes.object.isRequired
};

export default ActiveLiveStreamCard;
