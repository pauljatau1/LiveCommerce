import {REVIEWED_WITHDRAWALS} from '@/config/withdrawals';
import { Outlet,useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import PageGuard from '@/components/common/PageGuard';
import Sidebar from './Sidebar';
import { SidebarProvider } from '@/context/sidebarContext';

function MainLayout() {
  const location=useLocation();
  if(REVIEWED_WITHDRAWALS && location.pathname.replace(/\/+$/,'')==='/dashboard/withdrawals')return <Outlet/>;
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex pt-16"> {/* Added pt-16 to account for fixed navbar height */}
          <Sidebar />
          <main className="flex-1 min-w-0 p-4 sm:p-6 md:ml-64">
            <PageGuard><Outlet /></PageGuard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default MainLayout;
