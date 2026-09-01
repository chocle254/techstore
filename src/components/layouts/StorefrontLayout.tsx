import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header, CategorySidebar, MobileBottomNav } from './Header';

export function StorefrontLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header
        showSidebar
        sidebarOpen={sidebarOpen}
        onSidebarToggle={() => setSidebarOpen(prev => !prev)}
      />
      <div className="flex flex-1 min-w-0">
        <CategorySidebar isOpen={sidebarOpen} />
        <main className="flex-1 min-w-0 overflow-x-hidden pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
