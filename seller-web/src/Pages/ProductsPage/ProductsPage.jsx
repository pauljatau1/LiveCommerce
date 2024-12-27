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
import { productPageCardData } from "../../Utilities/data";
import { NavLink } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { fetchSellerProducts } from "../../Redux/Slices/ProductSlice";
import ProductCard from "../../Components/ui/ProductPageUi/ProductCard";
import NotFound from "../../assets/not-found-icon2.png"


const ProductsPage = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const { products, isLoading } = useSelector((state) => state.product);
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const [notification, setNotification] = useState(true);
    const [open, setOpen] = useState(false);
    const [isChatVisible, setIsChatVisible] = useState(true);
    const WEBSITE_ID = "1e433cca-97ba-42a7-bac7-b3ea79d648f1";


    useEffect(() => {
        dispatch(fetchSellerProducts());
    }, [dispatch]);
    console.log("products:", products);


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
        <>
            {/*isLoading && <Loader />*/}
            <div className="flex flex-col justify-between gap-4 py-6">
                <div className="flex justify-between items-center w-full ">
                    {
                        !isSidebarOpen && (
                            <Icon icon="pepicons-pencil:menu" width="34" height="34" color="#05031F" className='md:hidden' onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                        )
                    }
                    <h1 className="text-2xl font-bold font-lexend">Products</h1>
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
                    products.length > 0 && (
                        <div className="flex items-center gap-2 w-full h-[40px] bg-[#05031F] rounded-full py-6 pl-6 pr-6 mt-4 lg:mt-6 focus-within:outline focus-within:outline-white">
                            <Icon icon="iconamoon:search-thin" width="24" height="24" color="#FFFFFF" />
                            <input type="text" placeholder='Search for products...' className='w-full h-full px-1 bg-[#05031F] text-[#FFFFFF] rounded-full py-6 outline-none' />
                        </div>
                    )
                }
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-6 w-full">
                <h1 className="text-xl font-bold font-lexend">My Products</h1>
                <div className="flex items-center flex-wrap gap-4">
                    {
                        products.length > 0 && (
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <p className="text-base font-cabin font-normal text-[#05031F]">Sort By:</p>
                                <div className="flex items-center flex-wrap gap-2">
                                    <div className="flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer text-[#05031F] bg-[#0BB24817] rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out">
                                        <Icon icon="solar:calendar-outline" width="20" height="20" color="#05031F" />
                                        <p className="text-sm font-cabin font-normal text-[#05031F]">Newest</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer text-[#05031F] bg-[#0BB24817] rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out">
                                        <Icon icon="iconamoon:clock-thin" width="20" height="20" color="#05031F" />
                                        <p className="text-sm font-cabin font-normal text-[#05031F]">Active</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer text-[#05031F] bg-[#0BB24817] rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out">
                                        <Icon icon="solar:calendar-outline" width="20" height="20" color="#05031F" />
                                        <p className="text-sm font-cabin font-normal text-[#05031F]">Lowest-Highest</p>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    <NavLink to="/dashboard/add-products" className="flex items-center gap-2 text-sm font-cabin font-normal cursor-pointer text-[#FFFFFF] bg-[#05031F] rounded-[7.8px] py-3 px-4 hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                        <Icon icon="tabler:plus" width="20" height="20" color="#FFFFFF" />
                        <p className="text-sm font-cabin font-normal text-[#FFFFFF]">Add Product</p>
                    </NavLink>
                </div>
            </div>
            <div className="flex flex-wrap w-full bg-[#F7F7F7] py-8 mb-10 justify-evenly lg:justify-start lg:pl-3 xl:justify-evenly gap-x-2 gap-y-4">
                {
                    products.length > 0 ? (
                        products.map((item) => (
                            <ProductCard key={item.id} item={item} />
                        ))

                    ) : (
                        <div className="flex flex-col h-[50dvh] items-center justify-center flex-wrap gap-4 mt-4 lg:mt-8 w-full">
                            <img src={NotFound} alt="not-found" className="w-[220px] md:w-[250px] h-[220px] md:h-[250px]" />
                            <p className="text-base lg:text-lg font-cabin font-normal text-[#05031F]">No products found</p>
                        </div>
                    )
                }
            </div>
            {
                products.length > 20 && (
                    <div className="flex items-center justify-center flex-wrap gap-4 mt-4  lg:mt-8 w-full">
                        <button className="text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-2 rounded-full py-3 px-4 hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                            <Icon icon="gg:arrow-long-left" width="20" height="20" color="#FFFFFF" />
                            <p className="text-sm font-cabin font-normal text-[#FFFFFF]">Previous</p>
                        </button>
                        <button className="text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-2 rounded-full py-3 px-4 hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                            <p className="text-sm font-cabin font-normal text-[#FFFFFF]">Next</p>
                            <Icon icon="gg:arrow-long-right" width="20" height="20" color="#FFFFFF" />
                        </button>
                        <button className="text-sm font-cabin font-normal text-[#ffffff] bg-[#05031F] flex items-center gap-2 rounded-full py-3 px-4  whitespace-nowrap hover:bg-[#05031F]/90 transition-all duration-500 ease-in-out">
                            <p className="text-sm font-cabin font-normal text-[#FFFFFF]">20 per page</p>
                            <Icon icon="simple-line-icons:arrow-down" width="10" height="10" color="#FFFFFF" />
                        </button>
                    </div>
                )
            }
        </>
    )
}

export default ProductsPage
