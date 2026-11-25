import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cart';

type DeliveryMode = 'now' | 'schedule';
type Instruction = 'write' | 'door' | 'call' | 'silent';

const INSTRUCTIONS: { key: Instruction; icon: string; label: string }[] = [
  { key: 'write', icon: 'create-outline', label: 'Write instructions' },
  { key: 'door', icon: 'exit-outline', label: 'Leave at door' },
  { key: 'call', icon: 'call-outline', label: 'Call me on arrival' },
  { key: 'silent', icon: 'notifications-off-outline', label: 'Do not ring' },
];

export default function CheckoutScreen() {
  const { items, total, storeId, clearCart } = useCartStore();
  const [address, setAddress] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(2.00);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('now');
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [locating, setLocating] = useState(false);

  const subtotal = total();
  const orderTotal = subtotal + deliveryFee;

  useEffect(() => {
    if (storeId) {
      supabase.from('stores').select('name, delivery_fee, delivery_time_min, delivery_time_max').eq('id', storeId).single()
        .then(({ data }) => {
          if (data) {
            setStoreName(data.name);
            setDeliveryFee(data.delivery_fee ?? 2.00);
          }
        });
    }
  }, [storeId]);

  const handleGetLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow location access in settings.');
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [place] = await Location.reverseGeocodeAsync(loc.coords);
      if (place) {
        const parts = [place.street, place.streetNumber, place.district, place.city].filter(Boolean);
        setAddress(parts.join(', '));
        if (place.name && place.name !== place.street) setBuilding(place.name);
      } else {
        setAddress(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      }
    } catch {
      Alert.alert('Error', 'Could not get your location. Please enter it manually.');
    }
    setLocating(false);
  };

  const toggleInstruction = (key: Instruction) => {
    setInstructions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    if (key === 'write') setShowNotes(true);
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) { Alert.alert('Required', 'Please enter a delivery address'); return; }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      Alert.alert('Sign in required', 'Please sign in to place an order');
      return;
    }

    const fullAddress = [address, building, floor].filter(Boolean).join(', ');
    const instructionNote = instructions.length > 0
      ? `[${instructions.join(', ')}]${notes ? ' ' + notes : ''}`
      : notes;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        user_id: user.id,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: 0,
        total: orderTotal,
        notes: instructionNote || null,
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

    await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images?.[0] ?? null,
        unit_price: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
      }))
    );

    clearCart();
    setLoading(false);

    Alert.alert(
      'Order Placed!',
      `Your order from ${storeName} has been placed successfully.`,
      [{ text: 'View Orders', onPress: () => router.replace('/(tabs)/orders') }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Delivery Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Time</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, deliveryMode === 'now' && styles.modeBtnActive]}
              onPress={() => setDeliveryMode('now')}
            >
              <Text style={[styles.modePrimary, deliveryMode === 'now' && styles.modeTextActive]}>Now</Text>
              <Text style={[styles.modeSecondary, deliveryMode === 'now' && { color: '#16A34A' }]}>In 15–30 mins</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, deliveryMode === 'schedule' && styles.modeBtnActive]}
              onPress={() => setDeliveryMode('schedule')}
            >
              <Text style={[styles.modePrimary, deliveryMode === 'schedule' && styles.modeTextActive]}>Schedule ahead</Text>
              <Text style={[styles.modeSecondary, deliveryMode === 'schedule' && { color: '#16A34A' }]}>Choose a time</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity style={styles.gpsBtn} onPress={handleGetLocation} disabled={locating}>
              {locating ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : (
                <>
                  <Ionicons name="location-outline" size={14} color="#16A34A" />
                  <Text style={styles.gpsBtnText}>Use my location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Street address *"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#9CA3AF"
          />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.halfInput]} placeholder="Building" value={building} onChangeText={setBuilding} placeholderTextColor="#9CA3AF" />
            <TextInput style={[styles.input, styles.halfInput]} placeholder="Floor / Apt" value={floor} onChangeText={setFloor} placeholderTextColor="#9CA3AF" />
          </View>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instrList}>
            {INSTRUCTIONS.map((instr) => {
              const active = instructions.includes(instr.key);
              return (
                <TouchableOpacity
                  key={instr.key}
                  style={[styles.instrCard, active && styles.instrCardActive]}
                  onPress={() => toggleInstruction(instr.key)}
                >
                  <Ionicons name={instr.icon as any} size={22} color={active ? '#16A34A' : '#374151'} />
                  <Text style={[styles.instrLabel, active && styles.instrLabelActive]}>{instr.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {showNotes && (
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Tell us here..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholderTextColor="#9CA3AF"
            />
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.product.id} style={styles.lineRow}>
              <Text style={styles.lineLabel} numberOfLines={1}>
                {item.product.name} × {item.quantity}
              </Text>
              <Text style={styles.lineValue}>${(item.product.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>Subtotal</Text>
            <Text style={styles.lineValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.lineRow}>
            <Text style={styles.lineLabel}>Delivery Charge</Text>
            <Text style={styles.lineValue}>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</Text>
          </View>
          <View style={[styles.lineRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${orderTotal.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Sticky bottom */}
      <View style={styles.bottom}>
        <View>
          <Text style={styles.bottomLabel}>Total Payment</Text>
          <Text style={styles.bottomTotal}>${orderTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.placeBtn} onPress={handlePlaceOrder} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeBtnText}>Place order</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { paddingVertical: 10, gap: 10, paddingBottom: 30 },

  section: { backgroundColor: '#fff', padding: 18, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  gpsBtnText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, alignItems: 'center', gap: 4,
  },
  modeBtnActive: { borderColor: '#16A34A' },
  modePrimary: { fontSize: 15, fontWeight: '700', color: '#111827' },
  modeTextActive: { color: '#16A34A' },
  modeSecondary: { fontSize: 12, color: '#9CA3AF' },

  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12,
    fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB',
  },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  notesInput: { height: 80, textAlignVertical: 'top', marginTop: 4 },

  instrList: { gap: 10, paddingRight: 4 },
  instrCard: {
    width: 100, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 6,
  },
  instrCardActive: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
  instrLabel: { fontSize: 11, color: '#374151', textAlign: 'center', fontWeight: '500' },
  instrLabelActive: { color: '#16A34A', fontWeight: '700' },

  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineLabel: { fontSize: 14, color: '#6B7280', flex: 1, marginRight: 8 },
  lineValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#111827' },

  bottom: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  bottomLabel: { fontSize: 12, color: '#6B7280' },
  bottomTotal: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 2 },
  placeBtn: {
    backgroundColor: '#16A34A', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14,
  },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
