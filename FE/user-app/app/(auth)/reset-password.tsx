import React, { useState } from 'react';
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

export default function ResetPasswordScreen() {
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ new?: string; confirm?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!newPassword) e.new = 'Password baru wajib diisi';
    else if (newPassword.length < 6) e.new = 'Password minimal 6 karakter';
    if (!confirmPassword) e.confirm = 'Konfirmasi password wajib diisi';
    else if (newPassword !== confirmPassword) e.confirm = 'Password tidak sama';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await authService.resetPassword(email!, otp!, newPassword);
      Alert.alert(
        'Berhasil',
        'Password berhasil direset. Silakan login dengan password baru.',
        [{ text: 'Login', onPress: () => router.replace('/(auth)/login') }],
        { cancelable: false }
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal reset password. Coba lagi.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getStrength = () => {
    if (!newPassword) return null;
    if (newPassword.length < 6) return { label: 'Weak', color: '#ef4444', width: '30%' };
    if (newPassword.length < 10) return { label: 'Medium', color: '#f59e0b', width: '60%' };
    return { label: 'Strong', color: '#22c55e', width: '100%' };
  };
  const strength = getStrength();

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
            <Ionicons name="shield-checkmark" size={32} color={YELLOW} />
          </View>
        </View>

        <Text style={styles.title}>Create New Password</Text>
        <Text style={styles.subtitle}>
          Your new password must be different from your previous password.
        </Text>

        {/* New Password */}
        <Text style={styles.label}>NEW PASSWORD</Text>
        <View style={[styles.passwordContainer, errors.new ? styles.inputError : null]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            placeholderTextColor={GRAY}
            secureTextEntry={!showNew}
            value={newPassword}
            onChangeText={(v) => { setNewPassword(v); setErrors((e) => ({ ...e, new: undefined })); }}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Ionicons name={showNew ? 'eye-off' : 'eye'} size={18} color={GRAY} />
          </TouchableOpacity>
        </View>
        {errors.new ? <Text style={styles.errorText}>{errors.new}</Text> : null}

        {/* Strength bar */}
        {strength && (
          <View style={styles.strengthWrapper}>
            <View style={styles.strengthBg}>
              <View style={[styles.strengthBar, { width: strength.width as any, backgroundColor: strength.color }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
          </View>
        )}

        {/* Confirm Password */}
        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <View style={[styles.passwordContainer, errors.confirm ? styles.inputError : null]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            placeholderTextColor={GRAY}
            secureTextEntry={!showConfirm}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirm: undefined })); }}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={18} color={GRAY} />
          </TouchableOpacity>
        </View>
        {errors.confirm ? <Text style={styles.errorText}>{errors.confirm}</Text> : null}

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#1a1a2e" />
            : <Text style={styles.buttonText}>Reset Password</Text>
          }
        </TouchableOpacity>
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
    marginBottom: 6, marginTop: 16,
  },
  passwordContainer: {
    backgroundColor: CARD,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  passwordInput: {
    flex: 1, paddingVertical: 14,
    color: '#fff', fontSize: 15,
  },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4 },

  // Strength
  strengthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  strengthBg: {
    flex: 1, height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBar: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 48 },

  button: {
    backgroundColor: YELLOW,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#1a1a2e', fontSize: 16, fontWeight: '700' },
});
