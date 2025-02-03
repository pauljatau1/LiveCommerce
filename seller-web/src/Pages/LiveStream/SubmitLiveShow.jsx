import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LiveShowIcon from '../../assets/Background.png';
import CircularProgress from '@mui/material/CircularProgress';
import LiveStreamSuccessIcon from '../../assets/Party.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import PropTypes from 'prop-types';

const SuccessModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-lg">
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 space-y-6">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Success Icon */}
          <img 
            src={LiveStreamSuccessIcon} 
            alt="Success" 
            className="w-20 h-20 object-contain"
          />

          {/* Title */}
          <h2 className="text-2xl font-semibold text-gray-900">
            Congrats
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-sm">
            Congratulations! Your show is scheduled! We will send a notification to your followers and interested users about your show! We will also send a notification when you go live!
          </p>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-3 w-full pt-4">
            <button
              onClick={() => navigate('/dashboard/live-streams/scheduled-shows')}
              className="flex-1 px-4 py-2.5 whitespace-nowrap text-xs font-medium text-white bg-[#16783A] rounded-sm hover:bg-[#16783A]/90 transition-all duration-300"
            >
              GO TO SCHEDULED SHOWS
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 w-full text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              SHARE
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 12H16M16 12L12 8M16 12L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Footer Text */}
          <p className="text-sm text-gray-500 pt-2">
            Prepare your studio. Make sure to enter studio an hour before going live to make sure everything is set. HAPPY STREAMING!
          </p>
        </div>
      </div>
    </div>
  );
};

SuccessModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

const SubmitLiveShow = () => {
    const { livestream, scheduleLiveShow, isLoading, message } = useLivestreamContext();
    const { setHeaderName, setNavName } = useOutletContext();
    const { products } = useSelector(state => state.product);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        setHeaderName('Live Streams');
        setNavName('Submit Live Show');
    }, []);

    useEffect(() => {
        if (message === 'livestream scheduled successfully') {
            setShowSuccessModal(true);
        }
    }, [message]);

    const handleSchedulingLiveShow = async () => {
        const streamData = {
            title: livestream.title,
            description: livestream.description,
            coverPhoto: livestream.coverPhoto,
            category: livestream.category,
            tags: livestream.tags.map(tag => tag.label),
            scheduledStartTime: new Date().toISOString(),
        }

        console.log(streamData);

        try {
            if (livestream.title && livestream.description && livestream.coverPhoto && livestream.tags.length > 0) {
                await scheduleLiveShow(streamData);
            } else {
                toast.error('Please fill in all fields', {
                    style: {
                        background: '#05031F',
                        color: '#fff',
                    }
                });
            }
        } catch (error) {
            console.error('Failed to schedule livestream:', error);
        }
    }

    return (
        <>
            <div className="flex flex-col gap-6 py-10 ">
                <div className="max-w-7xl mx-auto w-full space-y-8">
                    {/* Preview Card Container */}
                    <div className="h-fit flex flex-col lg:flex-row items-stretch gap-10">
                        {/* Left Preview Card */}
                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-center mb-10 md:mb-20 justify-between gap-4">
                                    <img src={LiveShowIcon} alt="Live Show Icon" className="w-10 h-10 md:w-14 md:h-14 xl:w-16 xl:h-16 object-cover" />
                                    <h4 className="text-base md:text-lg font-semibold font-inter text-[#16192C]">Open Live show Summary</h4>
                                    <p className="text-xs xl:text-sm font-inter text-[#718096]">Preview</p>    
                                </div>
                                {/* Title Section */}
                                <div className="space-y-2 mb-10">
                                    <h2 className="text-sm font-semibold text-[#27272E] font-inter">Open Live Stream Title</h2>
                                    <p className="text-sm md:text-base text-[#718096]">
                                        {livestream?.title || 'No title provided'}
                                    </p>
                                </div>

                                {/* Cover Photo Section */}
                                <div className="space-y-2 mb-10">
                                    <h2 className="text-sm font-semibold text-[#27272E] font-inter">Stream Cover Photo</h2>
                                    <div className="relative w-full h-[200px] md:h-[300px] rounded-lg overflow-hidden bg-gray-100">
                                        {livestream?.coverPhoto ? (
                                            <img
                                                src={URL.createObjectURL(livestream.coverPhoto)}
                                                alt="Stream Cover"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-sm md:text-base text-[#718096]">No cover photo uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description Section */}
                                <div className="space-y-2 mb-10">
                                    <h2 className="text-sm font-semibold text-[#27272E] font-inter">Description</h2>
                                    <p className="text-sm md:text-base text-[#718096]">
                                        {livestream?.description || 'No description provided'}
                                    </p>
                                </div>

                                {/* Key Reminder Section */}
                                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                                    <h3 className="text-sm font-medium text-blue-800">Key reminder</h3>
                                    <p className="text-sm text-blue-600">
                                        Your scheduled show will be visible to all users in BAYO. It is recommended to login 1hr before your show to setup your studio by providing your stream URL and Stream Key. Test your audio, video and playback before going live! Happy streaming!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Products Selection Card */}
                        <div className="flex-1 xl:flex-none lg:w-[500px] bg-white rounded-xl shadow-sm border border-gray-200 h-auto">
                            <div className="h-full p-6 flex flex-col items-start lg:items-center justify-center">
                                <div className="w-full flex flex-col items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <h2 className="text-lg font-semibold text-gray-900">Products Selection</h2>
                                        <p className="text-sm text-gray-500">
                                            All products in your store are automatically selected for open live shows.
                                            To remove a product, you can deactivate the product from the product listings.
                                        </p>
                                    </div>
                                    <button className="px-4 py-2 text-sm font-medium text-green-600 bg-white border border-green-600 rounded-lg hover:bg-green-50">
                                        Got it
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <NavLink
                            to="/dashboard/live-streams/create-live-show"
                            className="px-6 py-2.5 text-sm font-medium text-[#505780] bg-[#E4ECF7] rounded-lg hover:bg-[#E4ECF7]/70 transition-all duration-300"
                        >
                            Go Back
                        </NavLink>
                        <button 
                            onClick={handleSchedulingLiveShow}
                            disabled={isLoading}
                            className="px-6 w-[200px] whitespace-nowrap py-2.5 text-sm font-medium text-white bg-[#16783A] rounded-lg hover:bg-[#16783A]/90 disabled:opacity-50"
                        >
                            {isLoading ? <CircularProgress size={20} color="#fff" /> : 'Schedule Live Show'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <SuccessModal 
                isOpen={showSuccessModal} 
                onClose={() => setShowSuccessModal(false)} 
            />
        </>
    );
};

export default SubmitLiveShow;
