
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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

const CartContext = createContext<CartContextType>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isAuthenticated: false,
  userEmail: null,
  logout: async () => {}
});

const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        setUserEmail(session?.user?.email ?? null);
        
        if (session) {
          localStorage.setItem('supabase_session', JSON.stringify(session));
        } else {
          localStorage.removeItem('supabase_session');
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        setUserEmail(session?.user?.email ?? null);

        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
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
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Error signing out', { description: error.message });
      } else {
        // Restore cart items after logout instead of clearing them
        setItems(cartItems);
        // Update localStorage with the preserved cart
        localStorage.setItem('cart', JSON.stringify(cartItems));
        navigate('/');
        toast.success('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An error occurred while logging out');
    }
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
      isAuthenticated,
      userEmail,
      logout 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export { CartContext, CartProvider };
export default CartProvider;
