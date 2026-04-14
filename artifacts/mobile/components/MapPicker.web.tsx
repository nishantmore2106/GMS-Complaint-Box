import React from 'react';
import { StyleSheet, View, Text, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MapPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (data: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
  isDarkMode?: boolean;
}

export const MapPicker = ({ isVisible, onClose, isDarkMode = false }: MapPickerProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <View style={[styles.overlay, isDarkMode && styles.darkOverlay]}>
        <View style={[styles.container, isDarkMode && styles.darkContainer, { paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.header}>
             <Text style={[styles.title, isDarkMode && styles.darkText]}>Location Picker</Text>
             <Pressable onPress={onClose} style={[styles.closeBtn, isDarkMode && styles.darkBtn]}>
                <Feather name="x" size={24} color={isDarkMode ? 'white' : '#111827'} />
             </Pressable>
          </View>

          <View style={styles.content}>
             <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : '#EFF6FF' }]}>
                <Feather name="map" size={40} color={Colors.primary} />
             </View>
             <Text style={[styles.headline, isDarkMode && styles.darkText]}>Mobile Feature Only</Text>
             <Text style={[styles.description, isDarkMode && styles.darkTextSub]}>
                The interactive map picker is currently optimized for iOS and Android. 
                Please use the mobile application to pick precise locations on a map.
             </Text>
             
             <View style={[styles.tipCard, isDarkMode && styles.darkTipCard]}>
                <Feather name="info" size={16} color={isDarkMode ? Colors.dark.textMuted : '#6B7280'} />
                <Text style={[styles.tipText, isDarkMode && styles.darkTextSub]}>
                   You can still manually enter Latitude and Longitude in the form fields.
                </Text>
             </View>

             <Pressable style={styles.actionBtn} onPress={onClose}>
                <Text style={styles.actionBtnText}>Go Back</Text>
             </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  darkOverlay: { backgroundColor: 'rgba(0,0,0,0.8)' },
  container: { backgroundColor: 'white', borderRadius: 32, width: '100%', maxWidth: 450, overflow: 'hidden' },
  darkContainer: { backgroundColor: '#1A202C' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  darkBtn: { backgroundColor: '#2D3748' },
  content: { padding: 32, alignItems: 'center', gap: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  headline: { fontSize: 22, fontFamily: 'Inter_900Black', color: '#111827' },
  description: { fontSize: 15, fontFamily: 'Inter_500Medium', color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFB', padding: 16, borderRadius: 16, marginTop: 12 },
  darkTipCard: { backgroundColor: '#2D3748' },
  tipText: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#6B7280' },
  actionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 100, marginTop: 12 },
  actionBtnText: { color: 'white', fontSize: 16, fontFamily: 'Inter_800ExtraBold' },
  darkText: { color: 'white' },
  darkTextSub: { color: '#A0AEC0' },
});
