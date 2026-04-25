import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Platform 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { SoftButton } from './SoftButton';

interface ClientTermsModalProps {
  visible: boolean;
  onAccept: () => void;
  isDarkMode: boolean;
}

export const ClientTermsModal = ({ visible, onAccept, isDarkMode }: ClientTermsModalProps) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Feather name="shield" size={24} color="#4F46E5" />
            </View>
            <Text style={[styles.title, isDarkMode && styles.darkText]}>Security & Privacy Agreement</Text>
            <Text style={[styles.subtitle, isDarkMode && styles.darkTextSub]}>Welcome to GMS Complaint Box Platform</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
            <Text style={[styles.legalText, isDarkMode && styles.darkTextSub]}>
              To ensure the highest standards of operational integrity and data privacy, we require all clients to acknowledge our security protocols.
            </Text>

            <View style={styles.section}>
              <View style={styles.bullet}>
                <Feather name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.bulletText, isDarkMode && styles.darkTextSub]}>
                  <Text style={styles.boldText}>Data Isolation:</Text> Your site data is strictly isolated using Row Level Security (RLS). You can only access information related to your assigned facility.
                </Text>
              </View>

              <View style={styles.bullet}>
                <Feather name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.bulletText, isDarkMode && styles.darkTextSub]}>
                  <Text style={styles.boldText}>Geofence Verification:</Text> GMS uses GPS-based geofencing to ensure reports are only filed when personnel are physically present. This ensures 100% data integrity.
                </Text>
              </View>

              <View style={styles.bullet}>
                <Feather name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.bulletText, isDarkMode && styles.darkTextSub]}>
                  <Text style={styles.boldText}>Mutual Privacy:</Text> No personally identifiable information (PII) is shared outside of operational requirements. Every interaction is encrypted and logged.
                </Text>
              </View>

              <View style={styles.bullet}>
                <Feather name="check-circle" size={16} color="#10B981" />
                <Text style={[styles.bulletText, isDarkMode && styles.darkTextSub]}>
                  <Text style={styles.boldText}>Evidence Trails:</Text> All resolutions require photographic evidence, providing you with a verifiable audit trail for your facility's maintenance.
                </Text>
              </View>
            </View>

            <View style={styles.disclaimer}>
              <Text style={[styles.disclaimerText, isDarkMode && styles.darkTextSub]}>
                By accepting, you agree to these operational protocols designed for the mutual protection of your site and GMS service standards.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable 
              style={styles.checkboxRow} 
              onPress={() => setIsChecked(!isChecked)}
            >
              <View style={[
                styles.checkbox, 
                isChecked && styles.checked,
                isDarkMode && styles.darkBorder
              ]}>
                {isChecked && <Feather name="check" size={14} color="white" />}
              </View>
              <Text style={[styles.checkboxText, isDarkMode && styles.darkText]}>
                I have read and agree to the platform security terms.
              </Text>
            </Pressable>

            <SoftButton 
              title="Get Started" 
              disabled={!isChecked}
              onPress={onAccept}
              style={[styles.acceptBtn, !isChecked && { opacity: 0.5 }]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: 'white',
    borderRadius: 40,
    padding: 32,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30 },
      android: { elevation: 12 }
    })
  },
  darkCard: {
    backgroundColor: Colors.dark.surface,
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_900Black',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#6366F1',
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  legalText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    gap: 16,
    marginBottom: 20,
  },
  bullet: {
    flexDirection: 'row',
    gap: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#374151',
    lineHeight: 20,
  },
  boldText: {
    fontFamily: 'Inter_800ExtraBold',
    color: '#111827',
  },
  disclaimer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  disclaimerText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    gap: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#374151',
  },
  acceptBtn: {
    height: 60,
    borderRadius: 20,
  },
  darkText: { color: 'white' },
  darkTextSub: { color: Colors.dark.textSub },
  darkBorder: { borderColor: Colors.dark.borderStrong },
});
