import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { adminList, adminRefundMock, adminReplay } from '@/lib/api';

type PaymentEvent = {
  id: string;
  type: string;
  provider?: string;
  paymentId?: string;
  orderId?: string;
  status?: string;
  created_at: string;
};

const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'events' | 'payments' | 'orders'>('events');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        // Optional: require admin user check in real app
        auth();
        const q = query(
          collection(db(), 'payment_events'),
          orderBy('created_at', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        setEvents(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingList(true);
      try {
        const res = await adminList(tab === 'orders' ? 'orders' : 'payments', {
          status: statusFilter || undefined,
          limit: 50,
        });
        setRows(res.data);
      } catch {
        setRows([]);
      } finally {
        setLoadingList(false);
      }
    };
    if (tab !== 'events') void load();
  }, [tab, statusFilter]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow py-10 flvunt-container">
        <h1 className="text-2xl font-medium mb-6">Admin Dashboard</h1>
        <div className="bg-white border rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Admin</h2>
            <div className="flex gap-2 text-sm">
              <button className={`px-3 py-1 rounded ${tab==='events'?'bg-black text-white':'border'}`} onClick={() => setTab('events')}>Events</button>
              <button className={`px-3 py-1 rounded ${tab==='payments'?'bg-black text-white':'border'}`} onClick={() => setTab('payments')}>Payments</button>
              <button className={`px-3 py-1 rounded ${tab==='orders'?'bg-black text-white':'border'}`} onClick={() => setTab('orders')}>Orders</button>
            </div>
          </div>

          {tab !== 'events' && (
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm">Status</label>
              <select className="border rounded p-1 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Any</option>
                <option value="pending">pending</option>
                <option value="processing">processing</option>
                <option value="succeeded">succeeded</option>
                <option value="failed">failed</option>
                <option value="canceled">canceled</option>
                <option value="refunded">refunded</option>
                <option value="partially_refunded">partially_refunded</option>
              </select>
            </div>
          )}
          {tab === 'events' ? (
            loading ? (
              <p className="text-gray-500">Loading…</p>
            ) : events.length === 0 ? (
              <p className="text-gray-500">No events yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Provider</th>
                      <th className="py-2 pr-4">Payment</th>
                      <th className="py-2 pr-4">Order</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => (
                      <tr key={ev.id} className="border-b last:border-none">
                        <td className="py-2 pr-4 whitespace-nowrap">{new Date(ev.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-4">{ev.type}</td>
                        <td className="py-2 pr-4">{ev.provider || '-'}</td>
                        <td className="py-2 pr-4">{ev.paymentId || '-'}</td>
                        <td className="py-2 pr-4">{ev.orderId || '-'}</td>
                        <td className="py-2 pr-4">{ev.status || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            loadingList ? (
              <p className="text-gray-500">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="text-gray-500">No records</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">ID</th>
                      <th className="py-2 pr-4">Created</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4">Amount</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b last:border-none">
                        <td className="py-2 pr-4">{r.id}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="py-2 pr-4">{r.status || '-'}</td>
                        <td className="py-2 pr-4">{typeof r.amount_cents === 'number' ? `R ${(r.amount_cents/100).toFixed(2)}` : '-'}</td>
                        <td className="py-2 pr-4">
                          {tab === 'payments' && (
                            <div className="flex gap-2">
                              <button className="px-2 py-1 border rounded" onClick={async () => { await adminRefundMock(r.id, true); setStatusFilter(''); }}>Partial Refund</button>
                              <button className="px-2 py-1 border rounded" onClick={async () => { await adminRefundMock(r.id, false); setStatusFilter(''); }}>Full Refund</button>
                              {r.checkout_id && (
                                <button className="px-2 py-1 border rounded" onClick={async () => { await adminReplay(r.checkout_id); setStatusFilter(''); }}>Replay Webhook</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;

