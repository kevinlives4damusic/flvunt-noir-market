export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url: string;
  category: string;
  designer: string;
  available_sizes?: string[];
  in_stock: boolean;
  created_at?: string;
  updated_at?: string;
}

export const localProducts: Product[] = [
  // Hoodies
  {
    id: "1",
    name: 'VETEMENTS PAR FLVUNT® HOODIE',
    price: 900,
    description: "Premium quality apparel by FLVUNT",
    image_url: '/images/hoodies/image1.jpg',
    category: 'hoodies',
    designer: 'FLVUNT BASICS',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "2",
    name: 'VETEMENTS PAR FLVUNT® HOODIE',
    price: 900,
    description: "Premium quality apparel by FLVUNT",
    image_url: '/images/hoodies/image2.jpg',
    category: 'hoodies',
    designer: 'FLVUNT BASICS',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "3",
    name: 'VETEMENTS PAR FLVUNT® HOODIE',
    price: 900,
    description: "Premium quality apparel by FLVUNT",
    image_url: '/images/hoodies/image3.jpg',
    category: 'hoodies',
    designer: 'FLVUNT BASICS',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "4",
    name: 'VETEMENTS PAR FLVUNT® HOODIE',
    price: 450,
    description: "Premium quality apparel by FLVUNT",
    image_url: '/images/hoodies/image4.jpg',
    category: 'hoodies',
    designer: 'FLVUNT BASICS',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  // Shirts
  {
    id: "5",
    name: 'Graphic T-Shirt "Spray Tag"',
    price: 800,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image1.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "6",
    name: 'Graphic T-Shirt "Spray Tag"',
    price: 800,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image2.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "7",
    name: 'Graphic T-Shirt "Spray Tag"',
    price: 800,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image3.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "8",
    name: 'FLVUNT Graphic T-Shirt "Eagle"',
    price: 500,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image4.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "9",
    name: 'Masque de ski 2.0',
    price: 500,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image5.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "10",
    name: 'FLVUNT Plain Print T',
    price: 350,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image6.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "11",
    name: 'Masque de ski',
    price: 400,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image7.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "12",
    name: 'Masque de ski',
    price: 400,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image8.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "13",
    name: 'FLVUNT Plain Print T',
    price: 350,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image9.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: "14",
    name: 'FLVUNT Graphic T-Shirt',
    price: 450,
    description: "Premium quality street style shirt with modern design.",
    image_url: '/images/shirts/image10.jpg',
    category: 'shirts',
    designer: 'FLVUNT',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL']
  }
];

export const getLocalProduct = (id: string) => localProducts.find(p => p.id === id);
export const getLocalProductsByCategory = (category: string) => localProducts.filter(p => p.category === category);
