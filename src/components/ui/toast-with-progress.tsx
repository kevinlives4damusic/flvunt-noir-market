
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface ToastWithProgressProps {
  message: string;
  description?: string;
  duration?: number;
}

export const toastWithProgress = ({ message, description, duration = 4000 }: ToastWithProgressProps) => {
  const toastId = toast(message, {
    description,
    duration,
    render: ({ id }) => {
      const [progress, setProgress] = useState(0);
      
      useEffect(() => {
        const timer = setTimeout(() => {
          const interval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 100) {
                clearInterval(interval);
                return 100;
              }
              return prev + 2;
            });
          }, duration / 50);
          
          return () => clearInterval(interval);
        }, 100);
        
        return () => clearTimeout(timer);
      }, []);
      
      return (
        <div className="w-full space-y-2">
          <div>{message}</div>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <Progress value={progress} className="h-1" />
        </div>
      );
    }
  });
  
  return toastId;
};
