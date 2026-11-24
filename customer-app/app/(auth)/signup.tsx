import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Account created! You can now sign in.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>🛒 Dukkan</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Create account</Text>

        <TextInput style={styles.input} placeholder="Full name *" value={fullName} onChangeText={setFullName} placeholderTextColor="#9CA3AF" />
        <TextInput style={styles.input} placeholder="Email *" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#9CA3AF" />
        <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />
        <TextInput style={styles.input} placeholder="Password *" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#9CA3AF" />

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={styles.link}>Sign In</Text></TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#16A34A', paddingTop: 60, paddingBottom: 32, alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: '800', color: '#fff' },
  form: { flex: 1, padding: 24, paddingTop: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 14, marginBottom: 14, fontSize: 16, color: '#111827', backgroundColor: '#F9FAFB',
  },
  button: { backgroundColor: '#16A34A', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280' },
  link: { color: '#16A34A', fontWeight: '700' },
});
