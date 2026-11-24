import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Order, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/lib/types';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, store:stores(name, logo_url), order_items(*)')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#16A34A" />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16A34A" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color="#D1FAE5" />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusColor = ORDER_STATUS_COLOR[order.status];
  const itemCount = order.order_items?.length ?? 0;
  const date = new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.storeName}>{(order.store as any)?.name ?? 'Store'}</Text>
          <Text style={styles.date}>{date} · {itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{ORDER_STATUS_LABEL[order.status]}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.cardFooter}>
        <Text style={styles.total}>${order.total.toFixed(2)}</Text>
        {order.status === 'delivering' && (
          <TouchableOpacity style={styles.trackBtn}>
            <Ionicons name="navigate-outline" size={14} color="#16A34A" />
            <Text style={styles.trackText}>Track order</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', padding: 20, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  storeName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  date: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 18, fontWeight: '800', color: '#111827' },
  trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  trackText: { color: '#16A34A', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 16 },
});
