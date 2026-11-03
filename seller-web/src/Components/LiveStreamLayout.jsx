import { Outlet, useNavigation } from 'react-router-dom';
import { useState } from 'react';
import SideBarNav from '../Components/ui/DashboardHomepageUi/SideBarNav';
import Loader from './Loader';
import ScrollToTop from '../Utilities/ScrollToTop';
import { useOutletContext } from 'react-router-dom';

const LiveStreamLayout = () => {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading'
  const { isSidebarOpen, setIsSidebarOpen, hideSidebar, setHideSidebar, fullScreenMode, setFullScreenMode, setHeaderName, setNavName, showBackButton, setShowBackButton } = useOutletContext();

  const displayScreenMode = () => {
    if (fullScreenMode) {
      return "relative  h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    } else {
      return "relative w-full"
    }
  }

  return (
    <>
      <div className="flex h-screen w-dvh">
        <ScrollToTop />
        {/* Main Content */}

        <div className={displayScreenMode()}>
          <Outlet context={{ isSidebarOpen, setIsSidebarOpen, hideSidebar, setHideSidebar, fullScreenMode, setFullScreenMode, setHeaderName, setNavName, showBackButton, setShowBackButton }} />
        </div>
      </div>
    </>
  );
};

export default LiveStreamLayout;
