import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from "@iconify/react";

const SuggestedVideoCard = ({ video }) => {
  return (
    <a href={video.link} target="_blank" rel="noopener noreferrer" className="relative">
      <div className="relative">
        <Icon icon="logos:youtube-icon" className="w-[78.5px] lg:w-[107px] h-[62.5px] lg:h-[125px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10" />
        <img src={video.thumbnail} alt={video.title} className="w-[185.5px] lg:w-[371px] h-[124.5px] lg:h-[249px] rounded-[10px] object-cover" />
      </div>
      <p className="text-sm lg:text-base mt-3 lg:mt-5 font-lexend font-bold w-[185.5px] lg:w-[371px] text-[#05031F]">{video.title}</p>
    </a>
  )
};

SuggestedVideoCard.propTypes = {
  video: PropTypes.object.isRequired,
};

export default SuggestedVideoCard
