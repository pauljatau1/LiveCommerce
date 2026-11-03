import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Icon } from '@iconify/react';

// Extract YouTube video ID from URL
const getYoutubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Create thumbnail URL from video ID
const getYoutubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

function VerificationDialog({ 
  isOpen, 
  onClose, 
  isPending = false,
  title,
  message
}) {
  const navigate = useNavigate();
  const [activeVideo, setActiveVideo] = useState(null);
  
  // Onboarding video details
  const onboardingVideoUrl = "https://www.youtube.com/watch?v=inkrDFsM_wI";
  const videoId = getYoutubeVideoId(onboardingVideoUrl);
  const thumbnailUrl = videoId ? getYoutubeThumbnail(videoId) : null;
  
  // Set default title and message based on status
  const defaultTitle = "Pickup Address Required";
    
  const defaultMessage = "Your seller account does not have a pickup address yet. To access product listing features and start selling on Auqli, you need to add a pickup address.";
  
  // Use provided values or defaults
  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;

  const handleCompleteProfile = () => {
    navigate('/dashboard/account?openVerification=true');
    if (onClose) {
      onClose();
    }
  };

  const openVideoModal = (e) => {
    e.stopPropagation();
    setActiveVideo(videoId);
  };

  const closeVideoModal = () => {
    setActiveVideo(null);
  };

  // Create a portal target for the video modal
  React.useEffect(() => {
    // Create modal container if it doesn't exist
    if (!document.getElementById('video-modal-container')) {
      const modalContainer = document.createElement('div');
      modalContainer.id = 'video-modal-container';
      document.body.appendChild(modalContainer);
    }
    
    // Cleanup on unmount
    return () => {
      const container = document.getElementById('video-modal-container');
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl rounded-xl shadow-xl max-h-[80vh] overflow-y-auto border border-orange-100">
          <DialogHeader className="pb-2 mt-10">
            <DialogTitle className="flex items-center gap-3 flex-nowrap text-orange-600 text-xl font-semibold">
              <div className="bg-orange-100 p-2 rounded-full">
                <Icon icon={isPending ? "solar:clock-circle-bold" : "solar:shield-warning-bold"} className="h-6 w-6 text-orange-600" />
              </div>
              {displayTitle}
            </DialogTitle>
          </DialogHeader>
          
          <div className="pb-5 px-1">
            <p className="text-gray-700 text-base mb-4 leading-relaxed">
              {displayMessage}
            </p>
            {!isPending && (
              <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg">
                <Icon icon="solar:info-circle-bold" className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-gray-700 text-sm">
                  Please add a pickup address to continue with your product listing.
                </p>
              </div>
            )}
            
            {!isPending && videoId && (
              <div className="mt-4">
                <p className="text-gray-700 text-sm mb-2 font-medium">
                  <Icon icon="solar:play-circle-bold" className="h-4 w-4 text-blue-600 inline mr-1" />
                  Watch our onboarding tutorial to learn how to complete your profile:
                </p>
                <div 
                  className="cursor-pointer group relative rounded-lg overflow-hidden"
                  onClick={openVideoModal}
                >
                  <img 
                    src={thumbnailUrl} 
                    alt="Onboarding Tutorial" 
                    className="w-full aspect-video object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Icon icon="logos:youtube-icon" className="w-12 h-12" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-end gap-3 pt-2">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Icon icon="solar:close-circle-bold" className="h-4 w-4" />
              {isPending ? "Got it" : "Later"}
            </button>
            {!isPending && (
              <button 
                onClick={handleCompleteProfile}
                className="px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center justify-center gap-1"
              >
                <Icon icon="mdi:location" className="h-4 w-4" />
                Add Address
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Video Modal - Placed outside Dialog and rendered at document body level */}
      {activeVideo && (
        <div 
          className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" 
          onClick={closeVideoModal}
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            className="relative w-full max-w-4xl" 
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            <button 
              className="absolute -top-10 right-0 text-white hover:text-gray-300" 
              onClick={closeVideoModal}
            >
              <Icon icon="mdi:close" className="w-8 h-8" />
            </button>
            <div className="relative pb-[56.25%] h-0" style={{ pointerEvents: 'auto' }}>
              <iframe 
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                title="Onboarding Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ pointerEvents: 'auto' }}
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VerificationDialog; 