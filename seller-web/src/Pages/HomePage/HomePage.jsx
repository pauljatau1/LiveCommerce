import { useEffect, useState } from "react";
import { useAuthContext } from "../../Hooks/useAuthContext";
import { Icon } from "@iconify/react";
import { homeAnalyticsCardData, orderTempData, toDoCardTempData, suggestVideosData, platformAnnouncementData } from "../../Utilities/data";
import { Crisp } from "crisp-sdk-web";
import { useNavigate } from "react-router-dom";
import SideBarNav from "../../Components/ui/DashboardHomepageUi/SideBarNav";
import SearchBar from "../../Components/ui/DashboardHomepageUi/SearchBar";
import AlertNotification from "../../Components/ui/AlertNotification";
import HomeAnalyticsCard from "../../Components/ui/DashboardHomepageUi/HomeAnalyticsCard";
import ToDoCard from "../../Components/ToDoCard";
import QuickOrderCard from "../../Components/QuickOrderCard";
import OrdersTable from "../../Components/OrdersTable";
import SuggestedVideoCard from "../../Components/SuggestedVideoCard";
import AnnouncementCard from "../../Components/AnnouncementCard";
import { useSidebar } from '../../Hooks/useSideBar';




const HomePage = () => {
  const { seller, fetchSellerDetails } = useAuthContext();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(true);
  const { isSidebarOpen, setIsSidebarOpen } = useSidebar();

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
      <>
        {/* Search Bar */}
        <SearchBar 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />
        {/* Notification */}
        {
          notification && (
            <AlertNotification />
          )
        }

        <div>
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
                {
                  toDoCardTempData.map((card) => (
                    <ToDoCard key={card.id} card={card} />
                  ))
                }
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
                {
                  orderTempData.map((order) => (
                    <QuickOrderCard key={order.id} order={order} />
                  ))
                }
              </div>
            </div>
          </div>
          <div className="mt-20">
            <OrdersTable />
          </div>
          <div className="mt-20 bg-[#E7F7ED] rounded-[10px] px-4 py-3 lg:px-8 lg:py-7">
            <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Auqli Seller University</h1>
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
          <div className="mt-20">
            <h1 className="text-lg font-lexend font-bold text-[#05031F] mb-2">Platform Announcements</h1>
            <div className="flex flex-col mt-4 bg-[#0BB2481A] " >
              {
                platformAnnouncementData.map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))
              }
            </div>
          </div>
        </div>
      </>
  )
}

export default HomePage
