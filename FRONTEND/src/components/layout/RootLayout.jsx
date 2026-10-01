import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ChatWidget from '../chat/ChatWidget';

const RootLayout = () => {
   return (
      <div className="min-h-screen bg-background text-primary-text font-sans">
         <Navbar />
         <main>
            <Outlet />
         </main>
         <ChatWidget />
      </div>
   );
};

export default RootLayout;

