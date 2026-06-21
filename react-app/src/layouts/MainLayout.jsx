import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import BottomNav from '../components/layout/BottomNav';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main content: offset for TopBar (pt-14), Sidebar on desktop (md:pl-64), BottomNav on mobile (pb-20) */}
      <main className="pt-14 pb-20 md:pb-6 md:pl-64 min-h-screen">
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MainLayout;