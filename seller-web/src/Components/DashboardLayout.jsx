import { Outlet, useNavigation } from 'react-router-dom';
import { useState } from 'react';
import SideBarNav from '../Components/ui/DashboardHomepageUi/SideBarNav';
import ScrollToTop from '../Utilities/ScrollToTop';
import Header from '../Components/ui/Header/Header';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [headerName, setHeaderName] = useState('');
  const [navName, setNavName] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading'

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
    showHeader,
    setShowHeader
  };

  console.log('Outlet context:', outletContext); // Debug log

  const displayScreenMode = () => {
    if (fullScreenMode) {
      return "relative h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
    } else {
      return "relative bg-[#F7FAFC] h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
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
          <Header
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            name={headerName}
            navName={navName}
            showHeader={showHeader}
          />
          <div className={`${fullScreenMode ? '' : 'pl-[20px] pr-[20px] md:pl-[42px] md:pr-[28px] pb-7 lg:pb-14'}`} >
            <Outlet context={outletContext} />
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
