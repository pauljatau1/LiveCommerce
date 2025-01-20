import { liveStreamCardData, suggestVideosData } from "../../Utilities/data";
import LiveStreamCard from "../../Components/LiveStreamCard";
import SuggestedVideoCard from "../../Components/SuggestedVideoCard";
import Header from "../../Components/ui/Header/Header";

const LiveStream = () => {
    return (
        <div className="flex flex-col justify-between gap-4 py-6">
            <Header headerTitle="MARKETING" showHeader={true} />
            <div>
                <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Choose a live stream model and go live now!</h1>
                <div className="flex flex-wrap gap-4">
                    {
                        liveStreamCardData.map((item) => (
                            <LiveStreamCard item={item} key={item.id} />
                        ))
                    }
                </div>
            </div>
            <div className="mt-20 bg-[#E7F7ED] rounded-[10px] px-4 py-3 lg:px-8 lg:py-7">
                <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Live Streaming Resources</h1>
                <p className="text-sm lg:text-base font-cabin font-normal text-[#05031F]">Get tips and best practices to grow your business through live streams</p>
                <div className="relative">
                    <div className="flex gap-4 lg:gap-8 overflow-x-scroll pb-4 mt-5 scroll-smooth 
                [&::-webkit-scrollbar]:h-2
                [&::-webkit-scrollbar-track]:rounded-full
                [&::-webkit-scrollbar-track]:bg-gray-100
                [&::-webkit-scrollbar-thumb]:rounded-full
                [&::-webkit-scrollbar-thumb]:bg-gray-300
                hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                        {
                            suggestVideosData.map((video) => (
                                <div key={video.id} className="flex-none">
                                    <SuggestedVideoCard video={video} />
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LiveStream;