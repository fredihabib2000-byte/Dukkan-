export type Store = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  min_order_amount: number;
  free_delivery_above: number | null;
  rating: number;
  rating_count: number;
  currency: string;
};

export type Category = {
  id: string;
  store_id: string;
  name: string;
  icon_url: string | null;
  sort_order: number;
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
  images: string[];
  discount_percent: number | null;
  has_free_gift: boolean;
  free_gift_label: string | null;
  is_available: boolean;
  is_featured: boolean;
};

export type Order = {
  id: string;
  store_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  delivery_address: string | null;
  created_at: string;
  store?: Pick<Store, 'name' | 'logo_url'>;
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

export type CustomerAddress = {
  id: string;
  label: string;
  full_address: string;
  building: string | null;
  floor: string | null;
  apartment: string | null;
  notes: string | null;
  is_default: boolean;
};

export type CartProduct = Product & { quantity: number };

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  delivering: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  preparing: '#8B5CF6',
  ready: '#06B6D4',
  delivering: '#F97316',
  delivered: '#16A34A',
  cancelled: '#EF4444',
};
