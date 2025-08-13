import { v4 as uuidv4 } from 'uuid';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import apiClient, { createOrderServer } from './api';

export interface OrderItem {
  product_id: string;
  quantity: number;
  price_cents: number;
  metadata?: Record<string, any>;
}

export interface CreateOrderParams {
  items: OrderItem[];
  amount_cents: number;
  currency?: string;
  metadata?: Record<string, any>;
}

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `FLV-${timestamp}${random}`;
};

export const createOrder = async (params: CreateOrderParams) => {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User must be authenticated to create an order');
    }

    const { items, currency = 'ZAR', metadata } = params as any;
    const payloadItems = items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
    const resp = await createOrderServer(payloadItems, currency, metadata);
    if (!resp.success) {
      return { success: false, error: resp.error };
    }
    return { success: true, data: resp.data };

  } catch (error) {
    console.error('Error in createOrder:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
};

export const updateOrderStatus = async (orderId: string, status: string, paymentId?: string) => {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update order status');
    }

    const orderDoc = doc(db(), 'orders', orderId);
    const snap = await getDoc(orderDoc);
    if (!snap.exists()) throw new Error('Order not found');
    const data = snap.data();
    if (data.user_id !== user.uid) throw new Error('Permission denied');

    await updateDoc(orderDoc, {
      status,
      payment_id: paymentId ?? null,
      updated_at: new Date().toISOString(),
    });

    const updated = await getDoc(orderDoc);
    return { success: true, data: { id: updated.id, ...updated.data() } };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status'
    };
  }
};

export const getOrder = async (orderId: string) => {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User must be authenticated to view orders');
    }

    const orderDocRef = doc(db(), 'orders', orderId);
    const orderSnap = await getDoc(orderDocRef);
    if (!orderSnap.exists()) throw new Error('Order not found');
    const order = { id: orderSnap.id, ...orderSnap.data() } as any;
    if (order.user_id !== user.uid) throw new Error('Permission denied');

    const itemsSnap = await getDocs(collection(db(), 'orders', orderId, 'order_items'));
    const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return { 
      success: true, 
      data: { 
        ...order, 
        items 
      } 
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch order'
    };
  }
};

export const getUserOrders = async () => {
  try {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User must be authenticated to view orders');
    }

    const q = query(
      collection(db(), 'orders'),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
    );
    const snap = await getDocs(q);
    const data = await Promise.all(
      snap.docs.map(async (d) => {
        const order = { id: d.id, ...d.data() } as any;
        const itemsSnap = await getDocs(collection(db(), 'orders', d.id, 'order_items'));
        const items = itemsSnap.docs.map((idoc) => ({ id: idoc.id, ...idoc.data() }));
        return { ...order, items };
      })
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user orders'
    };
  }
};