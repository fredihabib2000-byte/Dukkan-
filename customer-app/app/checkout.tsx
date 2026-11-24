import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cart';

export default function CheckoutScreen() {
  const { items, total, storeId, clearCart } = useCartStore();
  const [address, setAddress] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('');

  const deliveryFee = 2.00;
  const orderTotal = total() + deliveryFee;

  useEffect(() => {
    if (storeId) {
      supabase.from('stores').select('name, delivery_fee').eq('id', storeId).single()
        .then(({ data }) => { if (data) setStoreName(data.name); });
    }
  }, [storeId]);

  const handlePlaceOrder = async () => {
    if (!address.trim()) { Alert.alert('Error', 'Please enter a delivery address'); return; }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const subtotal = total();
    const fullAddress = [address, building, floor].filter(Boolean).join(', ');

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        user_id: user.id,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: 0,
        total: subtotal + deliveryFee,
        notes,
        delivery_address: fullAddress,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !order) {
      setLoading(false);
      Alert.alert('Error', 'Could not place order. Please try again.');
      return;
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_image: item.product.images?.[0] ?? null,
      unit_price: item.product.price,
      quantity: item.quantity,
      total: item.product.price * item.quantity,
    }));

    await supabase.from('order_items').insert(orderItems);

    clearCart();
    setLoading(false);

    Alert.alert(
      '🎉 Order Placed!',
      `Your order from ${storeName} has been placed successfully. We'll notify you when it's confirmed.`,
      [{ text: 'View Orders', onPress: () => router.replace('/(tabs)/orders') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Delivery address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color="#16A34A" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <TextInput style={styles.input} placeholder="Street address *" value={address} onChangeText={setAddress} placeholderTextColor="#9CA3AF" />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.halfInput]} placeholder="Building" value={building} onChangeText={setBuilding} placeholderTextColor="#9CA3AF" />
            <TextInput style={[styles.input, styles.halfInput]} placeholder="Floor" value={floor} onChangeText={setFloor} placeholderTextColor="#9CA3AF" />
          </View>
        </View>

        {/* Order notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-outline" size={20} color="#16A34A" />
            <Text style={styles.sectionTitle}>Notes for store</Text>
          </View>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="e.g. Ring doorbell, leave at door..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Order summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={20} color="#16A34A" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          {items.map((item) => (
            <View key={item.product.id} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.product.name} × {item.quantity}</Text>
              <Text style={styles.itemTotal}>${(item.product.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.orderItem}>
            <Text style={styles.feeLabel}>Subtotal</Text>
            <Text style={styles.feeValue}>${total().toFixed(2)}</Text>
          </View>
          <View style={styles.orderItem}>
            <Text style={styles.feeLabel}>Delivery fee</Text>
            <Text style={styles.feeValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.orderItem, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${orderTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place order button */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.placeBtn} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeBtnText}>Place Order · ${orderTotal.toFixed(2)}</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, paddingBottom: 100 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12,
    fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB', marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName: { fontSize: 14, color: '#374151', flex: 1 },
  itemTotal: { fontSize: 14, fontWeight: '600', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 },
  feeLabel: { fontSize: 14, color: '#6B7280' },
  feeValue: { fontSize: 14, color: '#374151' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#16A34A' },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  placeBtn: {
    backgroundColor: '#16A34A', borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
