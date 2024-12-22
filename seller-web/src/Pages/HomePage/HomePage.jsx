import { useEffect, useState } from "react";
import { useAuthContext } from "../../Hooks/useAuthContext";
import { Icon } from "@iconify/react";
import { homeAnalyticsCardData } from "../../Utilities/data";
import SideBarNav from "../../Components/ui/DashboardHomepageUi/SideBarNav";
import SearchBar from "../../Components/ui/DashboardHomepageUi/SearchBar";
import AlertNotification from "../../Components/ui/AlertNotification";
import HomeAnalyticsCard from "../../Components/ui/DashboardHomepageUi/HomeAnalyticsCard";

const HomePage = () => {
  const { seller, fetchSellerDetails } = useAuthContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(true);

  const getGreeting = () => {
    const nigerianTime = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Lagos',
      hour: 'numeric',
      hour12: false
    });

    const hour = parseInt(nigerianTime);

    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    fetchSellerDetails();
  }, []);

  return (
    <div className="flex h-screen w-dvh ">
      {/* Sidebar */}
      <SideBarNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      {/* Main Content */}
      <div className="pl-[20px] pr-[20px] md:pl-[42px] md:pr-[28px] pb-14 h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {/* Search Bar */}
        <SearchBar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        {/* Notification */}
        {
          notification && (
            <AlertNotification />
          )
        }
        
        <div className="pl-[2px] xl:pl-[42px] pr-[18px] xl:pr-[28px]" >
          {/* Greeting */}
          <div className="flex justify-between items-center flex-wrap xl:flex-nowrap">
            <h4 className="text-lg font-cabin font-normal text-black mt-9 w-[250px] xl:w-full ">{getGreeting()}, {seller?.firstName || 'User'}, how are you today?</h4>
            <button className="flex items-center gap-2 text-sm font-cabin font-normal text-[#05031F] mt-9 bg-[#0BB24817] rounded-[7.8px] py-3 px-4 hover:bg-[#0BB24820] transition-all duration-300 ease-in-out">
              <Icon icon="solar:calendar-outline" width="24" height="24" color="#05031F" />
              <p className="whitespace-nowrap">Filtering by date</p>
            </button>
          </div>
          {/* Analytics Cards */}
          <div className="flex justify-center items-center lg:max-xl:px-[70px]">
            <div className="flex gap-4 mt-9 md:justify-between flex-wrap justify-center items-center md:items-start">
              {homeAnalyticsCardData.map((card) => (
                <HomeAnalyticsCard key={card.id} card={card} />
              ))}
            </div>
          </div>
          {/* Stuff to do 1 */}
          <div className="mt-20 lg:mt-28 flex flex-col lg:flex-row lg:align-center lg:justify-between gap-14 lg:gap-4">
            <div className="w-full">
              <h3 className="text-lg font-cabin font-bold text-black">Stuff to do</h3>
              <div className="flex flex-col gap-4 border border-[#00000026] bg-[#F7F7F7] px-4 py-3 lg:px-8 lg:py-7 rounded-[10px] mt-5">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">You have 10 orders to ship today!</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">10 of your products are disabled!</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">You have 7 return requests</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">You have 33 unread messages!</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">55 products are sold out</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">55 products are sold out</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
              </div>
            </div>
            {/* Stuff to do 2 */}
            <div className="w-full">
              {/* Top 3 selling products */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-cabin font-bold text-black">Your top 3 selling products</h3>
                <button className="text-sm font-cabin font-normal  rounded-[7.8px] px-4 py-2 bg-[#05031F] text-white ">View all</button>
              </div>
              <div className="flex flex-col gap-4 border border-[#00000026] bg-[#F7F7F7] px-4 py-3 lg:px-8 lg:py-7 rounded-[10px] mt-5">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">You have 10 orders to ship today!</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">10 of your products are disabled!</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">You have 7 return requests</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">You have 33 unread messages!</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">55 products are sold out</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-cabin font-normal text-[#05031F] max-w-[200px]">55 products are sold out</p>
                  <button className="text-sm font-cabin font-normal text-[#05031F] border border-[#05031F] rounded-[7.8px] px-4 py-2 hover:bg-[#05031F] hover:text-white transition-all duration-300 ease-in-out">Check it</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
