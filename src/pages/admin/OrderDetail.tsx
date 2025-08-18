import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        auth();
        const orderSnap = await getDoc(doc(db(), 'orders', id));
        if (!orderSnap.exists()) {
          setLoading(false);
          return;
        }
        setOrder({ id: orderSnap.id, ...orderSnap.data() });
        const itemsSnap = await getDocs(collection(db(), 'orders', id, 'order_items'));
        setItems(itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-10 flvunt-container">
        <Link to="/admin" className="text-sm underline">Back to Admin</Link>
        <h1 className="text-2xl font-medium mt-2">Order {id}</h1>
        {loading ? (
          <p className="text-gray-500 mt-4">Loading…</p>
        ) : !order ? (
          <p className="text-gray-500 mt-4">Not found</p>
        ) : (
          <>
            <div className="mt-4 text-sm">Status: <span className="font-medium">{order.status}</span></div>
            <div className="mt-2 text-sm">Amount: {typeof order.amount_cents==='number' ? `R ${(order.amount_cents/100).toFixed(2)}` : '-'}</div>
            <h2 className="text-lg font-medium mt-6">Items</h2>
            <ul className="mt-2 list-disc ml-6">
              {items.map(it => (
                <li key={it.id} className="text-sm">{it.product_id} × {it.quantity}</li>
              ))}
            </ul>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OrderDetail;





