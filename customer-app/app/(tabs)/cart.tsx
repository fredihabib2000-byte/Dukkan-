import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cart';

export default function CartScreen() {
  const { items, updateQuantity, total, storeId } = useCartStore();
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  useEffect(() => {
    if (!storeId) return;
    supabase.from('stores').select('delivery_fee').eq('id', storeId).single()
      .then(({ data }) => { if (data) setDeliveryFee(data.delivery_fee ?? 0); });
  }, [storeId]);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color="#D1FAE5" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items from a store to get started</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.shopBtnText}>Browse Stores</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const orderTotal = total() + deliveryFee;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Cart</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemUnit}>{item.product.unit}</Text>
              <Text style={styles.itemPrice}>${(item.product.price * item.quantity).toFixed(2)}</Text>
            </View>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
              >
                <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={16} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnAdd]}
                onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>${total().toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={styles.summaryValue}>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${orderTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout')}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff' },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptySubtitle: { color: '#6B7280' },
  shopBtn: { backgroundColor: '#16A34A', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', padding: 20, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 8 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemUnit: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#16A34A', marginTop: 4 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  qtyBtnAdd: { backgroundColor: '#16A34A' },
  qty: { fontSize: 16, fontWeight: '700', color: '#111827', minWidth: 20, textAlign: 'center' },
  separator: { height: 8 },
  summary: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 4,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { color: '#6B7280', fontSize: 15 },
  summaryValue: { color: '#374151', fontSize: 15, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 17, fontWeight: '800', color: '#111827' },
  totalValue: { fontSize: 17, fontWeight: '800', color: '#16A34A' },
  checkoutBtn: {
    backgroundColor: '#16A34A', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
