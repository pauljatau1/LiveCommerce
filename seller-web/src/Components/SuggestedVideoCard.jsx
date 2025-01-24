import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from "@iconify/react";

const SuggestedVideoCard = ({ video }) => {
  return (
    <a href={video.link} target="_blank" rel="noopener noreferrer" className="flex-none group">
      <div className="relative w-[300px]">
        <div className="relative overflow-hidden rounded-lg">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300" 
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Icon 
              icon="logos:youtube-icon" 
              className="w-12 h-12" 
            />
          </div>
        </div>
        <h3 className="mt-3 text-sm font-medium text-gray-900 line-clamp-2">
          {video.title}
        </h3>
      </div>
    </a>
  )
};

SuggestedVideoCard.propTypes = {
  video: PropTypes.object.isRequired,
};

export default SuggestedVideoCard
