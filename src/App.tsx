import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import Hoodies from "./pages/Hoodies";
import Shirts from "./pages/Shirts";
import Truckers from "./pages/Truckers";
import CartProvider from "./context/CartContext";
import { useState } from 'react'
import './App.css'

// Create QueryClient for React Query
const queryClient = new QueryClient();

const App = () => {
  const [isYocoLoading, setIsYocoLoading] = useState(false);
  const [yocoError, setYocoError] = useState<string | null>(null);

  // --- Yoco Payment Logic --- 
  const handleYocoPayment = async () => {
    setIsYocoLoading(true);
    setYocoError(null);

    const paymentDetails = {
      amountInCents: 500, // Example: R5.00 (must be >= 200)
      currency: 'ZAR',
      // You can add successUrl, cancelUrl etc. here if needed
      metadata: { orderId: 'DEV_TEST_123' }
    };

    try {
      console.log('Sending request to /api/create-yoco-checkout');
      const response = await fetch('/api/create-yoco-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentDetails),
      });

      console.log('Received response from /api/create-yoco-checkout', response.status);
      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', result);
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.redirectUrl) {
        console.log('Redirecting to Yoco checkout:', result.redirectUrl);
        window.location.href = result.redirectUrl;
        // Page navigates away, no need to reset loading state here
      } else {
        console.error('API Success Response but no redirectUrl:', result);
        throw new Error('No redirectUrl received from server.');
      }

    } catch (err: any) {
      console.error('handleYocoPayment failed:', err);
      setYocoError(err.message || 'Failed to initiate Yoco payment. Check console.');
      setIsYocoLoading(false);
    }
  };
  // --- End Yoco Payment Logic ---

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CartProvider>
          {/* --- TEMPORARY Yoco Test Button --- */} 
          <div style={{ border: '2px dashed red', padding: '10px', margin: '10px', textAlign: 'center' }}>
            <button onClick={handleYocoPayment} disabled={isYocoLoading} style={{ padding: '10px 20px', fontSize: '16px' }}>
              {isYocoLoading ? 'Processing Yoco...' : 'TEST Yoco Payment (R5.00)'}
            </button>
            {yocoError && <p style={{ color: 'red', marginTop: '10px' }}>Error: {yocoError}</p>}
             <p style={{ fontSize: '0.8em', color: 'orange', marginTop: '5px' }}>
               (Uses Dev Server API - NOT FOR PRODUCTION)
             </p>
          </div>
          {/* --- End TEMPORARY Yoco Test Button --- */} 

          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/hoodies" element={<Hoodies />} />
              <Route path="/shirts" element={<Shirts />} />
              <Route path="/truckers" element={<Truckers />} />
              {/* You can add more routes here as needed */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
};

export default App;
