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
import { Crisp } from "crisp-sdk-web";
import { NavLink } from 'react-router-dom';
import { marketingAdsData, suggestVideosData } from "../../Utilities/data";
import NotFound from "../../assets/not-found-icon2.png";
import AlertNotification from "../../Components/ui/AlertNotification";
import MarketingAdsCard from "../../Components/MarketingAdsCard";
import SuggestedVideoCard from "../../Components/SuggestedVideoCard";


const MarketingPage = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const [open, setOpen] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [notification, setNotification] = useState(true);
    const WEBSITE_ID = "1e433cca-97ba-42a7-bac7-b3ea79d648f1";


    useEffect(() => {
        // Configure Crisp
        Crisp.configure(WEBSITE_ID, {
            autoLoad: false,
        });

        // Hide the default Crisp button initially
        window.$crisp.push(["do", "chat:hide"]);

        // Add event listener for chat close
        window.$crisp.push(["on", "chat:closed", () => {
            setIsChatVisible(false);
            // Hide the default Crisp button when chat is closed
            window.$crisp.push(["do", "chat:hide"]);
        }]);

        // Optional: Reset visibility when component unmounts
        return () => {
            window.$crisp.push(["off", "chat:closed"]);
        };
    }, []);

    const handleChatOpen = () => {
        setIsChatVisible(true);
        // Show the Crisp widget when opening chat
        window.$crisp.push(["do", "chat:show"]);
        Crisp.chat.open();
    };


    return (
        <div className="flex flex-col justify-between gap-4 py-6">
            <div className="flex justify-between items-center w-full ">
                {
                    !isSidebarOpen && (
                        <Icon icon="pepicons-pencil:menu" width="34" height="34" color="#05031F" className='md:hidden' onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                    )
                }
                <div className="flex items-center gap-0">
                    <h1 className="text-2xl font-bold font-lexend">MARKETING</h1>
                    <Icon icon="material-symbols-light:keyboard-arrow-right" width="30" height="30" color="#05031F" className="hidden md:block" />
                    <h1 className="text-2xl font-bold font-lexend hidden md:block">AUQLI ADS</h1>
                </div>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <button className='bg-[#DF0707] lg:hidden items-center justify-center w-fit text-white text-base font-bold font-lexend px-6 py-3 rounded-full xl:ml-[56px] xl:mr-[30px] relative overflow-hidden transition-all duration-150 hover:shadow-lg group isolate before:absolute before:bg-white/30 before:content-[""] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]'>
                            <Icon icon="ri:live-fill" width="24" height="24" color="#FFFFFF" className="lg:hidden" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                        <Command>
                            <CommandList>
                                <CommandGroup>
                                    <CommandItem onSelect={() => {
                                        // Handle Go Live action
                                        setOpen(false)
                                    }}>
                                        <Icon icon="fluent:live-20-filled" width="20" height="20" color="#05031F" />
                                        <span className="ml-2 text-[#05031F]">Go Live</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => {
                                        handleChatOpen();
                                        setOpen(false);
                                    }}>
                                        <Icon icon="solar:chat-line-bold" width="24" height="24" color='#05031F' />
                                        <span className="ml-2 text-[#05031F]">Live Chat</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => {
                                        // Handle Notification action
                                        setOpen(false)
                                    }}>
                                        <Icon icon="mingcute:notification-fill" width="24" height="24" color='#05031F' />
                                        <span className="ml-2 text-[#05031F]">Notification</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => {
                                        // Handle Profile action
                                        setOpen(false)
                                    }}>
                                        <Icon icon="iconamoon:profile-fill" width="24" height="24" color='#05031F' />
                                        <span className="ml-2 text-[#05031F]">Profile</span>
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <div className='items-center gap-7 hidden lg:flex'>
                    {isChatVisible && (
                        <button onClick={handleChatOpen} className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                            <span className="relative z-10">
                                <Icon icon="solar:chat-line-bold" width="24" height="24" color='#FFFFFF' />
                            </span>
                        </button>
                    )}
                    <button className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                        <span className="relative z-10">
                            <Icon icon="si:notifications-thick-duotone" width="24" height="24" color='#FFFFFF' />
                        </span>
                    </button>
                    <button className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                        <span className="relative z-10">
                            <Icon icon="iconamoon:profile-fill" width="24" height="24" color='#FFFFFF' />
                        </span>
                    </button>
                </div>
            </div>
            {
                notification && (
                    <AlertNotification />
                )
            }
            <div className="flex flex-wrap gap-4">
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
    )
}

export default MarketingPage
