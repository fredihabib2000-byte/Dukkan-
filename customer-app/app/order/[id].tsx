import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/types';

type OrderItem = {
  id: string;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  total: number;
};

type OrderDetail = {
  id: string;
  status: string;
  created_at: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  store: { name: string; logo_url: string | null };
  order_items: OrderItem[];
};

const STEPS = [
  { key: 'pending',    icon: 'receipt-outline',      label: 'Order Placed'  },
  { key: 'confirmed',  icon: 'checkmark-circle-outline', label: 'Confirmed'  },
  { key: 'preparing',  icon: 'restaurant-outline',   label: 'Preparing'     },
  { key: 'delivering', icon: 'bicycle-outline',       label: 'On the Way'   },
  { key: 'delivered',  icon: 'home-outline',          label: 'Delivered'     },
];

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered'];

function StatusTracker({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <View style={tracker.cancelled}>
        <Ionicons name="close-circle" size={32} color="#EF4444" />
        <Text style={tracker.cancelledText}>Order Cancelled</Text>
      </View>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <View style={tracker.container}>
      {STEPS.map((step, idx) => {
        const done    = idx <= currentIdx;
        const active  = idx === currentIdx;
        const isLast  = idx === STEPS.length - 1;

        return (
          <View key={step.key} style={tracker.stepWrap}>
            {/* Step circle */}
            <View style={[
              tracker.circle,
              done  && tracker.circleDone,
              active && tracker.circleActive,
            ]}>
              <Ionicons
                name={done ? 'checkmark' : step.icon as any}
                size={active ? 18 : 16}
                color={done ? '#fff' : '#D1D5DB'}
              />
            </View>

            {/* Line between steps */}
            {!isLast && (
              <View style={[tracker.line, idx < currentIdx && tracker.lineDone]} />
            )}

            {/* Label */}
            <Text style={[tracker.label, done && tracker.labelDone, active && tracker.labelActive]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Initial fetch
    supabase
      .from('orders')
      .select('*, store:stores(name, logo_url), order_items(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setOrder(data as OrderDetail);
        setLoading(false);
      });

    // Real-time subscription for status updates
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          setOrder(prev => prev ? { ...prev, status: payload.new.status } : prev);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#16A34A" />;
  if (!order) return (
    <SafeAreaView style={styles.container}>
      <Text style={{ textAlign: 'center', marginTop: 60, color: '#6B7280' }}>Order not found.</Text>
    </SafeAreaView>
  );

  const statusLabel = ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ?? order.status;
  const statusColor = ORDER_STATUS_COLOR[order.status as keyof typeof ORDER_STATUS_COLOR] ?? '#6B7280';
  const d = new Date(order.created_at);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Store header */}
        <View style={styles.section}>
          <View style={styles.storeRow}>
            {order.store?.logo_url ? (
              <Image source={{ uri: order.store.logo_url }} style={styles.storeLogo} />
            ) : (
              <View style={[styles.storeLogo, { backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>
                  {(order.store?.name ?? 'S')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.storeName}>{order.store?.name ?? 'Store'}</Text>
              <Text style={styles.orderMeta}>{dateStr} · {timeStr}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        {/* Track Order */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Track Order</Text>
          <StatusTracker status={order.status} />
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.order_items.length})</Text>
          {order.order_items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {item.product_image ? (
                <Image source={{ uri: item.product_image }} style={styles.itemImg} />
              ) : (
                <View style={[styles.itemImg, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="image-outline" size={20} color="#D1D5DB" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                <Text style={styles.itemUnit}>${item.unit_price.toFixed(2)} × {item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Info</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{order.customer_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{order.customer_phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>{order.delivery_address}</Text>
          </View>
          {order.notes ? (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{order.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Bill */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>${order.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Charge</Text>
            <Text style={styles.billValue}>{order.delivery_fee === 0 ? 'Free' : `$${order.delivery_fee.toFixed(2)}`}</Text>
          </View>
          <View style={[styles.billRow, styles.billTotal]}>
            <Text style={styles.billTotalLabel}>Total</Text>
            <Text style={styles.billTotalValue}>${order.total.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const GREEN = '#16A34A';
const GRAY  = '#D1D5DB';

const tracker = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
  },
  stepWrap: { flex: 1, alignItems: 'center', position: 'relative' },
  circle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: GRAY,
  },
  circleDone:   { backgroundColor: GREEN, borderColor: GREEN },
  circleActive: { backgroundColor: GREEN, borderColor: GREEN, width: 40, height: 40, borderRadius: 20 },
  line: {
    position: 'absolute',
    top: 18, left: '50%', right: '-50%',
    height: 3, backgroundColor: GRAY,
    zIndex: -1,
  },
  lineDone: { backgroundColor: GREEN },
  label: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', marginTop: 6, textAlign: 'center' },
  labelDone:   { color: '#374151' },
  labelActive: { color: GREEN, fontWeight: '800' },
  cancelled:      { alignItems: 'center', paddingVertical: 16, gap: 8 },
  cancelledText:  { fontSize: 16, fontWeight: '700', color: '#EF4444' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { paddingVertical: 10, gap: 10, paddingBottom: 40 },

  section: { backgroundColor: '#fff', padding: 18, gap: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },

  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storeLogo: { width: 48, height: 48, borderRadius: 12 },
  storeName: { fontSize: 17, fontWeight: '800', color: '#111827' },
  orderMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemImg: { width: 56, height: 56, borderRadius: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },
  itemUnit: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemTotal: { fontSize: 15, fontWeight: '700', color: '#111827' },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { fontSize: 14, color: '#374151', flex: 1, lineHeight: 20 },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { fontSize: 14, color: '#6B7280' },
  billValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  billTotal: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12, marginTop: 4 },
  billTotalLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  billTotalValue: { fontSize: 16, fontWeight: '800', color: '#16A34A' },
});
