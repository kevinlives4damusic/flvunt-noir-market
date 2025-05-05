
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Suspense } from 'react';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import Hoodies from "./pages/Hoodies";
import Shirts from "./pages/Shirts";
import Truckers from "./pages/Truckers";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PaymentFailure from "./pages/PaymentFailure";
import Contact from "./pages/Contact";
import Likes from "./pages/Likes";
import CartProvider from "./context/CartContext";
import { useState } from 'react'
import './App.css'

// Create QueryClient for React Query
const queryClient = new QueryClient();

const App = () => {
  const [isYocoLoading, setIsYocoLoading] = useState(false);
  const [yocoError, setYocoError] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <TooltipProvider>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-black"></div>
            </div>
          }>
            <CartProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancel" element={<PaymentCancel />} />
                <Route path="/payment-failure" element={<PaymentFailure />} />
                <Route path="/hoodies" element={<Hoodies />} />
                <Route path="/shirts" element={<Shirts />} />
                <Route path="/truckers" element={<Truckers />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/likes" element={<Likes />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </Suspense>
        </TooltipProvider>
      </HashRouter>
    </QueryClientProvider>
  )
};

export default App;
