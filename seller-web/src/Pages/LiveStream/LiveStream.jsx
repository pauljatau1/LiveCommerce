import { useEffect, useContext, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { liveStreamCardData } from "../../Utilities/data";
import LiveStreamCard from "../../Components/LiveStreamCard";
import AuqliUniversity from "../../Components/AuqliUniversity";
import { LivestreamContext } from "../../Contexts/LivestreamContext";
import { NavLink } from 'react-router-dom';
import VerificationDialog from "../../Components/VerificationDialog";
import { useAuthContext } from "../../Hooks/useAuthContext";


const LiveStream = () => {
    const { setHeaderName, setNavName } = useOutletContext();
    const { getAllSellerActiveStreams, fetchedLiveStreams, isLoading } = useContext(LivestreamContext);
    const { seller, authToken, fetchSellerDetails } = useAuthContext();
    const [scheduledShows, setScheduledShows] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showVerificationDialog, setShowVerificationDialog] = useState(false);

    useEffect(() => {
        setHeaderName('Live Streams')
        setNavName('')
        getAllSellerActiveStreams();
        
        // Update current time every minute to keep countdown accurate
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        
        return () => clearInterval(timer);
    }, [])

    // Check if seller is verified
    useEffect(() => {
        if (seller && seller.isVerified === false) {
            setShowVerificationDialog(true);
        }
    }, [seller]);

    useEffect(() => {
        if (fetchedLiveStreams && fetchedLiveStreams.length > 0) {
            // Filter for scheduled streams that haven't started yet
            const scheduled = fetchedLiveStreams.filter(stream => 
                stream.status === 'scheduled' || stream.status === 'upcoming');
            setScheduledShows(scheduled);
        }
    }, [fetchedLiveStreams]);
    
    // Handle stream action clicks for unverified users
    const handleStreamActionClick = (e) => {
        if (seller && !seller.isVerified) {
            e.preventDefault();
            setShowVerificationDialog(true);
        }
    };
    
    // Calculate time remaining until stream starts
    const getTimeRemaining = (scheduledTime) => {
        if (!scheduledTime) return { days: 0, hours: 0, minutes: 0 };
        
        const scheduledDate = new Date(scheduledTime);
        const timeRemaining = scheduledDate - currentTime;
        
        // If time is in the past
        if (timeRemaining <= 0) {
            return { days: 0, hours: 0, minutes: 0, isPast: true };
        }
        
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        return { days, hours, minutes, isPast: false };
    };
    
    // Format the countdown text
    const formatCountdown = (time) => {
        if (time.isPast) return "Stream time passed";
        if (time.days > 0) return `${time.days}d ${time.hours}h left`;
        if (time.hours > 0) return `${time.hours}h ${time.minutes}m left`;
        return `${time.minutes}m left`;
    };

    useEffect(() => {
        if (authToken) {
            fetchSellerDetails();
        }
    }, [authToken]);

    // Listen for verification completed event
    useEffect(() => {
        const handleVerificationCompleted = () => {
            console.log("Verification completed event received, refreshing seller data...");
            fetchSellerDetails();
        };

        window.addEventListener('seller-verification-completed', handleVerificationCompleted);
        
        return () => {
            window.removeEventListener('seller-verification-completed', handleVerificationCompleted);
        };
    }, []);

    return (
        <div className="flex flex-col mt-10 gap-8 ">
            {/* Verification Dialog */}
            <VerificationDialog 
                isOpen={showVerificationDialog} 
                onClose={() => setShowVerificationDialog(false)} 
                isPending={seller?.accountPending}
            />
            
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {liveStreamCardData.map((item) => (
                        <LiveStreamCard 
                            item={item} 
                            key={item.id} 
                            isVerified={seller?.isVerified}
                            onUnverifiedAction={handleStreamActionClick}
                        />
                    ))}
                </div>
            </div>

            {/* Scheduled Shows Section */}
            <div className="bg-[#FFFFFF] border border-gray-200 rounded-xl p-8 space-y-10">
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-[#05031F]">
                        Your Scheduled Shows
                    </h2>
                    <p className="text-gray-600">
                        Start your scheduled livestreams from here
                    </p>
                </div>
                
                <div className="relative">
                    <div className="flex gap-6 overflow-x-auto pb-4 scroll-smooth 
                        [&::-webkit-scrollbar]:h-2
                        [&::-webkit-scrollbar-track]:rounded-full
                        [&::-webkit-scrollbar-track]:bg-[#C1BEBE]
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-[#16783A]
                        hover:[&::-webkit-scrollbar-thumb]:bg-[#16783A]/80">
                        
                        {scheduledShows.length > 0 ? (
                            scheduledShows.map((stream) => {
                                const timeRemaining = getTimeRemaining(stream.scheduledStartTime);
                                const countdownText = formatCountdown(timeRemaining);
                                
                                return (
                                <div key={stream._id} className="bg-white min-w-[240px] max-w-[240px] relative pt-0 px-0 pb-16 shadow-sm border rounded-lg border-gray-200 hover:shadow-md transition-all duration-300 flex flex-col">
                                    <div className="flex flex-col w-full h-full">
                                        {/* Cover Image - Full Width */}
                                        <div className="w-full h-52 rounded-t-lg overflow-hidden relative">
                                            {stream.coverImage?.url ? (
                                                <img 
                                                    src={stream.coverImage.url} 
                                                    alt={stream.title} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : stream.seller?.storeAvatar?.url ? (
                                                <img 
                                                    src={stream.seller.storeAvatar.url} 
                                                    alt={stream.title} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center">
                                                    <span className="text-[#16783A] font-semibold">{stream.seller?.storeName || "Scheduled Stream"}</span>
                                                </div>
                                            )}
                                            
                                            {/* Countdown Badge */}
                                            {stream.scheduledStartTime && (
                                                <div className={`absolute top-3 right-3 ${timeRemaining.isPast ? 'bg-amber-100' : 'bg-green-100'} bg-opacity-95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm`}>
                                                    <div className="flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${timeRemaining.isPast ? 'text-amber-600' : 'text-green-600'}`} viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className={`text-xs font-medium ${timeRemaining.isPast ? 'text-amber-700' : 'text-green-700'}`}>
                                                            {countdownText}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Schedule Date Badge */}
                                            {stream.scheduledStartTime && (
                                                <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                                                    <div className="flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-xs font-medium text-white">
                                                            {new Date(stream.scheduledStartTime).toLocaleDateString()} {new Date(stream.scheduledStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Content Section */}
                                        <div className="p-4 flex flex-col gap-3 flex-grow">
                                            {/* Stream Title */}
                                            <h2 className="text-base font-inter font-semibold text-[#05031F] line-clamp-1">{stream.title}</h2>
                                            
                                            {/* Seller Info */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {stream.seller?.storeAvatar?.url ? (
                                                        <img src={stream.seller.storeAvatar.url} alt={stream.seller?.storeName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-[#16783A] flex items-center justify-center text-white text-xs">
                                                            {stream.seller?.storeName?.charAt(0) || "S"}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-600 truncate">{stream.seller?.storeName || "Seller"}</span>
                                            </div>
                                            
                                            {/* Description */}
                                            <p className="text-xs text-[#425466] line-clamp-2 mt-1">
                                                {stream.description}
                                            </p>
                                            
                                            {/* Status */}
                                            <div className="flex justify-end items-center text-xs mt-auto">
                                                <span className="bg-green-50 text-[#16783A] px-2 py-1 rounded-full text-xs">
                                                    {stream.status === 'scheduled' ? 'Scheduled' : stream.status}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Start Stream Button */}
                                        {seller?.isVerified ? (
                                            <NavLink
                                                to={timeRemaining.isPast ? '#' : `/dashboard/live-streams/live-stream-studio/${stream._id}`}
                                                className={`absolute bottom-4 left-0 right-0 mx-auto w-[85%] text-xs font-medium font-inter py-2 rounded-lg transition-all duration-300 text-center ${
                                                    timeRemaining.isPast 
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                    : 'bg-[#16783A] text-white hover:bg-[#16783A]/90'
                                                }`}
                                                onClick={(e) => timeRemaining.isPast && e.preventDefault()}
                                            >
                                                <div className="flex items-center justify-center gap-1.5 w-full">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                    {timeRemaining.isPast ? 'Stream Expired' : 'Start Stream'}
                                                </div>
                                            </NavLink>
                                        ) : (
                                            <button
                                                onClick={handleStreamActionClick}
                                                className={`absolute bottom-4 left-0 right-0 mx-auto w-[85%] text-xs font-medium font-inter py-2 rounded-lg transition-all duration-300 text-center ${
                                                    timeRemaining.isPast 
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                    : 'bg-[#16783A] text-white hover:bg-[#16783A]/90'
                                                }`}
                                                disabled={timeRemaining.isPast}
                                            >
                                                <div className="flex items-center justify-center gap-1.5 w-full">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                    {timeRemaining.isPast ? 'Stream Expired' : 'Start Stream'}
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                );
                            })
                        ) : isLoading ? (
                            <div className="w-full text-center py-6 text-gray-500">
                                Loading your scheduled shows...
                            </div>
                        ) : (
                            <div className="w-full text-center py-6 text-gray-500">
                                No scheduled shows found. Create one from the live show menu.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Live Streaming Resources Section */}
            <AuqliUniversity className="bg-[#FFFFFF] border border-gray-200 rounded-xl p-8" />
        </div>
    )
}

export default LiveStream;