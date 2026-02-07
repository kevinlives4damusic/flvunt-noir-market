import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
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
import PaymentSuccess from "./pages/PaymentSuccess";
import ProductPage from "./pages/ProductPage";
import PaymentCancel from "./pages/PaymentCancel";
import PaymentFailure from "./pages/PaymentFailure";
import Contact from "./pages/Contact";
import Likes from "./pages/Likes";
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import PaymentDetail from './pages/admin/PaymentDetail';
import OrderDetail from './pages/admin/OrderDetail';
import AuthCallback from "./components/auth/AuthCallback";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useState } from 'react'
import './App.css'

// Create QueryClient for React Query
const queryClient = new QueryClient();

const App = () => {
  // Removed Yoco-specific state

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <TooltipProvider>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-black"></div>
            </div>
          }>
            <AuthProvider>
              <CartProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cart" element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  } />
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment" element={
                    <ProtectedRoute>
                      <Payment />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment-success" element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment-cancel" element={
                    <ProtectedRoute>
                      <PaymentCancel />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment-failure" element={
                    <ProtectedRoute>
                      <PaymentFailure />
                    </ProtectedRoute>
                  } />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/hoodies" element={<Hoodies />} />
                  <Route path="/shirts" element={<Shirts />} />
                  <Route path="/truckers" element={<Truckers />} />
                  <Route path="/product/:id" element={<ProductPage />} />
                  <Route path="/likes" element={<Likes />} />
                  <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                  <Route path="/admin/payments/:id" element={<ProtectedRoute><PaymentDetail /></ProtectedRoute>} />
                  <Route path="/admin/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </CartProvider>
            </AuthProvider>
          </Suspense>
        </TooltipProvider>
      </Router>
    </QueryClientProvider>
  )
};

export default App;
