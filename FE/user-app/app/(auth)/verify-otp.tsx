// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/services/auth.service';

const BG = '#0B1120';
const CARD = '#334155';
const YELLOW = '#3B82F6';
const GRAY = '#94A3B8';
const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Countdown resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return; // hanya angka
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1); // ambil 1 digit terakhir
    setOtp(newOtp);
    // Auto focus next
    if (val && idx < OTP_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < OTP_LENGTH) {
      Alert.alert('Error', 'Masukkan 6 digit kode OTP');
      return;
    }
    try {
      setLoading(true);
      await authService.verifyOtp(email!, otpCode);
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email, otp: otpCode },
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'OTP tidak valid atau sudah kadaluarsa.';
      Alert.alert('Verifikasi Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      await authService.sendOtp(email!);
      setOtp(Array(OTP_LENGTH).fill(''));
      setCountdown(60);
      inputs.current[0]?.focus();
      Alert.alert('OTP Terkirim', 'Kode OTP baru telah dikirim ke email kamu.');
    } catch {
      Alert.alert('Error', 'Gagal mengirim ulang OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : '';

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
            <Ionicons name="mail" size={32} color={YELLOW} />
          </View>
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit OTP code to{'\n'}
          <Text style={styles.emailText}>{maskedEmail}</Text>
        </Text>

        {/* OTP Input Boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => { inputs.current[idx] = r; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(v) => handleChange(v, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#1a1a2e" />
            : <Text style={styles.buttonText}>Verify OTP</Text>
          }
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>{"Didn't receive the code? "}</Text>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>Resend in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
              {resendLoading
                ? <ActivityIndicator size="small" color={YELLOW} />
                : <Text style={styles.resendLink}>Resend OTP</Text>
              }
            </TouchableOpacity>
          )}
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
  subtitle: { color: GRAY, fontSize: 14, lineHeight: 22, marginBottom: 36 },
  emailText: { color: '#fff', fontWeight: '600' },

  // OTP boxes
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 32,
  },
  otpBox: {
    flex: 1,
    height: 56,
    backgroundColor: CARD,
    borderRadius: 12,
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    borderWidth: 1.5,
    borderColor: '#2d3748',
  },
  otpBoxFilled: {
    borderColor: YELLOW,
    backgroundColor: '#334155',
  },

  button: {
    backgroundColor: YELLOW,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#1a1a2e', fontSize: 16, fontWeight: '700' },

  resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  resendText: { color: GRAY, fontSize: 14 },
  resendLink: { color: YELLOW, fontSize: 14, fontWeight: '700' },
  countdownText: { color: GRAY, fontSize: 14 },
});
