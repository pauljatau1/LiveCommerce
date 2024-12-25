import { Outlet, useNavigation } from 'react-router-dom';
import { useState } from 'react';
import SideBarNav from '../Components/ui/DashboardHomepageUi/SideBarNav';
import Loader from './Loader';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading'

  return (
    <div className="flex h-screen w-dvh">
      {/* Sidebar */}
      <SideBarNav
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <>
        {isLoading && <Loader />}
        <div className="pl-[20px] relative pr-[20px] md:pl-[42px] md:pr-[28px] pb-7 lg:pb-14  h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
        </div>
      </>
    </div>
  );
};

export default DashboardLayout;
