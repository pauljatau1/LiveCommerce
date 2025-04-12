import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider } from '@/context/sidebarContext';

function MainLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex pt-16"> {/* Added pt-16 to account for fixed navbar height */}
          <Sidebar />
          <main className="flex-1 p-6 md:ml-64">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default MainLayout;
