
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white pt-12 pb-6 border-t border-gray-200">
      <div className="flvunt-container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="text-sm font-medium mb-4">FLVUNT</h3>
            <p className="text-xs text-gray-600 mb-4">
              Modern, minimal fashion for those who seek quality and timeless design.
            </p>
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} FLVUNT. All rights reserved.
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-sm font-medium mb-4">SHOP</h3>
            <ul className="space-y-2">
              <li><Link to="/new" className="text-xs text-gray-600 hover:text-black">New Arrivals</Link></li>
              <li><Link to="/women" className="text-xs text-gray-600 hover:text-black">Women</Link></li>
              <li><Link to="/men" className="text-xs text-gray-600 hover:text-black">Men</Link></li>
              <li><Link to="/accessories" className="text-xs text-gray-600 hover:text-black">Accessories</Link></li>
              <li><Link to="/sale" className="text-xs text-gray-600 hover:text-black">Sale</Link></li>
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="text-sm font-medium mb-4">HELP</h3>
            <ul className="space-y-2">
              <li><Link to="/customer-care" className="text-xs text-gray-600 hover:text-black">Customer Care</Link></li>
              <li><Link to="/track-order" className="text-xs text-gray-600 hover:text-black">Track Order</Link></li>
              <li><Link to="/returns" className="text-xs text-gray-600 hover:text-black">Returns & Exchanges</Link></li>
              <li><Link to="/shipping" className="text-xs text-gray-600 hover:text-black">Shipping Info</Link></li>
              <li><Link to="/faq" className="text-xs text-gray-600 hover:text-black">FAQ</Link></li>
            </ul>
          </div>

          {/* About Links */}
          <div>
            <h3 className="text-sm font-medium mb-4">ABOUT</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-xs text-gray-600 hover:text-black">Our Story</Link></li>
              <li><Link to="/sustainability" className="text-xs text-gray-600 hover:text-black">Sustainability</Link></li>
              <li><Link to="/stores" className="text-xs text-gray-600 hover:text-black">Stores</Link></li>
              <li><Link to="/careers" className="text-xs text-gray-600 hover:text-black">Careers</Link></li>
              <li><Link to="/contact" className="text-xs text-gray-600 hover:text-black">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <div className="text-xs text-gray-500 mb-4 md:mb-0">
            <Link to="/terms" className="mr-4 hover:text-black">Terms & Conditions</Link>
            <Link to="/privacy" className="hover:text-black">Privacy Policy</Link>
          </div>
          <div className="text-xs text-gray-500">
            Payment methods: Visa, Mastercard, PayPal, Apple Pay
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
