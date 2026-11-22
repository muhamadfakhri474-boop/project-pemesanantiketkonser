// @ts-nocheck
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { BASE_URL } from '@/services/api';


const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').pipe(z.email('Format email tidak valid')),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      console.log('Login attempt:', data.email);
      console.log('BASE_URL:', BASE_URL);
      const res = await authService.login(data);
      console.log('Login response:', JSON.stringify(res));
      // Coba beberapa kemungkinan struktur response dari backend
      const token = res?.token || res?.data?.token || res?.accessToken;
      const user = res?.user || res?.data?.user || res?.data;
      if (!token) {
        Alert.alert('Login Gagal', 'Token tidak ditemukan di response. Cek console.');
        console.log('Full response:', JSON.stringify(res));
        return;
      }
      await setAuth(user, token);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Login error status:', err?.response?.status);
      console.log('Login error data:', JSON.stringify(err?.response?.data));
      console.log('Login error message:', err?.message);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Login gagal. Coba lagi.';
      Alert.alert('Login Gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.flex} bounces={false}>
        {/* Header dengan background konser */}
        <ImageBackground
          source={require('@/assets/images/backgroundlogin.avif')}
          style={styles.headerBg}
          imageStyle={styles.headerBgImage}
        >
          <View style={styles.overlay} />
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoStar}>★</Text>
            </View>
            <Text style={styles.appName}>Crescendo</Text>
          </View>
        </ImageBackground>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSubtitle}>Sign in to your account</Text>

          {/* Email */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="your@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          {/* Password */}
          <Text style={styles.label}>PASSWORD</Text>
          <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          {/* Remember me & Forgot Password */}
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInButton, loading && styles.disabledButton]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a1a2e" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Or continue with */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={20} color="blue"></Ionicons>
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
             <Ionicons name="logo-apple" size={20} color="white"></Ionicons>
              <Text style={styles.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const BG = '#0B1120';
const CARD = '#334155';
const YELLOW = '#3B82F6';
const GRAY = '#94A3B8';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },

  // Header
  headerBg: {
    height: 220,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  headerBgImage: {
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,17,23,0.55)',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoBox: {
    width: 56,
    height: 56,
    backgroundColor: YELLOW,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoStar: {
    fontSize: 40,
    marginBottom: 8,
    color: '#1a1a2e',
  },
  appName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Form
  formContainer: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: GRAY,
    fontSize: 14,
    marginBottom: 28,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 16,
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
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },

  // Password
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
    flex: 1,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
  },
  showText: {
    color: GRAY,
    fontSize: 14,
    fontWeight: '500',
  },

  // Remember me
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: GRAY,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  checkmark: {
    fontSize: 11,
    color: '#1a1a2e',
    fontWeight: '700',
  },
  rememberText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  forgotText: {
    color: YELLOW,
    fontSize: 14,
    fontWeight: '500',
  },

  // Sign In Button
  signInButton: {
    backgroundColor: YELLOW,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: YELLOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: { opacity: 0.7 },
  signInText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2d3748',
  },
  dividerText: {
    color: GRAY,
    fontSize: 13,
    marginHorizontal: 12,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  socialIcon: {
    fontSize: 18,
  },
  socialText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  registerText: {
    color: GRAY,
    fontSize: 14,
  },
  registerLink: {
    color: YELLOW,
    fontSize: 14,
    fontWeight: '700',
  },
});
