// components/common/Footer.tsx
import React from 'react';

const Footer: React.FC = () => (
  <footer className="bg-gray-800 text-white py-6">
    <div className="container mx-auto text-center">
      <p className="text-sm">&copy; {new Date().getFullYear()} Arabic Jyothisham. All rights reserved.</p>
      <div className="mt-2 space-x-4">
        <a href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200">
          Terms
        </a>
        <a href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">
          Privacy
        </a>
        <a href="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">
          Contact
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;