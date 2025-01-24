import { Outlet, useNavigation } from 'react-router-dom';
import { useState } from 'react';
import SideBarNav from '../Components/ui/DashboardHomepageUi/SideBarNav';
import Loader from './Loader';

const LiveStreamLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading'

  return (
    <div className="flex h-screen w-dvh">
      {/* Main Content */}
      <>
        <div className="relative pb-7 lg:pb-14  h-full w-full overflow-y-scroll [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
        </div>
      </>
    </div>
  );
};

export default LiveStreamLayout;
