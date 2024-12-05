import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex pt-16"> {/* Added pt-16 to account for fixed navbar height */}
        <Sidebar />
        <main className="flex-1 ml-64 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
