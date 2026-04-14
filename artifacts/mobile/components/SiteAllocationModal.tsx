import React, { useState, useMemo } from 'react';
import { View, Text, Modal, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { SoftInput } from './SoftInput';
import { SoftButton } from './SoftButton';

interface SiteAllocationModalProps {
  visible: boolean;
  onClose: () => void;
  sites: any[];
  supervisors: any[];
  onAllocate: (siteId: string, supervisorId: string) => Promise<void>;
  isDarkMode: boolean;
}

export function SiteAllocationModal({
  visible,
  onClose,
  sites,
  supervisors,
  onAllocate,
  isDarkMode
}: SiteAllocationModalProps) {
  const [step, setStep] = useState(1);
  const [searchSite, setSearchSite] = useState('');
  const [searchSup, setSearchSup] = useState('');
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [selectedSup, setSelectedSup] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const filteredSites = useMemo(() => 
    sites.filter(s => s.name.toLowerCase().includes(searchSite.toLowerCase())),
    [sites, searchSite]
  );

  const filteredSups = useMemo(() => 
    supervisors.filter(u => u.name.toLowerCase().includes(searchSup.toLowerCase())),
    [supervisors, searchSup]
  );

  const handleReset = () => {
    setStep(1);
    setSearchSite('');
    setSearchSup('');
    setSelectedSite(null);
    setSelectedSup(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleStep3 = async () => {
    if (!selectedSite || !selectedSup) return;
    setLoading(true);
    try {
      await onAllocate(selectedSite.id, selectedSup.id);
      handleClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(true);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDarkMode && styles.darkCard]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Site Allocation</Text>
              <Text style={styles.modalSubtitle}>Step {step} of 3</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>

          <View style={styles.stepContainer}>
            {step === 1 && (
              <>
                <Text style={[styles.stepLabel, isDarkMode && styles.darkText]}>Select Facility</Text>
                <SoftInput 
                  placeholder="Search site name..."
                  icon="search"
                  value={searchSite}
                  onChangeText={setSearchSite}
                />
                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                  {filteredSites.map(s => (
                    <Pressable 
                      key={s.id} 
                      style={[
                        styles.listItem, 
                        selectedSite?.id === s.id && styles.itemSelected,
                        isDarkMode && styles.darkListItem
                      ]}
                      onPress={() => setSelectedSite(s)}
                    >
                      <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                        <Feather name="map" size={16} color="#3B82F6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, isDarkMode && styles.darkText]}>{s.name}</Text>
                        <Text style={styles.itemSub}>{s.address}</Text>
                      </View>
                      {selectedSite?.id === s.id && <Feather name="check-circle" size={20} color={Colors.primary} />}
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={[styles.stepLabel, isDarkMode && styles.darkText]}>Assign Supervisor</Text>
                <SoftInput 
                  placeholder="Search supervisor name..."
                  icon="search"
                  value={searchSup}
                  onChangeText={setSearchSup}
                />
                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                  {filteredSups.map(u => (
                    <Pressable 
                      key={u.id} 
                      style={[
                        styles.listItem, 
                        selectedSup?.id === u.id && styles.itemSelected,
                        isDarkMode && styles.darkListItem
                      ]}
                      onPress={() => setSelectedSup(u)}
                    >
                      <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
                        <Feather name="user" size={16} color="#10B981" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, isDarkMode && styles.darkText]}>{u.name}</Text>
                        <Text style={styles.itemSub}>{u.email}</Text>
                      </View>
                      {selectedSup?.id === u.id && <Feather name="check-circle" size={20} color={Colors.primary} />}
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {step === 3 && (
              <View style={styles.summaryBox}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Facility</Text>
                    <Text style={[styles.summaryValue, isDarkMode && styles.darkText]}>{selectedSite?.name}</Text>
                    <Text style={styles.summarySub}>{selectedSite?.address}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Target Supervisor</Text>
                    <Text style={[styles.summaryValue, isDarkMode && styles.darkText]}>{selectedSup?.name}</Text>
                    <Text style={styles.summarySub}>{selectedSup?.email}</Text>
                  </View>
                </View>
                <View style={styles.infoNote}>
                  <Feather name="info" size={16} color="#64748B" />
                  <Text style={styles.infoNoteText}>
                    This allocation will be effective immediately. The supervisor will gain access to all historical and pending complaints for this site.
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            {step > 1 && (
              <SoftButton 
                title="Back"
                variant="secondary"
                onPress={() => setStep(step - 1)}
                style={styles.footerBtn}
              />
            )}
            <SoftButton 
              title={step === 3 ? (loading ? 'Allocating...' : 'Finalize Allocation') : 'Continue'}
              onPress={() => {
                if (step === 1 && selectedSite) setStep(2);
                else if (step === 2 && selectedSup) setStep(3);
                else if (step === 3) handleStep3();
              }}
              disabled={(step === 1 && !selectedSite) || (step === 2 && !selectedSup) || loading}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 40, borderTopRightRadius: 40, height: '85%', padding: 24 },
  darkCard: { backgroundColor: Colors.dark.surface },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  modalSubtitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted, marginTop: 2 },
  darkText: { color: 'white' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  progressBar: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  stepContainer: { flex: 1 },
  stepLabel: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827', marginBottom: 16 },
  list: { flex: 1, marginTop: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: 'transparent' },
  darkListItem: { backgroundColor: 'rgba(255,255,255,0.03)' },
  itemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  itemName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#111827' },
  itemSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 20, marginBottom: 20 },
  footerBtn: { flex: 1 },
  summaryBox: { flex: 1, gap: 20 },
  summaryCard: { backgroundColor: '#F8FAFC', borderRadius: 24, padding: 24, gap: 24 },
  summaryItem: { gap: 4 },
  summaryLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 1 },
  summaryValue: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827' },
  summarySub: { fontSize: 13, color: '#64748B' },
  summaryDivider: { height: 1, backgroundColor: '#E2E8F0' },
  infoNote: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#F1F5F9', borderRadius: 16 },
  infoNoteText: { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 18 },
});
