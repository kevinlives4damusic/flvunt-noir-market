import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { CartContext } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Check, Heart, Minus, Plus, Share2, ShieldCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import LikeButton from '@/components/LikeButton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id || '');
  const { addToCart, isAuthenticated } = useContext(CartContext);
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        quantity: quantity,
        size: selectedSize
      });
      toast.success("Added to cart");
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flvunt-container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="h-[500px] w-full rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <Button onClick={() => navigate('/products')}>Browse Products</Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Generate sizes if not available in product data
  const sizes = product.available_sizes || ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-grow pt-8 pb-16">
        <div className="flvunt-container">
          <div className="mb-6">
            <Link to="/products" className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Product Image */}
            <div className="relative">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute top-4 right-4 z-10">
                <LikeButton productId={product.id} />
              </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="border-b pb-6 mb-6">
                <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">{product.category || 'Apparel'} / {product.designer || 'FLVUNT'}</p>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
                <div className="flex items-end gap-4">
                  <p className="text-2xl font-medium">R {product.price.toFixed(2)}</p>
                  {product.in_stock ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-1">
                      In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mb-1">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                {/* Size Selector */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-gray-900">Select Size</label>
                    <button className="text-sm text-gray-500 underline hover:text-black">Size Guide</button>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 text-sm font-medium rounded-md border transition-all ${
                          selectedSize === size
                            ? 'border-black bg-black text-white shadow-md'
                            : 'border-gray-200 text-gray-900 hover:border-gray-400 bg-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity & Add to Cart */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center border border-gray-300 rounded-md w-32">
                    <button 
                      onClick={() => handleQuantityChange(-1)}
                      className="px-3 py-3 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex-1 text-center font-medium">{quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(1)}
                      className="px-3 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button 
                    onClick={handleAddToCart}
                    className="flex-1 py-6 text-base flvunt-button"
                    disabled={!product.in_stock}
                  >
                    {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-full">
                      <Truck className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Free Shipping</p>
                      <p className="text-xs text-gray-500">On orders over R1000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-full">
                      <ShieldCheck className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Secure Payment</p>
                      <p className="text-xs text-gray-500">100% secure checkout</p>
                    </div>
                  </div>
                </div>

                {/* Description Accordion */}
                <Accordion type="single" collapsible className="w-full" defaultValue="description">
                  <AccordionItem value="description">
                    <AccordionTrigger>Description</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose prose-sm max-w-none text-gray-600">
                        <p>{product.description || "No description available for this product."}</p>
                        <p className="mt-4">
                          Designed for comfort and style, this piece features high-quality materials and our signature FLVUNT branding. Perfect for everyday wear.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="materials">
                    <AccordionTrigger>Materials & Care</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>100% Cotton</li>
                        <li>Machine wash cold</li>
                        <li>Do not bleach</li>
                        <li>Tumble dry low</li>
                        <li>Iron on low heat</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="shipping">
                    <AccordionTrigger>Shipping & Returns</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-gray-600">
                        We offer nationwide shipping. Orders are typically processed within 1-2 business days. Returns are accepted within 30 days of purchase, provided the item is in its original condition.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductPage;
