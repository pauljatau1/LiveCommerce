import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { Command, CommandList, CommandGroup, CommandItem } from '../../ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '../../ui/popover';
import { Crisp } from "crisp-sdk-web";
import { useNavigation, useOutletContext } from "react-router-dom";
import AlertNotification from '../AlertNotification';
import PropTypes from 'prop-types';


const Header = ({ notificationData, showNotification = false, notificationColor, notificationBackgroundColor, search = '', setSearch = () => { }, showSearch = false, headerTitle = 'Products', searchPlaceholder = 'Search', notificationIcon = 'formkit:warning' }) => {
    const navigation = useNavigation();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [open, setOpen] = useState(false);
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
                <h1 className="text-2xl font-bold font-lexend">{headerTitle}</h1>
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
                    <button onClick={handleChatOpen} className="bg-[#05031F] rounded-full p-3 flex items-center justify-center relative overflow-hidden transition-all duration-150 hover:shadow-lg isolate before:absolute before:bg-white/20 before:content-[''] before:h-full before:w-0 before:top-0 before:left-[50%] before:transform before:-translate-x-1/2 before:-z-10 hover:before:w-full before:transition-all before:duration-150 active:scale-[0.98]" >
                        <span className="relative z-10">
                            <Icon icon="solar:chat-line-bold" width="24" height="24" color='#FFFFFF' />
                        </span>
                    </button>
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
            {showNotification && <AlertNotification message={notificationData} color={notificationColor} background={notificationBackgroundColor} notificationIcon={notificationIcon} />}
            {
                showSearch && (
                    <div className="flex items-center gap-2 w-full h-[40px] bg-[#05031F] rounded-full py-6 pl-6 pr-6 mt-4 lg:mt-6 focus-within:outline focus-within:outline-white">
                        <Icon icon="iconamoon:search-thin" width="24" height="24" color="#FFFFFF" />
                        <input type="text" placeholder={`${searchPlaceholder}...`} value={search} onChange={(e) => setSearch(e.target.value)} className='w-full h-full px-1 bg-[#05031F] text-[#FFFFFF] rounded-full py-6 outline-none' />
                    </div>
                )
            }
        </div>
    )
};

Header.propTypes = {
    notificationData: PropTypes.string,
    showNotification: PropTypes.bool,
    notificationColor: PropTypes.string,
    notificationBackgroundColor: PropTypes.string,
    search: PropTypes.string,
    setSearch: PropTypes.func,
    showSearch: PropTypes.bool.isRequired,
    headerTitle: PropTypes.string.isRequired,
    searchPlaceholder: PropTypes.string
}

export default Header
