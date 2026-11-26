import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter email', 'Type your email above then tap Forgot Password.');
      return;
    }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setResetting(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Email sent', 'Check your inbox for the password reset link.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>🛒 Dukkan</Text>
        <Text style={styles.subtitle}>Your neighbourhood market</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Welcome back</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#9CA3AF"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity onPress={handleForgotPassword} disabled={resetting} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>{resetting ? 'Sending…' : 'Forgot Password?'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity style={styles.guestBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.guestText}>Browse stores without account →</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#16A34A',
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logo: { fontSize: 32, fontWeight: '800', color: '#fff' },
  subtitle: { color: '#D1FAE5', marginTop: 4, fontSize: 14 },
  form: { flex: 1, padding: 24, paddingTop: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  button: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 4, marginTop: -4 },
  forgotText: { color: '#16A34A', fontWeight: '600', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280' },
  link: { color: '#16A34A', fontWeight: '700' },
  guestBtn: { marginTop: 20, alignItems: 'center', paddingVertical: 12 },
  guestText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
});
