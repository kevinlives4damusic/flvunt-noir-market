import React, { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string | number, size: string) => void;
  updateQuantity: (id: string | number, size: string, newQuantity: number) => void;
  clearCart: () => void;
  isAuthenticated: boolean;
  userEmail: string | null;
  logout: () => Promise<void>;
}

export const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isAuthenticated: false,
  userEmail: null,
  logout: async () => {}
});

// Named export for the provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const initializeCart = async () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Cart initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeCart();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) => i.id === item.id && i.size === item.size
      );
      
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id && i.size === item.size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string | number, size: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setItems((prevItems) => 
      prevItems.map((item) =>
        item.id === id && item.size === size
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (id: string | number, size: string) => {
    setItems((prevItems) => 
      prevItems.filter((item) => !(item.id === id && item.size === size))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const logout = async () => {
    // Save cart items before logout
    const cartItems = [...items];
    
    await signOut();
    
    // Restore cart items after logout
    setItems(cartItems);
    localStorage.setItem('cart', JSON.stringify(cartItems));
    toast.success('Logged out successfully');
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart,
      updateQuantity,
      clearCart,
      isAuthenticated: !!user,
      userEmail: user?.email ?? null,
      logout 
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Named export for the hook
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
