import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPaymentStatus } from '@/lib/api';

const PaymentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const res = await getPaymentStatus(id);
      if (res.success) setData(res.data);
      setLoading(false);
    };
    void run();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-10 flvunt-container">
        <Link to="/admin" className="text-sm underline">Back to Admin</Link>
        <h1 className="text-2xl font-medium mt-2">Payment {id}</h1>
        {loading ? (
          <p className="text-gray-500 mt-4">Loading…</p>
        ) : !data ? (
          <p className="text-gray-500 mt-4">Not found</p>
        ) : (
          <pre className="mt-4 text-xs bg-gray-50 p-4 rounded border overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PaymentDetail;





