import { useLivestreamContext } from '../../Hooks/useLivestreamContext';
import LiveShowIcon from '../../assets/Background.png';
import CircularProgress from '@mui/material/CircularProgress';
import LiveStreamSuccessIcon from '../../assets/Party.png';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import LiveAuctionProductsCard from '../../Components/LiveAuctionProductsCard';
import PropTypes from 'prop-types';

const SuccessModal = ({ isOpen, onClose, shouldStartImmediately, livestream }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleStartImmediately = () => {
        if (shouldStartImmediately) {
            navigate(`/dashboard/live-streams/live-stream-studio/${livestream._id}`)
        } else {
            return (
                <button
                    onClick={() => navigate('/dashboard/live-streams/scheduled-shows')}
                    className="flex-1 px-4 py-2.5 whitespace-nowrap text-xs font-medium text-white bg-[#16783A] rounded-sm hover:bg-[#16783A]/90 transition-all duration-300"
                >
                    GO TO SCHEDULED SHOWS
                </button>
            )
        }
    }

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
                        {handleStartImmediately()}
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 w-full text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            SHARE
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 12H16M16 12L12 8M16 12L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
    onClose: PropTypes.func.isRequired,
    shouldStartImmediately: PropTypes.bool.isRequired,
    livestream: PropTypes.object.isRequired
};

const SubmitLiveAuction = () => {
    const navigate = useNavigate();
    const { livestream, scheduleLiveAuction, isLoading, message } = useLivestreamContext();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const { setHeaderName, setNavName } = useOutletContext();
    const [shouldStartImmediately, setShouldStartImmediately] = useState(false);
    const [livestreamData, setLivestreamData] = useState(null);

    useEffect(() => {
        setHeaderName('Live Streams');
        setNavName('Submit Live Auction');
    }, [setHeaderName, setNavName]);

    useEffect(() => {
        if (livestream.startImmediately) {
            console.log('startImmediately', livestream.startImmediately);
            setShouldStartImmediately(livestream.startImmediately);
        }
    }, []);

    useEffect(() => {
        if (message === 'livestream scheduled successfully') {
            setShowSuccessModal(true);
        }
    }, [message]);

    const selectedProducts = livestream?.selectedProducts || [];

    const handleSchedulingLiveAuction = async () => {
        const streamData = {
            title: livestream?.title,
            description: livestream?.description,
            coverImage: {
                data: livestream?.coverPhoto?.data,
                contentType: livestream?.coverPhoto?.contentType
            },
            category: livestream?.category,
            subCategory: livestream?.subCategory,
            tags: livestream?.tags?.map(tag => tag.label),
            products: selectedProducts.map(product => ({
                product: {
                    productId: product.productId,
                    name: product.name,
                    category: product.category,
                    images: product.images,
                    sku: product.sku,
                    quantity: product.quantity,
                },
                minBid: product.minBid,
                maxBid: product.maxBid,
            })),
            video: livestream?.video,
            scheduledStartTime: livestream?.scheduledStartTime || new Date().toISOString(),
        }

        console.log('live auction submitted data', streamData);

        try {
            if (streamData.title && streamData.description && streamData.coverImage && streamData.products.length > 0) {
                const response = await scheduleLiveAuction(streamData);
                if (response) {
                    setLivestreamData(response);
                }
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
            <div className="flex flex-col p-3 lg:p-10 gap-6 ">
                <div className="max-w-7xl mx-auto w-full space-y-8">
                    {/* Preview Card Container */}
                    <div className="h-fit flex flex-col lg:flex-row items-stretch gap-10">
                        {/* Left Preview Card */}
                        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center mb-10 md:mb-20 justify-between gap-4">
                                    <div className="flex items-center gap-4 xl:gap-8">
                                        <img src={LiveShowIcon} alt="Live Show Icon" className="w-10 h-10 md:w-14 md:h-14 xl:w-16 xl:h-16 object-cover" />
                                        <h4 className="text-base md:text-lg font-semibold max-w-[150px] md:max-w-none font-inter text-[#16192C]">Open Live Auction Summary</h4>
                                    </div>
                                    <p className="text-xs xl:text-sm font-inter text-[#718096]">Preview</p>
                                </div>
                                {/* Title Section */}
                                <div className="space-y-2 mb-10">
                                    <h2 className="text-sm font-semibold text-[#27272E] font-inter">Open Live Auction Title</h2>
                                    <p className="text-sm md:text-base text-[#718096]">
                                        {livestream?.title || 'No title provided'}
                                    </p>
                                </div>

                                {/* Cover Photo Section */}
                                <div className="space-y-2 mb-10">
                                    <h2 className="text-sm font-semibold text-[#27272E] font-inter">Stream Cover Photo</h2>
                                    <div className="relative w-full h-[200px] md:h-[300px] flex items-center justify-center rounded-lg overflow-hidden bg-gray-100">
                                        {livestream?.coverPhoto ? (
                                            <img
                                                src={URL.createObjectURL(livestream.coverPhoto.file)}
                                                alt="Stream Cover"
                                                className="w-1/2 h-1/2 object-contain"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-sm md:text-base text-[#718096]">No cover photo uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Blip Video Section */}
                                <div className="space-y-2 mb-10">
                                    <div className="flex items-center">
                                        <h2 className="text-sm font-semibold text-[#27272E] font-inter">Stream Blip</h2>
                                        <span className="ml-2 text-xs bg-[#E9FCEF] text-[#0BB248] px-2 py-0.5 rounded-full">Recommended</span>
                                    </div>
                                    <div className="flex md:flex-row flex-col items-start gap-4">
                                        <div className="relative w-full md:w-1/3 aspect-[9/16] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                            {livestream?.video ? (
                                                <div className="w-full h-full flex items-center justify-center bg-black">
                                                    <video
                                                        src={URL.createObjectURL(new Blob(
                                                            [Uint8Array.from(atob(livestream.video.data), c => c.charCodeAt(0))], 
                                                            { type: livestream.video.contentType }
                                                        ))}
                                                        className="w-full h-full object-contain"
                                                        controls
                                                        playsInline
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                                    <div className="bg-[#E9FCEF] rounded-full p-3 mb-3">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#0BB248]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polygon points="23 7 16 12 23 17 23 7" />
                                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm text-[#718096]">No blip video uploaded</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h3 className="text-sm font-medium text-gray-700 mb-1">Blip Benefits</h3>
                                            <ul className="text-xs text-gray-600 space-y-2">
                                                <li className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2 text-[#0BB248]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Increases your livestream visibility by up to 40%
                                                </li>
                                                <li className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2 text-[#0BB248]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Attracts more viewers to your upcoming show
                                                </li>
                                                <li className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2 text-[#0BB248]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Promotes engagement before your show starts
                                                </li>
                                            </ul>
                                        </div>
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
                        <div className="flex-1 xl:flex-none lg:w-[354px] bg-white rounded-xl shadow-sm border overflow-y-auto border-gray-200 h-auto">
                            <h1 className="text-lg font-semibold text-[#16192C] font-inter pl-8 pt-6 xl:pt-10">Products in show</h1>
                            <div className="flex flex-col gap-3 mt-3">
                                {selectedProducts.map(product => (
                                    <LiveAuctionProductsCard key={product.productId} product={product} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-end gap-3 pt-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 whitespace-nowrap py-2.5 order-2 md:order-1 text-sm font-medium text-[#505780] bg-[#E4ECF7] rounded-lg hover:bg-[#E4ECF7]/70 transition-all duration-300"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={handleSchedulingLiveAuction}
                            disabled={isLoading}
                            className="px-6 w-[200px] whitespace-nowrap py-2.5 order-1 md:order-2 text-sm font-medium text-white bg-[#16783A] rounded-lg hover:bg-[#16783A]/90 disabled:opacity-50 transition-all duration-300"
                        >
                            {isLoading ? <CircularProgress size={20} color="#fff" /> : shouldStartImmediately ? 'Start Now' : 'Schedule Live Auction'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                shouldStartImmediately={shouldStartImmediately}
                livestream={livestreamData}
            />
        </>
    );
};

export default SubmitLiveAuction;
