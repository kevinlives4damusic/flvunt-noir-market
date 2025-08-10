import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const AuthCallback = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirectTo') || '/?section=new-arrivals';
        window.history.replaceState(null, '', window.location.pathname);
        navigate(redirectTo, { replace: true });
      } else {
        toast.error('Authentication failed. Please login again.');
        navigate('/login', { replace: true });
      }
    }
  }, [user, isLoading, location.search, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-black" />
    </div>
  );
};

export default AuthCallback;