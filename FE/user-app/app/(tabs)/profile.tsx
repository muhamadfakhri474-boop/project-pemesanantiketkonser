// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar, Alert, Switch,
  Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { orderService } from '@/services/order.service';
import AvatarInitial from '@/components/avatar-initial';

const BG = '#0B1120';
const CARD = '#1E293B';
const CARD2 = '#334155';
const YELLOW = '#3B82F6';
const GRAY = '#94A3B8';

type MenuItem =
  | { icon: string; label: string; onPress: () => void; toggle?: never }
  | { icon: string; label: string; toggle: true; value: boolean; onToggle: (v: boolean) => void; onPress?: never };

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [notifEnabled, setNotifEnabled] = useState(true);

  // Real stats
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [ticketsCount, setTicketsCount] = useState<number>(0);

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Modal State
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await orderService.getMyOrders();
        const orders = res?.data || res?.orders || res || [];
        if (Array.isArray(orders)) {
          setOrdersCount(orders.length);
          // Count paid tickets
          let totalTickets = 0;
          orders.forEach((o: any) => {
            if (o.payment_status === 'paid' && o.items) {
              totalTickets += o.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
            }
          });
          setTicketsCount(totalTickets);
        }
      } catch {}
    };

    fetchUserStats();
  }, []);

  const openEditModal = () => {
    setNameInput(user?.name || '');
    setPhoneInput(user?.phone || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Validasi', 'Nama tidak boleh kosong.');
      return;
    }

    try {
      setSavingProfile(true);
      await authService.updateProfile({
        name: nameInput.trim(),
        phone: phoneInput.trim() || undefined,
      });

      await updateUser({
        name: nameInput.trim(),
        phone: phoneInput.trim() || undefined,
      });

      Alert.alert('Sukses', 'Profil berhasil diperbarui!');
      setEditModalVisible(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal memperbarui profil.';
      Alert.alert('Gagal', msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const openPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwdModalVisible(true);
  };

  const handleSavePassword = async () => {
    if (!oldPassword) {
      Alert.alert('Validasi', 'Password lama wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validasi', 'Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validasi', 'Konfirmasi password baru tidak cocok.');
      return;
    }

    try {
      setSavingPwd(true);
      await authService.changePassword(oldPassword, newPassword);
      Alert.alert('Sukses', 'Password berhasil diperbarui!');
      setPwdModalVisible(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal mengubah password. Pastikan password lama sesuai.';
      Alert.alert('Gagal', msg);
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah kamu yakin ingin logout?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          label: 'Edit Profile',
          onPress: openEditModal,
        },
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          onPress: openPasswordModal,
        },
        {
          icon: 'receipt-outline',
          label: 'My Orders',
          onPress: () => router.push('/(tabs)/history' as any),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Push Notifications',
          toggle: true,
          value: notifEnabled,
          onToggle: setNotifEnabled,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle-outline',
          label: 'Help & FAQ',
          onPress: () => Alert.alert('Bantuan', 'Silakan hubungi customer service kami jika ada pertanyaan seputar tiket konser.'),
        },
        {
          icon: 'chatbubble-outline',
          label: 'Contact Support',
          onPress: () => Alert.alert('Kontak Layanan', 'Email: support@crescendo.id\nWhatsApp: +62 812-3456-7890'),
        },
        {
          icon: 'document-text-outline',
          label: 'Terms of Service',
          onPress: () => Alert.alert('Ketentuan Layanan', 'Tiket yang telah dibeli sah dan resmi diterbitkan oleh mitra promotor konser.'),
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Privacy Policy',
          onPress: () => Alert.alert('Kebijakan Privasi', 'Data pribadi dan transaksi kamu terlindungi dengan enkripsi standar industri.'),
        },
      ],
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar + Info */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <AvatarInitial name={user?.name ?? 'U'} size={84} fontSize={34} />
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          {user?.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
          <View style={styles.memberBadge}>
            <Ionicons name="star" size={12} color="#1a1a2e" />
            <Text style={styles.memberBadgeText}>Member</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => router.push('/(tabs)/history' as any)}
          >
            <Text style={styles.statNum}>{ordersCount}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{ticketsCount}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{ordersCount > 0 ? 1 : 0}</Text>
            <Text style={styles.statLabel}>Concerts</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <View key={item.label}>
                  {item.toggle ? (
                    <View style={styles.menuItem}>
                      <View style={styles.menuLeft}>
                        <View style={styles.menuIconBox}>
                          <Ionicons name={item.icon as any} size={18} color={YELLOW} />
                        </View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                      </View>
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: '#374151', true: YELLOW }}
                        thumbColor="#fff"
                      />
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                      <View style={styles.menuLeft}>
                        <View style={styles.menuIconBox}>
                          <Ionicons name={item.icon as any} size={18} color={YELLOW} />
                        </View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={GRAY} />
                    </TouchableOpacity>
                  )}
                  {idx < section.items.length - 1 && (
                    <View style={styles.menuDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Crescendo v1.0.0</Text>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Modal Edit Profile */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profil</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={GRAY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>NAMA LENGKAP</Text>
            <TextInput
              style={styles.textInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={GRAY}
            />

            <Text style={styles.inputLabel}>NOMOR TELEPON</Text>
            <TextInput
              style={styles.textInput}
              value={phoneInput}
              onChangeText={setPhoneInput}
              placeholder="+62 812 3456 7890"
              placeholderTextColor={GRAY}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, savingProfile && styles.btnDisabled]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#1a1a2e" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Simpan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Change Password */}
      <Modal
        visible={pwdModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPwdModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ganti Password</Text>
              <TouchableOpacity onPress={() => setPwdModalVisible(false)}>
                <Ionicons name="close" size={22} color={GRAY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>PASSWORD SAAT INI</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="••••••••"
                placeholderTextColor={GRAY}
                secureTextEntry={!showOldPwd}
              />
              <TouchableOpacity onPress={() => setShowOldPwd(!showOldPwd)}>
                <Ionicons name={showOldPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={GRAY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>PASSWORD BARU</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={GRAY}
                secureTextEntry={!showNewPwd}
              />
              <TouchableOpacity onPress={() => setShowNewPwd(!showNewPwd)}>
                <Ionicons name={showNewPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={GRAY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>KONFIRMASI PASSWORD BARU</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Ulangi password baru"
                placeholderTextColor={GRAY}
                secureTextEntry={!showNewPwd}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPwdModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, savingPwd && styles.btnDisabled]}
                onPress={handleSavePassword}
                disabled={savingPwd}
              >
                {savingPwd ? (
                  <ActivityIndicator color="#1a1a2e" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Perbarui</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 24, paddingTop: 52, paddingBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '700' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: BG,
  },
  userName: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  userEmail: { color: GRAY, fontSize: 14, marginBottom: 2 },
  userPhone: { color: GRAY, fontSize: 13, marginBottom: 10 },
  memberBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: YELLOW, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 4,
  },
  memberBadgeText: { color: '#1a1a2e', fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', backgroundColor: CARD,
    marginHorizontal: 20, borderRadius: 16, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: '#475569',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { color: YELLOW, fontSize: 20, fontWeight: '700' },
  statLabel: { color: GRAY, fontSize: 12 },
  statDivider: { width: 1, backgroundColor: '#475569' },
  section: { marginHorizontal: 20, marginBottom: 16 },
  sectionLabel: {
    color: GRAY, fontSize: 12, fontWeight: '600',
    letterSpacing: 0.8, marginBottom: 8, marginLeft: 4,
  },
  menuCard: {
    backgroundColor: CARD, borderRadius: 16,
    borderWidth: 1, borderColor: '#475569', overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIconBox: {
    width: 36, height: 36, backgroundColor: CARD2,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { color: '#D1D5DB', fontSize: 14 },
  menuDivider: { height: 1, backgroundColor: '#475569', marginHorizontal: 16 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginHorizontal: 20, marginTop: 8,
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  version: { color: '#374151', fontSize: 12, textAlign: 'center', marginTop: 16 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: CARD, borderRadius: 20,
    padding: 20, borderWidth: 1, borderColor: '#475569',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  inputLabel: {
    color: '#9CA3AF', fontSize: 11, fontWeight: '600',
    letterSpacing: 1, marginBottom: 6, marginTop: 12,
  },
  textInput: {
    backgroundColor: CARD2, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    color: '#fff', fontSize: 14, borderWidth: 1, borderColor: '#2d3748',
  },
  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: CARD2, borderRadius: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: '#2d3748',
  },
  passwordInput: { flex: 1, paddingVertical: 12, color: '#fff', fontSize: 14 },
  modalActions: {
    flexDirection: 'row', gap: 12, marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#374151', alignItems: 'center',
  },
  modalCancelText: { color: GRAY, fontSize: 14, fontWeight: '600' },
  modalSaveBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: YELLOW, alignItems: 'center',
  },
  modalSaveText: { color: '#1a1a2e', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
