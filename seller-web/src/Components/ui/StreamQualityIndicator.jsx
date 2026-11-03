import PropTypes from 'prop-types';
import { Icon } from '@iconify/react';
import Draggable from 'react-draggable';
import { useState, useRef } from 'react';

const StreamQualityIndicator = ({ qualityInfo, className = '', onClose }) => {
  // Add state for tracking drag state
  const [activeDrags, setActiveDrags] = useState(0);
  
  // Create a ref for the draggable component
  const nodeRef = useRef(null);
  
  // Early return if no qualityInfo
  if (!qualityInfo) return null;
  
  // Drag event handlers - simplified to match demo exactly
  const onStart = () => {
    setActiveDrags(prevActiveDrags => prevActiveDrags + 1);
  };
  
  const onStop = () => {
    setActiveDrags(prevActiveDrags => prevActiveDrags - 1);
  };
  
  // Create a dragHandlers object to spread into the Draggable component
  const dragHandlers = { onStart, onStop };
  
  // Determine quality level badge color
  const getQualityColor = (preset) => {
    switch (preset) {
      case '240p': return 'bg-gray-500';
      case '360p': return 'bg-blue-500';
      case '480p': return 'bg-green-500';
      case '720p': return 'bg-purple-500';
      case '1080p': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };
  
  // Get appropriate icon based on quality
  const getQualityIcon = (preset) => {
    switch (preset) {
      case '240p': return 'heroicons:signal-slash';
      case '360p': return 'heroicons:signal';
      case '480p': return 'heroicons:signal';
      case '720p': return 'heroicons:signal';
      case '1080p': return 'heroicons:sparkles';
      default: return 'heroicons:signal';
    }
  };
  
  return (
    <Draggable
      nodeRef={nodeRef}
      handle="strong"
      defaultPosition={{x: 20, y: 20}}
      bounds="body"
      scale={1}
      {...dragHandlers}
    >
      <div 
        ref={nodeRef}
        className={`bg-[#0D0F12]/90 backdrop-blur-sm border border-[#272A31] rounded-lg shadow-lg ${className} absolute z-50 no-cursor`}
      >
        {/* Simple drag handle that exactly matches the demo */}
        <strong className="cursor">
          <div className="flex items-center justify-center h-7 border-b border-[#272A31]/50 hover:bg-[#272A31]/30 transition-colors rounded-t-lg">
            <div className="w-10 h-1 bg-[#7A828A]/50 rounded-full"></div>
          </div>
        </strong>
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-1.5 right-2 text-[#7A828A] hover:text-[#EFF0FA] transition-colors rounded-full w-5 h-5 flex items-center justify-center hover:bg-[#272A31]/50"
          >
            <Icon icon="heroicons:x-mark" className="w-4 h-4" />
          </button>
        )}
        
        {/* Content */}
        <div className="p-3 mr-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getQualityColor(qualityInfo.preset)}`}></div>
            <span className="text-[#EFF0FA] font-medium text-sm">Stream Quality</span>
          </div>
          
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <Icon icon="heroicons:rectangle-stack" className="w-4 h-4 text-[#7A828A]" />
              <span className="text-[#EFF0FA] text-xs">{qualityInfo.resolution}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Icon icon="heroicons:clock" className="w-4 h-4 text-[#7A828A]" />
              <span className="text-[#EFF0FA] text-xs">{qualityInfo.frameRate}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Icon icon="heroicons:arrow-path" className="w-4 h-4 text-[#7A828A]" />
              <span className="text-[#EFF0FA] text-xs">{qualityInfo.bitrate}</span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
            <div className={`px-2 py-1 rounded text-xs text-white ${getQualityColor(qualityInfo.preset)}`}>
              <div className="flex items-center gap-1">
                <Icon icon={getQualityIcon(qualityInfo.preset)} className="w-3 h-3" />
                <span>{qualityInfo.preset || 'Custom'}</span>
              </div>
            </div>
            
            {qualityInfo.dataUsage && (
              <div className="text-xs text-[#7A828A]">
                ~{qualityInfo.dataUsage}/hr
              </div>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
};

StreamQualityIndicator.propTypes = {
  qualityInfo: PropTypes.shape({
    resolution: PropTypes.string,
    frameRate: PropTypes.string,
    bitrate: PropTypes.string,
    preset: PropTypes.string,
    dataUsage: PropTypes.string
  }),
  className: PropTypes.string,
  onClose: PropTypes.func
};

export default StreamQualityIndicator; 