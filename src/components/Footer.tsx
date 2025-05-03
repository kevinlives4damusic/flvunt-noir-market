import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t">
      <div className="flvunt-container py-8">
        <div className="flex justify-center items-center mb-4">
          <Link to="/" className="text-2xl font-bold tracking-wider font-['Bebas_Neue',_sans-serif]">
            FLVUNT
          </Link>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">© 2025 FLVUNT. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
