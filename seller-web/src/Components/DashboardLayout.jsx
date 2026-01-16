import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import SideBarNav from '@/Components/ui/DashboardHomepageUi/SidebarNavV2';
import ScrollToTop from '../Utilities/ScrollToTop';
import Header from '../Components/ui/Header/Header';

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

  const displayScreenMode = () => {
    if (fullScreenMode) {
      return "scroll-container relative h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden";
    } else {
      return "scroll-container relative bg-[#F7FAFC] h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-600";
    }
  }

  return (
    <>
      <ScrollToTop />
      <main className="flex h-screen w-dvh">
        {/* Sidebar */}
        <SideBarNav
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          hideSidebar={hideSidebar}
        />

        {/* Main Content */}
        <div className={`flex-1 ${displayScreenMode()}`}>
          <Header
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            name={headerName}
            navName={navName}
            showBackButton={showBackButton}
            fullScreenMode={fullScreenMode}
          />
          <div className={`${fullScreenMode ? isLiveStreamPage ? '' : 'mt-[88px]' : isMessagesPage ? 'mt-[90px]' : 'mt-[88px] px-5 md:px-8'}`}>
            <Outlet context={outletContext} />
          </div>
        </div>
      </main>
    </>
  );
};

export default DashboardLayout;
