import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/cart';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const { addItem, items, storeId: cartStoreId } = useCartStore();
  const cartItem = items.find((i) => i.product.id === id);
  const inCart = !!cartItem;

  useEffect(() => {
    supabase.from('products').select('*, store:stores(id)').eq('id', id).single()
      .then(({ data }) => { if (data) setProduct(data); setLoading(false); });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const storeId = (product as any).store?.id;
    if (cartStoreId && cartStoreId !== storeId) {
      Alert.alert(
        'Different Store',
        'Your cart has items from another store. Clear cart and add this item?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear & Add', style: 'destructive', onPress: () => { addItem(product, storeId); router.back(); } },
        ]
      );
    } else {
      for (let i = 0; i < quantity; i++) addItem(product, storeId);
      router.back();
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#16A34A" />;
  if (!product) return <View style={styles.center}><Text>Product not found</Text></View>;

  const discountAmount = product.compare_at_price
    ? (product.compare_at_price - product.price).toFixed(2)
    : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Image placeholder */}
        <View style={styles.imagePlaceholder}>
          <Ionicons name="cube-outline" size={80} color="#D1FAE5" />
        </View>

        <View style={styles.content}>
          {/* Badges */}
          <View style={styles.badges}>
            {product.discount_percent && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount_percent}% OFF</Text>
              </View>
            )}
            {product.has_free_gift && (
              <View style={styles.giftBadge}>
                <Text style={styles.giftText}>🎁 FREE GIFT</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.unit}>{product.unit}</Text>

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}

          {/* Pricing */}
          <View style={styles.pricing}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.compare_at_price && (
              <>
                <Text style={styles.comparePrice}>${product.compare_at_price.toFixed(2)}</Text>
                <Text style={styles.saving}>Save ${discountAmount}</Text>
              </>
            )}
          </View>

          {product.free_gift_label && (
            <View style={styles.freeGiftCard}>
              <Ionicons name="gift-outline" size={18} color="#16A34A" />
              <Text style={styles.freeGiftText}>{product.free_gift_label}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottom}>
        <View style={styles.qtyControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Ionicons name="remove" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.qty}>{quantity}</Text>
          <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => setQuantity(quantity + 1)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addBtnText}>
            {inCart ? 'Add More' : 'Add to Cart'} · ${(product.price * quantity).toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 120 },
  imagePlaceholder: {
    height: 240, backgroundColor: '#F0FDF4',
    justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: 20 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  discountBadge: { backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  discountText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  giftBadge: { backgroundColor: '#D1FAE5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  giftText: { color: '#16A34A', fontSize: 12, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '800', color: '#111827' },
  unit: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  description: { fontSize: 15, color: '#374151', marginTop: 12, lineHeight: 22 },
  pricing: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  price: { fontSize: 28, fontWeight: '800', color: '#16A34A' },
  comparePrice: { fontSize: 18, color: '#9CA3AF', textDecorationLine: 'line-through' },
  saving: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  freeGiftCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D1FAE5', borderRadius: 10, padding: 12, marginTop: 16,
  },
  freeGiftText: { color: '#065F46', fontSize: 14, fontWeight: '600', flex: 1 },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 16, paddingBottom: 32,
    flexDirection: 'row', gap: 12, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  qtyBtnAdd: { backgroundColor: '#16A34A' },
  qty: { fontSize: 18, fontWeight: '700', color: '#111827', minWidth: 24, textAlign: 'center' },
  addBtn: {
    flex: 1, backgroundColor: '#16A34A', borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
