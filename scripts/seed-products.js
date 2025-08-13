import admin from 'firebase-admin';

// Initialize Firebase Admin using service account from env
const serviceJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var is required to seed products.');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceJson);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

const products = [
  {
    name: 'Graphic T-Shirt "Spray Tag"',
    price: 800,
    description: 'Premium quality street style shirt with modern design.',
    image_url: '/images/shirts/image1.jpg',
    category: 'shirts',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL'],
    designer: 'FLVUNT',
  },
  {
    name: 'FLVUNT Graphic T-Shirt',
    price: 450,
    description: 'Premium quality street style shirt with modern design.',
    image_url: '/images/shirts/image10.jpg',
    category: 'shirts',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL'],
    designer: 'FLVUNT',
  },
  {
    name: 'VETEMENTS PAR FLVUNT® HOODIE',
    price: 900,
    description: 'Premium quality apparel by FLVUNT',
    image_url: '/images/hoodies/image1.jpg',
    category: 'hoodies',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL'],
    designer: 'FLVUNT',
  },
  {
    name: 'FLVUNT Plain Print T',
    price: 350,
    description: 'Premium quality street style shirt with modern design.',
    image_url: '/images/shirts/image6.jpg',
    category: 'shirts',
    in_stock: true,
    available_sizes: ['S', 'M', 'L', 'XL'],
    designer: 'FLVUNT',
  },
  {
    name: 'Masque de ski',
    price: 400,
    description: 'Premium quality street style shirt with modern design.',
    image_url: '/images/shirts/image7.jpg',
    category: 'accessories',
    in_stock: true,
    available_sizes: [],
    designer: 'FLVUNT',
  },
  {
    name: 'Masque de ski 2.0',
    price: 500,
    description: 'Premium quality street style shirt with modern design.',
    image_url: '/images/shirts/image5.jpg',
    category: 'accessories',
    in_stock: true,
    available_sizes: [],
    designer: 'FLVUNT',
  },
];

function nowIso() {
  return new Date().toISOString();
}

async function seed() {
  const batch = db.batch();
  for (const p of products) {
    // Use a deterministic ID based on name + image to avoid duplicates
    const id = Buffer.from(`${p.name}|${p.image_url}`)
      .toString('base64')
      .replace(/=+$/g, '');
    const ref = db.collection('products').doc(id);
    batch.set(ref, {
      name: p.name,
      description: p.description,
      image_url: p.image_url,
      category: p.category,
      price: p.price, // in ZAR
      in_stock: p.in_stock,
      available_sizes: p.available_sizes,
      designer: p.designer,
      created_at: nowIso(),
      updated_at: nowIso(),
    }, { merge: true });
  }

  await batch.commit();
  console.log(`Seeded ${products.length} products`);
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});


