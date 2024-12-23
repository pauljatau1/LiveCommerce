import React from 'react';
import PropTypes from 'prop-types';

const SuggestedVideoCard = ({video}) => {
  return (
    <a href={video.link} target="_blank" rel="noopener noreferrer">
      <img src={video.thumbnail} alt={video.title} className="w-[185.5px] lg:w-[371px] h-[124.5px] lg:h-[249px] rounded-[10px] object-cover" />
      <p className="text-sm lg:text-base mt-3 lg:mt-5 font-lexend font-bold w-[185.5px] lg:w-[371px] text-[#05031F]">{video.title}</p>
    </a>
  )
};

SuggestedVideoCard.propTypes = {
  video: PropTypes.object.isRequired,
};

export default SuggestedVideoCard
