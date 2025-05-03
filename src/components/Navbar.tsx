
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Heart, ShoppingBag, Menu, X, Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Main navbar with frosted glass effect */}
      <div className="w-full fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-white/70 border-b border-gray-200/50 shadow-sm">
        <div className="flvunt-container py-4">
          <div className="flex justify-between items-center">
            {/* Mobile menu button */}
            <div className="block md:hidden">
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                {mobileMenuOpen ? <X /> : <Menu />}
              </Button>
            </div>
            
            {/* Login Button for desktop */}
            <div className="hidden md:flex flex-1 items-center">
              <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                <Link to="/login">
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </Button>
            </div>

            {/* Logo */}
            <div className="flex-1 md:flex-none text-center">
              <Link to="/" className="text-2xl font-bold tracking-wider font-['Bebas_Neue',_sans-serif] text-3xl md:text-4xl">FLVUNT</Link>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-4 flex-1 justify-end">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/login">
                  <User className="h-5 w-5 md:hidden" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/cart">
                  <ShoppingBag className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Simplified Categories Menu */}
          <div className="hidden md:flex justify-center space-x-12 mt-4 border-b border-t py-3 border-flvunt-grey/30">
            <Link to="/shirts" className="text-sm font-medium hover:text-gray-500">SHIRTS</Link>
            <Link to="/hoodies" className="text-sm font-medium hover:text-gray-500">HOODIES</Link>
            <Link to="/truckers" className="text-sm font-medium hover:text-gray-500">TRUCKERS</Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-[60px] left-0 w-full bg-white/90 backdrop-blur-md z-50 p-4 shadow-lg border-t md:hidden">
            <div className="flex flex-col space-y-4">
              <Link to="/shirts" className="text-sm font-medium py-2 border-b">SHIRTS</Link>
              <Link to="/hoodies" className="text-sm font-medium py-2 border-b">HOODIES</Link>
              <Link to="/truckers" className="text-sm font-medium py-2 border-b">TRUCKERS</Link>
              
              <Button variant="outline" size="sm" className="flex items-center justify-center gap-2 w-full mt-2" asChild>
                <Link to="/login">
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation with frosted glass effect */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-white/70 border-t border-gray-200/50 shadow-t-sm">
        <div className="flex justify-around items-center py-3">
          <Link to="/" className="flex flex-col items-center">
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/shirts" className="flex flex-col items-center">
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Browse</span>
          </Link>
          <Link to="/cart" className="flex flex-col items-center">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-xs mt-1">Cart</span>
          </Link>
          <Link to="/login" className="flex flex-col items-center">
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Account</span>
          </Link>
        </div>
      </div>

      {/* Empty div for spacing to account for fixed navbar */}
      <div className="h-24"></div>
    </>
  );
};

export default Navbar;
