import React from 'react';
import Navbar from '../components/common/Navbar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-100">
    <Navbar />
    <main className="container mx-auto p-6">{children}</main>
  </div>
);

export default Layout;