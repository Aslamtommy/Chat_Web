import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-100 flex flex-col">
    <Navbar />
    <main className="container mx-auto p-6 flex-grow">{children}</main>
    <Footer />
  </div>
);

export default Layout;