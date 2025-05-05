import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface ToastWithProgressProps {
  message: string;
  description?: string;
  duration?: number;
}

export const toastWithProgress = ({ 
  message, 
  description, 
  duration = 2000 
}: ToastWithProgressProps) => {
  let progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + 1, 100);
    if (progress === 100) {
      clearInterval(interval);
    }
  }, duration / 100);

  return toast(message, {
    description,
    duration,
    unstyled: true,
    className: 'bg-white p-4 rounded-lg shadow-lg border border-gray-200',
    descriptionClassName: 'text-gray-600 text-sm mt-1',
  });
};

export const toastError = (message: string, description?: string) => {
  return toast.error(message, {
    description,
    unstyled: true,
    className: 'bg-white p-4 rounded-lg shadow-lg border-l-4 border-red-500',
    descriptionClassName: 'text-gray-600 text-sm mt-1',
  });
};

export const toastSuccess = (message: string, description?: string) => {
  return toast.success(message, {
    description,
    unstyled: true,
    className: 'bg-white p-4 rounded-lg shadow-lg border-l-4 border-green-500',
    descriptionClassName: 'text-gray-600 text-sm mt-1',
  });
};
