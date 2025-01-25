import { Outlet, useNavigation } from 'react-router-dom';
import { useState } from 'react';
import SideBarNav from '../Components/ui/DashboardHomepageUi/SideBarNav';
import Loader from './Loader';
import ScrollToTop from '../Utilities/ScrollToTop';
import { useOutletContext } from 'react-router-dom';

const LiveStreamLayout = () => {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading'
  const { isSidebarOpen, setIsSidebarOpen, hideSidebar, setHideSidebar, fullScreenMode, setFullScreenMode } = useOutletContext();

  const displayScreenMode = () => {
    if (fullScreenMode) {
      return "relative  h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    } else {
      return "relative pb-7 lg:pb-14  h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    }
  }

  return (
    <div className="flex h-screen w-dvh">
      {/* Main Content */}
      <>
        <ScrollToTop />
        <div className={displayScreenMode()}>
          <Outlet context={{ isSidebarOpen, setIsSidebarOpen, hideSidebar, setHideSidebar, fullScreenMode, setFullScreenMode }} />
        </div>
      </>
    </div>
  );
};

export default LiveStreamLayout;
