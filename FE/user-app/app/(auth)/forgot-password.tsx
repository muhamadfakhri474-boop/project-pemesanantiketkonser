import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/services/auth.service';

const BG = '#0B1120';
const CARD = '#334155';
const YELLOW = '#3B82F6';
const GRAY = '#94A3B8';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }
    if (!email.includes('@')) {
      setError('Format email tidak valid');
      return;
    }
    setError('');
    try {
      setLoading(true);
      await authService.sendOtp(email.trim().toLowerCase());
      // Selalu tampil pesan sukses (security best practice dari backend)
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal mengirim OTP. Coba lagi.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Icon */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconBox}>
            <Ionicons name="lock-closed" size={32} color={YELLOW} />
          </View>
        </View>

        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          {"Enter your registered email address. We'll send a 6-digit OTP code to reset your password."}
        </Text>

        {/* Email Input */}
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="your@email.com"
          placeholderTextColor={GRAY}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(''); }}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Send OTP Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#1a1a2e" />
            : <Text style={styles.buttonText}>Send OTP Code</Text>
          }
        </TouchableOpacity>

        {/* Back to Login */}
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40, height: 40,
    backgroundColor: CARD,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  iconWrapper: { alignItems: 'center', marginTop: 32, marginBottom: 24 },
  iconBox: {
    width: 72, height: 72,
    backgroundColor: CARD,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: GRAY, fontSize: 14, lineHeight: 22, marginBottom: 32 },
  label: {
    color: '#9CA3AF', fontSize: 11,
    fontWeight: '600', letterSpacing: 1,
    marginBottom: 6, marginTop: 8,
  },
  input: {
    backgroundColor: CARD,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },
  button: {
    backgroundColor: YELLOW,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#1a1a2e', fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  loginText: { color: GRAY, fontSize: 14 },
  loginLink: { color: YELLOW, fontSize: 14, fontWeight: '700' },
});
