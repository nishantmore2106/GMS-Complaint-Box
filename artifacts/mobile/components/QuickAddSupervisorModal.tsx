import React, { useRef } from 'react';
import { View, Text, Modal, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { SoftInput } from '@/components/SoftInput';
import { SoftButton } from '@/components/SoftButton';

interface QuickAddSupervisorModalProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  setName: (text: string) => void;
  email: string;
  setEmail: (text: string) => void;
  phone: string;
  setPhone: (text: string) => void;
  pass: string;
  setPass: (text: string) => void;
  loading: boolean;
  onSave: () => void;
}

export function QuickAddSupervisorModal({
  visible, onClose, name, setName, email, setEmail, phone, setPhone, pass, setPass, loading, onSave
}: QuickAddSupervisorModalProps) {
  // Refs for keyboard navigation
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Supervisor</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
            <SoftInput
              label="Full Name"
              placeholder="e.g. John Doe"
              icon="user"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              blurOnSubmit={false}
            />
            <SoftInput
              ref={emailRef}
              label="Email Address"
              placeholder="john@company.com"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
            />
            <SoftInput
              ref={phoneRef}
              label="Phone Number"
              placeholder="+1 234 567 8900"
              icon="phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
              blurOnSubmit={false}
            />
            <SoftInput
              ref={passRef}
              label="Initial Password"
              placeholder="Require 6+ characters"
              icon="lock"
              value={pass}
              onChangeText={setPass}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={onSave}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <SoftButton
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.modalFooterBtn}
            />
            <SoftButton
              title={loading ? "Creating..." : "Create Account"}
              onPress={onSave}
              loading={loading}
              style={styles.modalFooterBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, maxHeight: '90%', padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  modalForm: { gap: 16, paddingBottom: 24 },
  modalFooter: { flexDirection: 'row', gap: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  modalFooterBtn: { flex: 1, marginHorizontal: 5 },
});
