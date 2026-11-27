import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';

type Props = { product: Product; storeId: string; onPress: () => void };

export function ProductCard({ product, storeId, onPress }: Props) {
  const { addItem, items, updateQuantity } = useCartStore();
  const { toggle, isSaved } = useWishlistStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;
  const hasDiscount = !!product.discount_percent;
  const img = product.images?.[0];
  const saved = isSaved(product.id);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Image area */}
      <View style={styles.imageWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="cube-outline" size={36} color="#D1FAE5" />
          </View>
        )}

        {/* Badges */}
        {hasDiscount && (
          <View style={styles.badgeStack}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount_percent}% OFF</Text>
            </View>
            {product.has_free_gift && (
              <View style={styles.giftBadge}>
                <Text style={styles.giftText}>FREE GIFT</Text>
              </View>
            )}
          </View>
        )}
        {!hasDiscount && product.has_free_gift && (
          <View style={styles.badgeStack}>
            <View style={styles.giftBadge}>
              <Text style={styles.giftText}>FREE GIFT</Text>
            </View>
          </View>
        )}

        {/* Wishlist heart */}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={(e) => { e.stopPropagation(); toggle(product, storeId); }}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={18}
            color={saved ? '#EF4444' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        {product.unit ? <Text style={styles.unit}>{product.unit}</Text> : null}

        <View style={styles.bottom}>
          <View>
            <Text style={[styles.price, hasDiscount && styles.priceRed]}>
              ${product.price.toFixed(2)}
            </Text>
            {product.compare_at_price ? (
              <Text style={styles.comparePrice}>${product.compare_at_price.toFixed(2)}</Text>
            ) : null}
          </View>

          {qty === 0 ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={(e) => { e.stopPropagation(); addItem(product, storeId); }}
            >
              <Ionicons name="add" size={22} color="#fff" />
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
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: 'hidden',
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 120 },
  imagePlaceholder: { height: 120, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  badgeStack: { position: 'absolute', top: 7, left: 7, gap: 3 },
  heartBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.88)',
    justifyContent: 'center', alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  giftBadge: {
    backgroundColor: '#16A34A', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  giftText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  info: { padding: 10 },
  name: { fontSize: 13, fontWeight: '600', color: '#111827', lineHeight: 18 },
  unit: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  price: { fontSize: 15, fontWeight: '800', color: '#111827' },
  priceRed: { color: '#EF4444' },
  comparePrice: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through', marginTop: 1 },
  addBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#16A34A',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 7, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnAdd: { backgroundColor: '#16A34A' },
  qty: { fontSize: 14, fontWeight: '700', color: '#111827', minWidth: 18, textAlign: 'center' },
});
