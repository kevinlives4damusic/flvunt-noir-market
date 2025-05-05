import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to create an order');
    }

    const {
      items,
      amount_cents,
      currency = 'ZAR',
      metadata
    } = params;

    // Start a transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: generateOrderNumber(),
        amount_cents,
        currency,
        metadata,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      ...item
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw itemsError;
    }

    return { 
      success: true, 
      data: { 
        ...order, 
        items: orderItems 
      } 
    };

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to update order status');
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        payment_id: paymentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', user.id) // Ensure user owns the order
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to view orders');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id) // Ensure user owns the order
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    return { 
      success: true, 
      data: { 
        ...order, 
        items: items || [] 
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to view orders');
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user orders'
    };
  }
};