import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/cart';

type Props = { product: Product; storeId: string; onPress: () => void };

export function ProductCard({ product, storeId, onPress }: Props) {
  const { addItem, items, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Badges */}
      {product.discount_percent && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{product.discount_percent}% OFF</Text>
        </View>
      )}
      {product.has_free_gift && !product.discount_percent && (
        <View style={styles.giftBadge}>
          <Text style={styles.giftText}>FREE GIFT</Text>
        </View>
      )}

      {/* Image placeholder */}
      <View style={styles.imagePlaceholder}>
        <Ionicons name="cube-outline" size={36} color="#D1FAE5" />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.unit}>{product.unit}</Text>

        <View style={styles.bottom}>
          <View>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.compare_at_price && (
              <Text style={styles.comparePrice}>${product.compare_at_price.toFixed(2)}</Text>
            )}
          </View>

          {qty === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={(e) => { e.stopPropagation(); addItem(product, storeId); }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={(e) => { e.stopPropagation(); updateQuantity(product.id, qty - 1); }}
              >
                <Ionicons name="remove" size={14} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.qty}>{qty}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, styles.qtyBtnAdd]}
                onPress={(e) => { e.stopPropagation(); addItem(product, storeId); }}
              >
                <Ionicons name="add" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden',
  },
  discountBadge: {
    position: 'absolute', top: 8, left: 8, zIndex: 1,
    backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  giftBadge: {
    position: 'absolute', top: 8, left: 8, zIndex: 1,
    backgroundColor: '#16A34A', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  giftText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  imagePlaceholder: { height: 110, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  info: { padding: 10 },
  name: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
  unit: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  price: { fontSize: 15, fontWeight: '800', color: '#111827' },
  comparePrice: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
  addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  qtyBtnAdd: { backgroundColor: '#16A34A' },
  qty: { fontSize: 14, fontWeight: '700', color: '#111827', minWidth: 18, textAlign: 'center' },
});
