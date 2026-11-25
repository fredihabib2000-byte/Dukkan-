import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image, FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/types';
import { useCartStore } from '@/store/cart';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [storeId, setStoreIdLocal] = useState<string>('');

  const { addItem, items, storeId: cartStoreId } = useCartStore();
  const cartItem = items.find((i) => i.product.id === id);
  const inCart = !!cartItem;

  useEffect(() => {
    supabase.from('products').select('*, store:stores(id)').eq('id', id).single()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        setProduct(data);
        const sid = (data as any).store?.id ?? data.store_id;
        setStoreIdLocal(sid);

        // Fetch similar products (same category, same store, excluding current)
        if (data.category_id) {
          const { data: sim } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', data.store_id)
            .eq('category_id', data.category_id)
            .eq('is_available', true)
            .neq('id', id)
            .limit(10);
          if (sim) setSimilar(sim);
        }
        setLoading(false);
      });
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
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

  const img = product.images?.[0];
  const hasDiscount = !!product.discount_percent;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Full-width image */}
        <View style={styles.imageWrap}>
          {img ? (
            <Image source={{ uri: img }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="cube-outline" size={80} color="#D1FAE5" />
            </View>
          )}
          {/* Floating buttons */}
          <TouchableOpacity style={[styles.floatBtn, { left: 14 }]} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.floatBtn, { right: 56 }]}>
            <Ionicons name="share-social-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.floatBtn, { right: 14 }]}>
            <Ionicons name="heart-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Product info card */}
        <View style={styles.infoCard}>
          {/* Badges */}
          {(hasDiscount || product.has_free_gift) && (
            <View style={styles.badges}>
              {hasDiscount && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{product.discount_percent}% OFF</Text>
                </View>
              )}
              {product.has_free_gift && (
                <View style={styles.giftBadge}>
                  <Text style={styles.giftText}>FREE GIFT</Text>
                </View>
              )}
            </View>
          )}

          <Text style={styles.name}>{product.name}</Text>
          {product.unit ? <Text style={styles.unit}>{product.unit}</Text> : null}

          {/* Price row */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, hasDiscount && styles.priceRed]}>
              ${product.price.toFixed(2)}
            </Text>
            {product.compare_at_price ? (
              <Text style={styles.comparePrice}>${product.compare_at_price.toFixed(2)}</Text>
            ) : null}
            {hasDiscount && product.compare_at_price ? (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>Save ${(product.compare_at_price - product.price).toFixed(2)}</Text>
              </View>
            ) : null}
          </View>

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}

          {product.free_gift_label ? (
            <View style={styles.giftCard}>
              <Ionicons name="gift-outline" size={18} color="#16A34A" />
              <Text style={styles.giftCardText}>{product.free_gift_label}</Text>
            </View>
          ) : null}
        </View>

        {/* Similar items */}
        {similar.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.similarHeader}>
              <Text style={styles.similarTitle}>Similar Items</Text>
              <TouchableOpacity style={styles.arrowBtn}>
                <Ionicons name="arrow-forward" size={18} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={similar}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(p) => p.id}
              contentContainerStyle={styles.similarList}
              renderItem={({ item }) => <SimilarCard product={item} storeId={storeId} />}
            />
          </View>
        )}
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottom}>
        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Ionicons name="remove" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.qty}>{quantity}</Text>
          <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => setQuantity(quantity + 1)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>{inCart ? 'Add More' : 'Add'}</Text>
          <Text style={styles.addBtnPrice}>${(product.price * quantity).toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SimilarCard({ product, storeId }: { product: Product; storeId: string }) {
  const { addItem } = useCartStore();
  const img = product.images?.[0];
  const hasDiscount = !!product.discount_percent;

  return (
    <TouchableOpacity style={styles.simCard} onPress={() => router.push(`/product/${product.id}`)}>
      <View style={styles.simImageWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.simImage} resizeMode="contain" />
        ) : (
          <View style={[styles.simImage, styles.simPlaceholder]}>
            <Ionicons name="cube-outline" size={28} color="#D1FAE5" />
          </View>
        )}
        <TouchableOpacity
          style={styles.simAddBtn}
          onPress={(e) => { e.stopPropagation(); addItem(product, storeId); }}
        >
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.simInfo}>
        <Text style={[styles.simPrice, hasDiscount && { color: '#EF4444' }]}>${product.price.toFixed(2)}</Text>
        {product.compare_at_price ? (
          <Text style={styles.simOld}>{product.compare_at_price.toFixed(2)}</Text>
        ) : null}
        <Text style={styles.simName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.simUnit}>{product.unit}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 110 },

  imageWrap: { width, height: width, backgroundColor: '#F9FAFB', position: 'relative' },
  image: { width, height: width },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  floatBtn: {
    position: 'absolute', top: 52,
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },

  infoCard: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  badges: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  discountBadge: { backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  discountText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  giftBadge: { backgroundColor: '#16A34A', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  giftText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  name: { fontSize: 22, fontWeight: '800', color: '#111827' },
  unit: { fontSize: 14, color: '#6B7280', marginTop: 4 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  price: { fontSize: 24, fontWeight: '800', color: '#111827' },
  priceRed: { color: '#EF4444' },
  comparePrice: { fontSize: 16, color: '#9CA3AF', textDecorationLine: 'line-through' },
  saveBadge: { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  saveText: { fontSize: 12, color: '#EF4444', fontWeight: '700' },

  description: { fontSize: 14, color: '#6B7280', marginTop: 12, lineHeight: 22 },
  giftCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D1FAE5', borderRadius: 10, padding: 12, marginTop: 14,
  },
  giftCardText: { color: '#065F46', fontSize: 14, fontWeight: '600', flex: 1 },

  similarSection: { borderTopWidth: 8, borderTopColor: '#F3F4F6', paddingTop: 16 },
  similarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  similarTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  arrowBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  similarList: { paddingHorizontal: 16, gap: 10 },

  simCard: { width: 150, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  simImageWrap: { position: 'relative', backgroundColor: '#F9FAFB' },
  simImage: { width: 150, height: 130 },
  simPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  simAddBtn: {
    position: 'absolute', bottom: 8, right: 8,
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#16A34A',
    justifyContent: 'center', alignItems: 'center',
  },
  simInfo: { padding: 10 },
  simPrice: { fontSize: 15, fontWeight: '800', color: '#111827' },
  simOld: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
  simName: { fontSize: 13, color: '#374151', fontWeight: '500', marginTop: 4, lineHeight: 18 },
  simUnit: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28,
    flexDirection: 'row', gap: 12, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnAdd: { backgroundColor: '#16A34A' },
  qty: { fontSize: 18, fontWeight: '700', color: '#111827', minWidth: 24, textAlign: 'center' },
  addBtn: {
    flex: 1, backgroundColor: '#16A34A', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  addBtnPrice: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
