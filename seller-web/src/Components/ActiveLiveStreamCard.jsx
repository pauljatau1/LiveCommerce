import { Icon } from "@iconify/react";
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import DraftThumbnail from '../assets/young-woman-organizing-live-shop 1.png'
import { useState, useRef } from 'react';

const ActiveLiveStreamCard = ({
    streamerName,
    streamerImage,
    streamTitle,
    thumbnailImage,
    blip,
    tags = [],
    startTime,
    isLiveStatus,
    category,
    id
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef(null);

    const handleVideoPlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Handle video end event
    const handleVideoEnded = () => {
        setIsPlaying(false);
    };

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

    const displayLiveStatusCard = () => {
        if (isLiveStatus === 'scheduled') {
            return (
                <div className="bg-green-500 px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span className="text-xs text-white font-medium">Scheduled</span>
                </div>
            )
        } else if (isLiveStatus === 'live') {
            return (
                <div className="bg-red-500 px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span className="text-xs text-white font-medium">LIVE</span>
                </div>
            )
        } else if (isLiveStatus === 'ended') {
            return (
                <div className="bg-gray-500 px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="text-xs text-white font-medium">Ended</span>
                </div>
            )
        } else if (isLiveStatus === 'expired') {
            return (
                <div className="bg-gray-500 px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="text-xs text-white font-medium">Expired</span>
                </div>
            )
        } else if (isLiveStatus === 'cancelled') {
            return (
                <div className="bg-red-500 px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="text-xs text-white font-medium">Cancelled</span>
                </div>
            )
        }
    }

    return (
        <div className="bg-[#000000] p-4 rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {streamerImage ? <img src={streamerImage} alt="thumbnail" className="w-5 xl:w-10 h-5 xl:h-10 rounded-full" /> : <Icon
                        icon="iconamoon:profile-circle-fill"
                        className="w-5 h-5 xl:w-10 xl:h-10 text-white"
                    />}
                    <div className="flex items-center gap-2">
                        <h3 className="text-white text-sm capitalize truncate font-lexendDeca font-semibold">{streamerName}</h3>
                        {/* Live Badge */}

                        {displayLiveStatusCard()}
                    </div>
                </div>
                <Icon
                    icon="material-symbols:verified"
                    className="w-5 xl:w-7 h-5 xl:h-7 text-green-500"
                />
            </div>

            <div className="mt-4 flex items-center justify-center aspect-[3/4] w-full">
                {blip ? (
                    <div className="relative w-[200px] h-[264px] rounded-md overflow-hidden bg-black group">
                        <video 
                            ref={videoRef}
                            src={blip.url}
                            className="w-full h-full object-cover"
                            playsInline
                            onEnded={handleVideoEnded}
                        />
                        {!isPlaying && (
                            <div 
                                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                                onClick={handleVideoPlayPause}
                            >
                                <div className="bg-black/40 w-full h-full absolute" />
                                <div className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-3 transform transition-transform hover:scale-110">
                                    <Icon 
                                        icon="ph:play-fill" 
                                        className="w-8 h-8 text-white" 
                                    />
                                </div>
                            </div>
                        )}
                        {isPlaying && (
                            <div 
                                className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                                onClick={handleVideoPlayPause}
                            >
                                <div className="bg-black/30 w-full h-full absolute" />
                                <div className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-3 transform transition-transform hover:scale-110">
                                    <Icon 
                                        icon="ph:pause-fill" 
                                        className="w-8 h-8 text-white" 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : thumbnailImage ? (
                    <img 
                        src={thumbnailImage.url} 
                        alt="thumbnail" 
                        className="w-[200px] h-[264px] rounded-md object-cover" 
                    />
                ) : (
                    <img 
                        src={DraftThumbnail} 
                        alt="thumbnail" 
                        className="w-[200px] h-[264px] rounded-md object-cover" 
                    />
                )}
            </div>

            <div>
                <h3 className="text-white text-sm xl:text-base mt-3 truncate capitalize font-inter font-semibold">{streamTitle}</h3>
                <div className="flex mt-2 gap-2">
                    <span className="text-xs text-[#8492A6] truncate px-2 py-1 bg-[#1F2937] rounded-full">
                        {category}
                    </span>
                    {tags.slice(0, 1).map((tag, index) => (
                        <span
                            key={index}
                            className="text-xs text-[#8492A6] truncate px-2 py-1 bg-[#1F2937] rounded-full"
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
                <button disabled={isLiveStatus === 'ended' || isLiveStatus === 'expired' || isLiveStatus === 'cancelled'} className={`w-full py-2 mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors ${isLiveStatus === 'ended' || isLiveStatus === 'expired' || isLiveStatus === 'cancelled' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    Enter Studio
                </button>
            </NavLink>
        </div>
    );
};

ActiveLiveStreamCard.propTypes = {
    streamerName: PropTypes.string.isRequired,
    streamerImage: PropTypes.string,
    streamTitle: PropTypes.string.isRequired,
    thumbnailImage: PropTypes.string,
    blip: PropTypes.shape({
        url: PropTypes.string
    }),
    tags: PropTypes.array,
    startTime: PropTypes.string.isRequired,
    isLiveStatus: PropTypes.string,
    category: PropTypes.string.isRequired,
    id: PropTypes.string
};

export default ActiveLiveStreamCard;
