import { Outlet, useNavigation } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import SideBarNav from '../Components/ui/DashboardHomepageUi/SideBarNav';
import Loader from './Loader';
import ScrollToTop from '../Utilities/ScrollToTop';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading'

  // Create an object with the context values
  const outletContext = {
    isSidebarOpen,
    setIsSidebarOpen,
    hideSidebar,
    setHideSidebar,
    fullScreenMode,
    setFullScreenMode
  };

  console.log('Outlet context:', outletContext); // Debug log

  const displayScreenMode = () => {
    if (fullScreenMode) {
      return "relative h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    } else {
      return "pl-[20px] relative pr-[20px] md:pl-[42px] md:pr-[28px] pb-7 lg:pb-14  h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    }
  }

  return (
    <>
      <ScrollToTop />
      <div className="flex h-screen w-dvh">
        {/* Sidebar */}
        <SideBarNav
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          hideSidebar={hideSidebar}
        />

        {/* Main Content */}
        <div className={displayScreenMode()}>
          <Outlet context={outletContext} />
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
