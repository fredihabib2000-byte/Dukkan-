export type Store = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  min_order_amount: number;
  free_delivery_above: number | null;
  currency: string;
  is_active: boolean;
};

export type Category = {
  id: string;
  store_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type Product = {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  unit: string;
  discount_percent: number | null;
  has_free_gift: boolean;
  free_gift_label: string | null;
  is_available: boolean;
  is_featured: boolean;
  stock_quantity: number;
  track_inventory: boolean;
  images: string[];
  created_at: string;
};

export type Order = {
  id: string;
  store_id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  delivery_address: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  created_at: string;
  profiles?: { full_name: string | null; phone: string | null };
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  total: number;
};

export type OrderStatus =
  | 'pending' | 'confirmed' | 'preparing'
  | 'ready' | 'delivering' | 'delivered' | 'cancelled';

export const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivering',
  delivering: 'delivered',
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  ready: 'Ready', delivering: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled',
};

export const ORDER_STATUS_LABEL = STATUS_LABEL;

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-cyan-100 text-cyan-800',
  delivering: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
