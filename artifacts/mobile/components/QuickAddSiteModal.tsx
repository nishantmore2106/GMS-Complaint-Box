import React, { useRef } from 'react';
import { View, Text, Modal, ScrollView, Pressable, StyleSheet, Image, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { SoftInput } from '@/components/SoftInput';
import { SoftButton } from '@/components/SoftButton';

interface QuickAddSiteModalProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  setName: (text: string) => void;
  location: string;
  setLocation: (text: string) => void;
  supEmail: string;
  setSupEmail: (text: string) => void;
  clientName: string;
  setClientName: (text: string) => void;
  clientEmail: string;
  setClientEmail: (text: string) => void;
  clientPhone: string;
  setClientPhone: (text: string) => void;
  clientPass: string;
  setClientPass: (text: string) => void;
  clientPhoto: string | null;
  onPickPhoto: () => void;
  loading: boolean;
  onSave: () => void;
}

export function QuickAddSiteModal({
  visible, onClose, name, setName, location, setLocation, supEmail, setSupEmail,
  clientName, setClientName, clientEmail, setClientEmail, clientPhone, setClientPhone,
  clientPass, setClientPass, clientPhoto, onPickPhoto, loading, onSave
}: QuickAddSiteModalProps) {
  // Refs for keyboard navigation
  const locationRef = useRef<TextInput>(null);
  const supEmailRef = useRef<TextInput>(null);
  const clientNameRef = useRef<TextInput>(null);
  const clientEmailRef = useRef<TextInput>(null);
  const clientPhoneRef = useRef<TextInput>(null);
  const clientPassRef = useRef<TextInput>(null);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Facility</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
            <Text style={styles.formSectionTitle}>Site Information</Text>
            <SoftInput 
              label="Site Name" 
              placeholder="e.g. Elite Residences" 
              icon="map" 
              value={name} 
              onChangeText={setName} 
              returnKeyType="next"
              onSubmitEditing={() => locationRef.current?.focus()}
              blurOnSubmit={false}
            />
            <SoftInput 
              ref={locationRef}
              label="Location" 
              placeholder="e.g. Bandra, Mumbai" 
              icon="map-pin" 
              value={location} 
              onChangeText={setLocation} 
              returnKeyType="next"
              onSubmitEditing={() => supEmailRef.current?.focus()}
              blurOnSubmit={false}
            />
            <SoftInput 
              ref={supEmailRef}
              label="Supervisor Email (Optional)" 
              placeholder="assign@company.com" 
              icon="user-check" 
              value={supEmail} 
              onChangeText={setSupEmail} 
              returnKeyType="next"
              onSubmitEditing={() => clientNameRef.current?.focus()}
              blurOnSubmit={false}
            />

            <Text style={[styles.formSectionTitle, { marginTop: 15 }]}>Client Onboarding (Optional)</Text>
            <SoftInput 
              ref={clientNameRef}
              label="Client Name" 
              placeholder="e.g. Mr. Sharma" 
              icon="user" 
              value={clientName} 
              onChangeText={setClientName} 
              returnKeyType="next"
              onSubmitEditing={() => clientEmailRef.current?.focus()}
              blurOnSubmit={false}
            />
            <SoftInput 
              ref={clientEmailRef}
              label="Client Email" 
              placeholder="for login access" 
              icon="mail" 
              value={clientEmail} 
              onChangeText={setClientEmail} 
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => clientPhoneRef.current?.focus()}
              blurOnSubmit={false}
            />
            <SoftInput 
              ref={clientPhoneRef}
              label="Client Phone" 
              placeholder="+1 ..." 
              icon="phone" 
              value={clientPhone} 
              onChangeText={setClientPhone} 
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => clientPassRef.current?.focus()}
              blurOnSubmit={false}
            />
            <SoftInput 
              ref={clientPassRef}
              label="Set Password" 
              placeholder="6+ characters" 
              icon="lock" 
              value={clientPass} 
              onChangeText={setClientPass} 
              secureTextEntry 
              returnKeyType="done"
              onSubmitEditing={onSave}
            />

            <Pressable style={styles.photoPicker} onPress={onPickPhoto}>
              {clientPhoto ? (
                <Image source={{ uri: clientPhoto }} style={styles.previewImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Feather name="camera" size={20} color={Colors.textMuted} />
                  <Text style={styles.photoText}>Add Client Photo</Text>
                </View>
              )}
            </Pressable>
          </ScrollView>

          <View style={styles.modalFooter}>
            <SoftButton title="Cancel" variant="secondary" onPress={onClose} style={styles.modalFooterBtn} />
            <SoftButton
              title={loading ? "Creating..." : "Add Site"}
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
  formSectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 10, marginBottom: 8, opacity: 0.8 },
  photoPicker: { marginVertical: 15, height: 120, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', borderStyle: 'dashed', backgroundColor: 'rgba(0,0,0,0.02)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoPlaceholder: { alignItems: 'center' },
  photoText: { fontSize: 12, color: Colors.textMuted, marginTop: 5 },
  previewImage: { width: '100%', height: '100%' },
});
