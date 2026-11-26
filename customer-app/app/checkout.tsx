import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Platform,
  PermissionsAndroid, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cart';
import Geolocation from 'react-native-geolocation-service';

type DeliveryMode = 'now' | 'schedule';
type Instruction = 'write' | 'door' | 'call' | 'silent';

const uuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });

const isValidPhone = (p: string): boolean => {
  const stripped = p.replace(/[\s\-\(\)]/g, '');
  return /^(\+?961)?[0-9]{8}$/.test(stripped);
};

const INSTRUCTIONS: { key: Instruction; icon: string; label: string }[] = [
  { key: 'write', icon: 'create-outline', label: 'Write instructions' },
  { key: 'door', icon: 'exit-outline', label: 'Leave at door' },
  { key: 'call', icon: 'call-outline', label: 'Call on arrival' },
  { key: 'silent', icon: 'notifications-off-outline', label: 'Do not ring' },
];

const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let mins = 8 * 60; mins <= 22 * 60; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const p = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push(`${h12}:${m === 0 ? '00' : '30'} ${p}`);
  }
  return slots;
})();

export default function CheckoutScreen() {
  const { items, total, storeId, clearCart } = useCartStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(2.00);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('now');
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const subtotal = total();
  const orderTotal = subtotal + deliveryFee;

  useEffect(() => {
    if (storeId) {
      supabase.from('stores').select('name, delivery_fee').eq('id', storeId).single()
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
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          { title: 'Location', message: 'Used to auto-fill your delivery address.', buttonPositive: 'Allow' }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) { setLocating(false); return; }
      }
      Geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const a = data.address || {};
            const parts = [
              a.road || a.pedestrian || a.path,
              a.suburb || a.neighbourhood || a.quarter || a.village,
              a.city || a.town || a.county,
            ].filter(Boolean);
            setAddress(parts.join(', ') || data.display_name?.split(',').slice(0, 2).join(', ') || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          } catch {
            setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
          setLocating(false);
        },
        () => setLocating(false),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } catch {
      setLocating(false);
    }
  };

  const toggleInstruction = (key: Instruction) => {
    setInstructions(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    if (key === 'write') setShowNotes(true);
  };

  const handlePlaceOrder = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Please enter your name'); return; }
    if (!phone.trim()) { Alert.alert('Required', 'Please enter your phone number'); return; }
    if (!isValidPhone(phone)) {
      Alert.alert('Invalid phone', 'Enter a valid Lebanese number (e.g. 71 123 456)');
      return;
    }
    if (!address.trim()) { Alert.alert('Required', 'Please enter a delivery address'); return; }
    if (deliveryMode === 'schedule' && !scheduledTime) { Alert.alert('Required', 'Please choose a delivery time'); return; }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const orderId = uuid();
    const fullAddress = [address, building, floor].filter(Boolean).join(', ');
    const instructionNote = instructions.length > 0
      ? `[${instructions.join(', ')}]${notes ? ' ' + notes : ''}`
      : notes;
    const deliveryNote = deliveryMode === 'schedule' && scheduledTime
      ? `Scheduled: ${scheduledTime}${instructionNote ? ' | ' + instructionNote : ''}`
      : instructionNote;

    const { error } = await supabase.from('orders').insert({
      id: orderId,
      store_id: storeId,
      user_id: user?.id ?? null,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: 0,
      total: orderTotal,
      notes: deliveryNote || null,
      delivery_address: fullAddress,
      status: 'pending',
    });

    if (error) {
      setLoading(false);
      Alert.alert('Error', 'Could not place order. Please try again.');
      return;
    }

    await supabase.from('order_items').insert(
      items.map(item => ({
        order_id: orderId,
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
      [{ text: 'OK', onPress: () => router.replace('/(tabs)/orders') }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.phoneRow}>
            <Ionicons name="person-outline" size={18} color="#6B7280" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.phoneInput}
              placeholder="Your name *"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={18} color="#6B7280" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number * (e.g. 71 123 456)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Delivery Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Time</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, deliveryMode === 'now' && styles.modeBtnActive]}
              onPress={() => { setDeliveryMode('now'); setScheduledTime(''); }}
            >
              <Text style={[styles.modePrimary, deliveryMode === 'now' && styles.modeTextActive]}>Now</Text>
              <Text style={[styles.modeSecondary, deliveryMode === 'now' && { color: '#16A34A' }]}>In 15–30 mins</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, deliveryMode === 'schedule' && styles.modeBtnActive]}
              onPress={() => { setDeliveryMode('schedule'); setShowTimePicker(true); }}
            >
              <Text style={[styles.modePrimary, deliveryMode === 'schedule' && styles.modeTextActive]}>Schedule ahead</Text>
              <Text style={[styles.modeSecondary, deliveryMode === 'schedule' && { color: '#16A34A' }]}>
                {scheduledTime || 'Choose a time'}
              </Text>
            </TouchableOpacity>
          </View>
          {deliveryMode === 'schedule' && scheduledTime ? (
            <TouchableOpacity style={styles.changeTimeBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={15} color="#16A34A" />
              <Text style={styles.changeTimeText}>Delivery at {scheduledTime} · Tap to change</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Street address *"
              value={address}
              onChangeText={setAddress}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.gpsBtn} onPress={handleGetLocation} disabled={locating}>
              {locating
                ? <ActivityIndicator size="small" color="#16A34A" />
                : <Ionicons name="locate-outline" size={20} color="#16A34A" />}
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.halfInput]} placeholder="Building" value={building} onChangeText={setBuilding} placeholderTextColor="#9CA3AF" />
            <TextInput style={[styles.input, styles.halfInput]} placeholder="Floor / Apt" value={floor} onChangeText={setFloor} placeholderTextColor="#9CA3AF" />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.instrList}>
            {INSTRUCTIONS.map(instr => {
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
          {items.map(item => (
            <View key={item.product.id} style={styles.lineRow}>
              <Text style={styles.lineLabel} numberOfLines={1}>{item.product.name} × {item.quantity}</Text>
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
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeBtnText}>Place order</Text>}
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTimePicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Delivery Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TIME_SLOTS}
              keyExtractor={t => t}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.timeSlot, scheduledTime === item && styles.timeSlotActive]}
                  onPress={() => { setScheduledTime(item); setShowTimePicker(false); }}
                >
                  <Ionicons name="time-outline" size={18} color={scheduledTime === item ? '#16A34A' : '#6B7280'} />
                  <Text style={[styles.timeSlotText, scheduledTime === item && styles.timeSlotTextActive]}>{item}</Text>
                  {scheduledTime === item && <Ionicons name="checkmark" size={18} color="#16A34A" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scroll: { paddingVertical: 10, gap: 10, paddingBottom: 30 },

  section: { backgroundColor: '#fff', padding: 18, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, backgroundColor: '#F9FAFB',
  },
  phoneInput: { flex: 1, padding: 12, fontSize: 15, color: '#111827' },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
  modeBtnActive: { borderColor: '#16A34A' },
  modePrimary: { fontSize: 15, fontWeight: '700', color: '#111827' },
  modeTextActive: { color: '#16A34A' },
  modeSecondary: { fontSize: 12, color: '#9CA3AF' },
  changeTimeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, backgroundColor: '#F0FDF4', borderRadius: 10 },
  changeTimeText: { fontSize: 13, color: '#16A34A', fontWeight: '600' },

  addressRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  gpsBtn: {
    width: 46, height: 46, borderRadius: 10, backgroundColor: '#F0FDF4',
    borderWidth: 1, borderColor: '#BBF7D0', justifyContent: 'center', alignItems: 'center',
  },

  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  notesInput: { height: 80, textAlignVertical: 'top', marginTop: 4 },

  instrList: { gap: 10, paddingRight: 4 },
  instrCard: { width: 100, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, alignItems: 'center', gap: 6 },
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
  placeBtn: { backgroundColor: '#16A34A', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  timeSlot: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  timeSlotActive: { backgroundColor: '#F0FDF4' },
  timeSlotText: { flex: 1, fontSize: 15, color: '#374151' },
  timeSlotTextActive: { color: '#16A34A', fontWeight: '700' },
});
