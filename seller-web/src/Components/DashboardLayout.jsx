import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import SideBarNav from '@/Components/ui/DashboardHomepageUi/SidebarNavV2';
import ScrollToTop from '../Utilities/ScrollToTop';
import HeaderV2 from '@/Components/ui/Header/HeaderV2';
import { useNotification } from '@/Hooks/useNotification';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [headerName, setHeaderName] = useState('');
  const [navName, setNavName] = useState('');
  const [showBackButton, setShowBackButton] = useState(true);
  // const navigation = useNavigation();
  // const isLoading = navigation.state === 'loading'

  // Create an object with the context values
  const outletContext = {
    isSidebarOpen,
    setIsSidebarOpen,
    hideSidebar,
    setHideSidebar,
    fullScreenMode,
    setFullScreenMode,
    headerName,
    setHeaderName,
    navName,
    setNavName,
    showBackButton,
    setShowBackButton
  };

  console.log('Outlet context:', outletContext); // Debug log

  // Get current location to check if we're on messages page
  const location = useLocation();
  const isMessagesPage = location.pathname.includes('/messages');
  const isLiveStreamPage = location.pathname.includes('/live-stream-studio');
  const { notification } = useNotification();

  const displayScreenMode = () => {
    if (fullScreenMode) {
      return "scroll-container relative h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden";
    } else {
      return "scroll-container relative bg-[#F7FAFC] w-full ";
    }
  }

  return (
    <>
      <ScrollToTop />
      <main className="flex h-screen overflow-y-hidden ">
        {/* Sidebar */}
        <SideBarNav
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          hideSidebar={hideSidebar}
        />

        {/* Main Content */}
        <div className={`min-w-[calc(100%-300px)] ${displayScreenMode()} flex flex-col min-h-0`}>
          <HeaderV2
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            name={headerName}
            navName={navName}
            showBackButton={showBackButton}
            fullScreenMode={fullScreenMode}
          />
          <div className={`flex-1 min-h-0 bg-[#F7FAFC] overflow-y-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-600
              ${fullScreenMode ? (
              isLiveStreamPage ? '' : 'mt-[88px]'
            ) : (
              isMessagesPage ? (
                ` ${notification.isVisible && notification.type ? 'mt-[160px]' : 'mt-[110px] lg:mt-[50px] '}`
              ) : (
                location?.pathname !== "/dashboard/home" ? (
                  `${notification.isVisible && notification.type ? 'mt-[150px]' : 'mt-[110px] lg:mt-[100px] '} px-5 md:px-8 pb-0`
                ) : (
                  `${notification.isVisible && notification.type ? 'mt-[100px] lg:mt-[140px]' : 'mt-[85px] lg:mt-[100px] '} px-5 md:px-8 pb-0`
                ))
            )}`}>
            <Outlet context={outletContext} />
          </div>
        </div>
      </main>
    </>
  );
};

export default DashboardLayout;
