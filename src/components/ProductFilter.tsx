
import React from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProductFilterProps {
  currentCategory: string;
  currentSort: string;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  currentCategory,
  currentSort,
  onCategoryChange,
  onSortChange
}) => {
  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'shirts', name: 'Shirts' },
    { id: 'hoodies', name: 'Hoodies' },
    { id: 'truckers', name: 'Truckers' },
  ];

  const sortOptions = [
    { id: 'newest', name: 'Newest' },
    { id: 'price-low', name: 'Price: Low to High' },
    { id: 'price-high', name: 'Price: High to Low' },
    { id: 'name-asc', name: 'Name: A-Z' },
    { id: 'name-desc', name: 'Name: Z-A' },
  ];

  return (
    <Card className="p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <p className="text-xs text-gray-500 mb-2">Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`px-3 py-1 text-sm rounded-full ${
                  currentCategory === category.id 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-2">Sort by</p>
          <select 
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="border rounded p-2 bg-white text-sm w-full md:w-auto"
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
};

export default ProductFilter;
