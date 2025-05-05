import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  name: string;
  price: number; // in cents
  description: string;
  image_url: string;
  category: string;
}

const products: Product[] = [
  // Shirts
  {
    name: 'Graphic T-Shirt "Spray Tag"',
    price: 80000, // R800.00
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image1.jpg",
    category: "shirts"
  },
  {
    name: 'Graphic T-Shirt "Spray Tag"',
    price: 80000,
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image2.jpg",
    category: "shirts"
  },
  {
    name: 'Graphic T-Shirt "Spray Tag"',
    price: 80000,
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image3.jpg",
    category: "shirts"
  },
  {
    name: 'FLVUNT Graphic T-Shirt "Eagle"',
    price: 50000, // R500.00
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image4.jpg",
    category: "shirts"
  },
  {
    name: 'Masque de ski 2.0',
    price: 50000,
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image5.jpg",
    category: "shirts"
  },
  {
    name: 'FLVUNT Plain Print T',
    price: 35000, // R350.00
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image6.jpg",
    category: "shirts"
  },
  {
    name: 'Masque de ski',
    price: 40000, // R400.00
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image7.jpg",
    category: "shirts"
  },
  {
    name: 'Masque de ski',
    price: 40000,
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image8.jpg",
    category: "shirts"
  },
  {
    name: 'FLVUNT Plain Print T',
    price: 35000,
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image9.jpg",
    category: "shirts"
  },
  {
    name: 'FLVUNT Graphic T-Shirt',
    price: 45000, // R450.00
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image10.jpg",
    category: "shirts"
  },
  {
    name: 'FLVUNT Graphic T-Shirt',
    price: 45000,
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image11.jpg",
    category: "shirts"
  },
  {
    name: 'FLVUNT Graphic T-Shirt',
    price: 45000,
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image12.jpg",
    category: "shirts"
  },
  {
    name: 'FLVUNT Graphic T-Shirt',
    price: 45000,
    description: "Premium quality street style shirt with modern design.",
    image_url: "/images/shirts/image13.jpg",
    category: "shirts"
  },

  // Hoodies
  {
    name: 'VETEMENTS PAR FLVUNT® HOODIE',
    price: 90000, // R900.00
    description: "Premium quality apparel by FLVUNT",
    image_url: "/images/hoodies/image1.jpg",
    category: "hoodies"
  },
  {
    name: 'VETEMENTS PAR FLVUNT® HOODIE',
    price: 90000,
    description: "Premium quality apparel by FLVUNT",
    image_url: "/images/hoodies/image2.jpg",
    category: "hoodies"
  },
  {
    name: 'VETEMENTS PAR FLVUNT® HOODIE',
    price: 90000,
    description: "Premium quality apparel by FLVUNT",
    image_url: "/images/hoodies/image3.jpg",
    category: "hoodies"
  },
  {
    name: 'VETEMENTS PAR FLVUNT® HOODIE',
    price: 45000, // R450.00
    description: "Premium quality apparel by FLVUNT",
    image_url: "/images/hoodies/image4.jpg",
    category: "hoodies"
  }
];

async function seedProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .upsert(products, { 
        onConflict: 'name,image_url',
        ignoreDuplicates: false 
      });

    if (error) {
      throw error;
    }

    console.log('Products seeded successfully:', data);
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

seedProducts();