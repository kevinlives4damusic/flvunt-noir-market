
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Info } from 'lucide-react';

interface SizePickerProps {
  sizes?: string[];
  onChange?: (size: string) => void;
  className?: string;
}

export const SizePicker: React.FC<SizePickerProps> = ({ 
  sizes = ['S', 'M', 'L', 'XL'], 
  onChange,
  className
}) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    if (onChange) onChange(size);
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-sm">Select Size</h4>
        <HoverCard>
          <HoverCardTrigger>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Size Guide</h4>
              <div className="text-sm">
                <p><strong>S:</strong> Chest 36-38" | Waist 30-32"</p>
                <p><strong>M:</strong> Chest 38-40" | Waist 32-34"</p>
                <p><strong>L:</strong> Chest 40-42" | Waist 34-36"</p>
                <p><strong>XL:</strong> Chest 42-44" | Waist 36-38"</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
      <div className="flex gap-2">
        {sizes.map((size) => (
          <button 
            key={size}
            className={cn(
              "w-10 h-10 border flex items-center justify-center transition-colors",
              selectedSize === size 
                ? "border-flvunt-black bg-flvunt-black text-white font-medium" 
                : "border-gray-300 hover:border-gray-800"
            )}
            onClick={() => handleSizeChange(size)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizePicker;
