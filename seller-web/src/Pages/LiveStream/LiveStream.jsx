import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { liveStreamCardData, suggestVideosData } from "../../Utilities/data";
import LiveStreamCard from "../../Components/LiveStreamCard";
import SuggestedVideoCard from "../../Components/SuggestedVideoCard";
import Header from "../../Components/ui/Header/Header";


const LiveStream = () => {
    const { setHeaderName, setNavName } = useOutletContext()
    useEffect(() => {
        setHeaderName('Live Streams')
        setNavName('')
    }, [])

    return (
        <div className="flex flex-col mt-10 gap-8 ">        
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {liveStreamCardData.map((item) => (
                        <LiveStreamCard item={item} key={item.id} />
                    ))}
                </div>
            </div>

            <div className="bg-[#FFFFFF] border border-gray-200 rounded-xl p-8 space-y-10">
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-[#05031F]">
                        Live Streaming Resources
                    </h2>
                    <p className="text-gray-600">
                        Get tips and best practices to grow your business through live streams
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
                        {suggestVideosData.map((video) => (
                            <SuggestedVideoCard video={video} key={video.id} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LiveStream;