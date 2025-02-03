import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useNavigation, useOutletContext } from "react-router-dom";
import Loader from '../../Components/Loader';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "../../Components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../Components/ui/popover";
import { NavLink } from 'react-router-dom';
import { marketingAdsData, suggestVideosData } from "../../Utilities/data";
import NotFound from "../../assets/not-found-icon2.png";
import AlertNotification from "../../Components/ui/AlertNotification";
import MarketingAdsCard from "../../Components/MarketingAdsCard";
import SuggestedVideoCard from "../../Components/SuggestedVideoCard";
import Header from "../../Components/ui/Header/Header";


const MarketingPage = () => {
    const { isSidebarOpen, setIsSidebarOpen, setHeaderName, setNavName } = useOutletContext();
    const [open, setOpen] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [notification, setNotification] = useState(true);

    useEffect(() => {
        setHeaderName('Marketing')
        setNavName('')
    }, [])


    return (
        <>   
        <div className="flex flex-col justify-between gap-4 py-6">
               
                
            <div className="flex flex-wrap mt-5   gap-4">
                {
                    marketingAdsData.map((item) => (
                        <MarketingAdsCard item={item} key={item.id} />
                    ))
                }
            </div>
            <div className="mt-20 bg-[#E7F7ED] rounded-[10px] px-4 py-3 lg:px-8 lg:py-7">
                <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Marketing Resources</h1>
                <p className="text-sm lg:text-base font-cabin font-normal text-[#05031F]">Get tips and best practices to grow your business on Auqli using Auqli marketing tools</p>
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
        </>
    )
}

export default MarketingPage
