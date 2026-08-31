import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const RootLayout = () => {
   return (
      <div className="min-h-screen bg-background text-primary-text font-sans">
         <Navbar />
         <main>
            <Outlet />
         </main>
      </div>
   );
};

export default RootLayout;

