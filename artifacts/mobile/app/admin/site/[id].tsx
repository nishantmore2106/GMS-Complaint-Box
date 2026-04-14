import React, { useMemo, useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Modal, Keyboard, Alert, Image, TextInput, Share } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { ComplaintCard } from '@/components/ComplaintCard';
import * as Haptics from 'expo-haptics';
import { useToast } from '@/components/Toast';
import { SoftCard } from '@/components/SoftCard';
import { SoftButton } from '@/components/SoftButton';
import { SoftInput } from '@/components/SoftInput';
import { DashboardHeader } from '@/components/DashboardHeader';
import { MapPicker } from '@/components/MapPicker';

export default function SiteDetailScreen() {
  const { id } = useLocalSearchParams();
  const { 
    getSiteById, 
    getCompanyComplaints, 
    getUserById, 
    currentUser, 
    users,
    updateSite,
    deleteSite,
    notifications,
    profileImage,
    isDarkMode,
  } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const site = getSiteById(id as string);
  const complaints = useMemo(() => {
    return getCompanyComplaints(site?.companyId || "").filter(c => c.siteId === id);
  }, [site, id, getCompanyComplaints]);

  const supervisor = site?.assignedSupervisorId ? getUserById(site.assignedSupervisorId) : null;
  
  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(site?.name || "");
  const [editAddress, setEditAddress] = useState(site?.address || "");
  const [editClientName, setEditClientName] = useState(site?.clientName || "");
  const [editAuthority, setEditAuthority] = useState(site?.authorityName || "");
  const [editSupEmail, setEditSupEmail] = useState(supervisor?.email || "");
  const [editLat, setEditLat] = useState(site?.latitude ? String(site.latitude) : "");
  const [editLong, setEditLong] = useState(site?.longitude ? String(site.longitude) : "");
  const [editRadius, setEditRadius] = useState(site?.radiusMeters ? String(site.radiusMeters) : "500");
  const [editPhone, setEditPhone] = useState(site?.phone || "");
  const [editLogoUrl, setEditLogoUrl] = useState(site?.logoUrl || "");

  const addressRef = useRef<TextInput>(null);
  const clientNameRef = useRef<TextInput>(null);
  const authorityRef = useRef<TextInput>(null);
  const supEmailRef = useRef<TextInput>(null);
  const latRef = useRef<TextInput>(null);
  const longRef = useRef<TextInput>(null);
  const radiusRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const logoRef = useRef<TextInput>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
    btnLabel?: string;
  } | null>(null);

  if (!site) {
    return (
      <View style={[styles.centered, isDarkMode && styles.darkRoot]}>
        <Feather name="alert-circle" size={48} color={isDarkMode ? Colors.dark.textMuted : '#6B7280'} />
        <Text style={[styles.notFound, isDarkMode && styles.darkText]}>Location data unavailable</Text>
        <SoftButton title="Back to Registry" onPress={() => router.replace("/admin/sites")} isDarkMode={isDarkMode} />
      </View>
    );
  }

  const handleToggleStatus = () => {
    const isSuspended = site.status === 'suspended';
    setConfirmData({
      title: isSuspended ? 'Resume Operations' : 'Suspend Operations',
      message: isSuspended 
        ? 'Activating this site will allow clients to submit new reports.' 
        : 'Suspending this site will temporarily disable report submissions.',
      btnLabel: isSuspended ? 'Resume' : 'Suspend',
      onConfirm: async () => {
        setIsConfirmVisible(false);
        setIsProcessing(true);
        try {
          await updateSite(site.id, { status: isSuspended ? 'active' : 'suspended' });
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast(`Site status updated`, "success");
        } catch (e: any) {
          showToast(e.message || "Update failed", "error");
        } finally {
          setIsProcessing(false);
        }
      }
    });
    setIsConfirmVisible(true);
  };

  const handleDelete = () => {
    setConfirmData({
      title: "Confirm Removal",
      message: "Permanently delete this site? All associated history and reports will be purged from the system.",
      isDestructive: true,
      btnLabel: 'Delete Forever',
      onConfirm: async () => {
        setIsConfirmVisible(false);
        setIsProcessing(true);
        try {
          await deleteSite(site.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast("Site purged successfully", "success");
          router.replace("/admin/sites");
        } catch (e: any) {
          setIsProcessing(false);
          showToast("Deletion failed", "error");
        }
      }
    });
    setIsConfirmVisible(true);
  };

  const onLocationPicked = (data: { latitude: number; longitude: number; address: string }) => {
     setEditLat(String(data.latitude));
     setEditLong(String(data.longitude));
     setEditAddress(data.address);
     if (!editName && data.address) {
        setEditName(data.address.split(',')[0]);
     }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalSupId = site.assignedSupervisorId;
      
      if (editSupEmail.trim()) {
        const existingSup = users.find(u => u.email?.toLowerCase() === editSupEmail.toLowerCase() && u.role === 'supervisor');
        if (existingSup) {
          finalSupId = existingSup.id;
        } else {
          showToast("Invitation sent to new supervisor", "success");
          finalSupId = null;
        }
      } else {
        finalSupId = null;
      }

      await updateSite(site.id, {
        name: editName,
        address: editAddress,
        clientName: editClientName,
        assignedSupervisorId: finalSupId || undefined,
        latitude: editLat ? parseFloat(editLat) : null,
        longitude: editLong ? parseFloat(editLong) : null,
        radiusMeters: editRadius ? parseInt(editRadius) : null,
        phone: editPhone || null,
        logoUrl: editLogoUrl || null
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Intelligence updated", "success");
      setIsEditing(false);
    } catch (e: any) {
      showToast(e.message || "Update failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const pending = complaints.filter(c => c.status === 'pending').length;
  const activeCount = complaints.filter(c => c.status === 'in_progress').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;

  return (
    <>
      <View style={[styles.root, isDarkMode && styles.darkRoot]}>
        <DashboardHeader 
          title="Location Intel"
          subtitle={site.name}
          showBack
          rightElement={
            currentUser?.role === 'founder' && (
              <Pressable style={[styles.editBtn, isDarkMode && styles.darkEditBtn]} onPress={() => setIsEditing(true)}>
                 <Feather name="edit-3" size={18} color={isDarkMode ? 'white' : Colors.primary} />
              </Pressable>
            )
          }
        />

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        >
          <View style={[styles.mainCard, isDarkMode && styles.darkCard]}>
            <View style={styles.cardHeader}>
               <View style={styles.nameSection}>
                  <Text style={[styles.siteName, isDarkMode && styles.darkText]}>{site.name}</Text>
                  <View style={[styles.statusPill, { backgroundColor: site.status === 'suspended' ? (isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2') : (isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5') }]}>
                    <Text style={[styles.statusText, { color: site.status === 'suspended' ? '#EF4444' : '#10B981' }]}>
                      {site.status === 'active' ? 'ACTIVE' : 'SUSPENDED'}
                    </Text>
                  </View>
               </View>
            </View>

            <View style={styles.locRow}>
               <Feather name="map-pin" size={14} color={isDarkMode ? Colors.dark.textMuted : '#9CA3AF'} />
               <Text style={[styles.address, isDarkMode && styles.darkTextSub]}>{site.address || "Generic location"}</Text>
            </View>

            <View style={[styles.metaDivider, isDarkMode && { backgroundColor: Colors.dark.border }]} />
            
            <View style={styles.metaStats}>
                <View style={styles.metaBox}>
                   <Text style={[styles.metaLab, isDarkMode && styles.darkTextMuted]}>CLIENT REPRESENTATIVE</Text>
                   <Text style={[styles.metaVal, isDarkMode && styles.darkText]}>{site.clientName || "—"}</Text>
                </View>
                <View style={styles.metaBox}>
                   <Text style={[styles.metaLab, isDarkMode && styles.darkTextMuted]}>AUTHORITY LEVEL</Text>
                   <Text style={[styles.metaVal, isDarkMode && styles.darkText]}>{site.authorityName || "Standard"}</Text>
                </View>
            </View>
          </View>

          <View style={styles.section}>
             <Text style={[styles.sectionLabel, isDarkMode && styles.darkTextMuted]}>SUPERVISION & ACCESS</Text>
             <View style={styles.statsGrid}>
                <View style={[styles.statCard, isDarkMode && styles.darkCard]}>
                   <Text style={[styles.statLab, isDarkMode && styles.darkTextMuted]}>IN CHARGE</Text>
                   {supervisor ? (
                      <View style={styles.supMini}>
                         <View style={[styles.supAvatar, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }]}>
                            <Text style={[styles.supInitials, isDarkMode && { color: 'white' }]}>{supervisor.name.substring(0, 2).toUpperCase()}</Text>
                         </View>
                         <View style={styles.supInfoGroup}>
                            <Text style={[styles.supName, isDarkMode && styles.darkText]} numberOfLines={1}>{supervisor.name}</Text>
                            <Text style={[styles.supEmail, isDarkMode && styles.darkTextSub]} numberOfLines={1}>{supervisor.email || supervisor.phone}</Text>
                         </View>
                      </View>
                   ) : (
                      <View style={styles.supMini}>
                         <View style={[styles.supAvatar, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2' }]}>
                            <Feather name="user-x" size={14} color="#EF4444" />
                         </View>
                         <Text style={styles.unassigned}>Unassigned</Text>
                      </View>
                   )}
                </View>
             </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, isDarkMode && styles.darkTextMuted]}>PERFORMANCE METRICS</Text>
            <View style={styles.metricsRow}>
              <View style={[styles.metricBox, isDarkMode && styles.darkCard]}>
                 <Text style={[styles.metricVal, { color: '#F97316' }]}>{pending}</Text>
                 <Text style={[styles.metricLab, isDarkMode && styles.darkTextMuted]}>PENDING</Text>
              </View>
              <View style={[styles.metricBox, isDarkMode && styles.darkCard]}>
                 <Text style={[styles.metricVal, { color: '#3B82F6' }]}>{activeCount}</Text>
                 <Text style={[styles.metricLab, isDarkMode && styles.darkTextMuted]}>ACTIVE</Text>
              </View>
              <View style={[styles.metricBox, isDarkMode && styles.darkCard]}>
                 <Text style={[styles.metricVal, { color: '#10B981' }]}>{resolved}</Text>
                 <Text style={[styles.metricLab, isDarkMode && styles.darkTextMuted]}>FIXED</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
             <Text style={[styles.sectionLabel, isDarkMode && styles.darkTextMuted]}>SITE QR IDENTITY</Text>
             <View style={[styles.qrCard, isDarkMode && styles.darkCard]}>
                <View style={styles.qrContentWrapper}>
                   <View style={styles.qrImageFrame}>
                      <Image 
                         source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://gms-complaint-box.netlify.app/public/scan/${site.id}` }} 
                         style={styles.qrImage}
                      />
                   </View>
                   <View style={styles.qrInfoGroup}>
                      <Text style={[styles.qrTitle, isDarkMode && styles.darkText]}>Anonymous Portal</Text>
                      <Text style={[styles.qrSub, isDarkMode && styles.darkTextSub]}>Scan this code to report issues instantly at this site.</Text>
                      <Pressable 
                         style={[styles.qrShareBtn, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }]}
                         onPress={() => {
                            const url = `https://gms-complaint-box.netlify.app/public/scan/${site.id}`;
                            Share.share({
                               message: `GMS Facility QR Desk: ${site.name}. Scan here to report cleaning or behavior issues: ${url}`,
                               url: url
                            });
                         }}
                      >
                         <Feather name="share-2" size={14} color={Colors.primary} />
                         <Text style={styles.qrShareText}>Share Portal Link</Text>
                      </Pressable>
                   </View>
                </View>
             </View>
          </View>

          <View style={styles.section}>
             <View style={styles.historyHeader}>
                <Text style={[styles.sectionLabel, isDarkMode && styles.darkTextMuted]}>ACTIVITY ARCHIVE</Text>
                <Text style={[styles.historyCount, isDarkMode && styles.darkTextMuted]}>{complaints.length} Records</Text>
             </View>
             {complaints.length === 0 ? (
               <View style={[styles.emptyCard, isDarkMode && styles.darkCard]}>
                  <Feather name="shield-off" size={24} color={isDarkMode ? Colors.dark.textMuted : '#9CA3AF'} />
                  <Text style={[styles.emptyText, isDarkMode && styles.darkTextSub]}>No reports documented for this site.</Text>
               </View>
             ) : (
               <View style={styles.list}>
                  {complaints.map(c => <ComplaintCard key={c.id} complaint={c} />)}
               </View>
             )}
          </View>

          {currentUser?.role === 'founder' && (
            <View style={[styles.section, { marginTop: 16 }]}>
                <View style={[styles.dangerZone, isDarkMode && styles.darkCard]}>
                  <Text style={styles.dangerTitle}>System Operations</Text>
                  <View style={styles.btnStack}>
                     <SoftButton 
                       variant="secondary"
                       title={site.status === 'active' ? "Suspend Services" : "Restore Services"}
                       onPress={handleToggleStatus}
                       style={styles.actionBtn}
                       isDarkMode={isDarkMode}
                     />
                     <SoftButton 
                       variant="outline"
                       title="Purge Location Meta"
                       onPress={handleDelete}
                       style={styles.actionBtn}
                       isDarkMode={isDarkMode}
                     />
                  </View>
                </View>
            </View>
          )}
        </ScrollView>

        <Modal visible={isEditing} animationType="fade" transparent>
          <View style={styles.overlay}>
             <View style={[styles.editCard, isDarkMode && styles.darkCard]}>
                 <View style={[styles.modalHeader, { paddingRight: 8 }]}>
                    <View style={{ flex: 1 }}>
                       <Text style={[styles.modalHeadline, isDarkMode && styles.darkText]}>Refine Details</Text>
                    </View>
                    <Pressable onPress={() => setIsEditing(false)} style={[styles.closeBtn, isDarkMode && styles.darkEditBtn, { marginLeft: 12 }]}>
                      <Feather name="x" size={20} color={isDarkMode ? 'white' : '#6B7280'} />
                    </Pressable>
                 </View>
                 <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                    <View style={{ gap: 24, padding: 4 }}>
                       <SoftInput label="Site Nomenclature" value={editName} onChangeText={setEditName} icon="type" isDarkMode={isDarkMode} returnKeyType="next" onSubmitEditing={() => addressRef.current?.focus()} />
                       
                       <View style={styles.mapActionRow}>
                          <Text style={[styles.sectionLabel, { marginLeft: 0, marginBottom: 0 }]}>Geographic Intel</Text>
                          <Pressable style={styles.inlineMapBtn} onPress={() => setIsMapVisible(true)}>
                             <Feather name="map" size={14} color="white" />
                             <Text style={styles.inlineMapBtnText}>Pick from Google Maps</Text>
                          </Pressable>
                       </View>

                       <SoftInput 
                          ref={addressRef} 
                          label="Geographical Address" 
                          value={editAddress} 
                          onChangeText={setEditAddress} 
                          icon="map-pin" 
                          rightIcon="map"
                          onRightIconPress={() => setIsMapVisible(true)}
                          isDarkMode={isDarkMode} 
                          returnKeyType="next" 
                          onSubmitEditing={() => phoneRef.current?.focus()} 
                       />
                       
                       <View style={{ flexDirection: 'row', gap: 12 }}>
                          <View style={{ flex: 1 }}>
                             <SoftInput ref={phoneRef} label="Site Phone" value={editPhone} onChangeText={setEditPhone} icon="phone" isDarkMode={isDarkMode} keyboardType="phone-pad" returnKeyType="next" onSubmitEditing={() => logoRef.current?.focus()} />
                          </View>
                          <View style={{ flex: 1 }}>
                             <SoftInput ref={logoRef} label="Site Logo URL" value={editLogoUrl} onChangeText={setEditLogoUrl} icon="image" isDarkMode={isDarkMode} keyboardType="url" autoCapitalize="none" returnKeyType="next" onSubmitEditing={() => clientNameRef.current?.focus()} />
                          </View>
                       </View>

                       <SoftInput ref={clientNameRef} label="Client Point of Contact" value={editClientName} onChangeText={setEditClientName} icon="user" isDarkMode={isDarkMode} returnKeyType="next" onSubmitEditing={() => authorityRef.current?.focus()} />
                       <SoftInput ref={authorityRef} label="Authority / Sub-Org" value={editAuthority} onChangeText={setEditAuthority} icon="shield" isDarkMode={isDarkMode} returnKeyType="next" onSubmitEditing={() => latRef.current?.focus()} />
                       
                       <View style={{ flexDirection: 'row', gap: 12 }}>
                          <View style={{ flex: 1 }}>
                             <SoftInput ref={latRef} label="Latitude" value={editLat} onChangeText={setEditLat} icon="crosshair" isDarkMode={isDarkMode} keyboardType="numeric" returnKeyType="next" onSubmitEditing={() => longRef.current?.focus()} />
                          </View>
                          <View style={{ flex: 1 }}>
                             <SoftInput ref={longRef} label="Longitude" value={editLong} onChangeText={setEditLong} icon="maximize" isDarkMode={isDarkMode} keyboardType="numeric" returnKeyType="next" onSubmitEditing={() => radiusRef.current?.focus()} />
                          </View>
                       </View>

                       <SoftInput ref={radiusRef} label="Scan Radius (Meters)" value={editRadius} onChangeText={setEditRadius} icon="aperture" isDarkMode={isDarkMode} keyboardType="numeric" returnKeyType="next" onSubmitEditing={() => supEmailRef.current?.focus()} />
                       
                       <View style={styles.assignArea}>
                          <Text style={[styles.assignLabel, isDarkMode && styles.darkTextMuted]}>RESPONSIBLE SUPERVISOR</Text>
                          <View style={[styles.inviteSection, isDarkMode && styles.darkInviteSection]}>
                              <Text style={[styles.inviteHint, isDarkMode && styles.darkTextSub]}>
                                  Enter the email of an existing supervisor to assign them, or a new email to invite them to the platform.
                              </Text>
                              <SoftInput 
                                 ref={supEmailRef}
                                 placeholder="supervisor@company.com"
                                 icon="mail"
                                 value={editSupEmail}
                                 onChangeText={setEditSupEmail}
                                 keyboardType="email-address"
                                 autoCapitalize="none"
                                 isDarkMode={isDarkMode}
                                 returnKeyType="done"
                                 onSubmitEditing={handleSave}
                              />
                           </View>
                       </View>
                    </View>
                 </ScrollView>
                 <SoftButton title={isSaving ? "Synchronizing..." : "Apply Changes"} onPress={handleSave} loading={isSaving} isDarkMode={isDarkMode} />
             </View>
          </View>
        </Modal>

        <Modal visible={isConfirmVisible} animationType="fade" transparent>
          <View style={styles.overlay}>
             <View style={[styles.confirmCard, isDarkMode && styles.darkCard]}>
                <View style={styles.confirmHeader}>
                   <View style={[styles.confirmIcon, { backgroundColor: confirmData?.isDestructive ? '#FEF2F2' : '#F0FDF4' }]}>
                      <Feather name={confirmData?.isDestructive ? "alert-octagon" : "help-circle"} size={32} color={confirmData?.isDestructive ? '#EF4444' : '#10B981'} />
                   </View>
                   <Text style={[styles.confirmTitle, isDarkMode && styles.darkText]}>{confirmData?.title}</Text>
                   <Text style={[styles.confirmMsg, isDarkMode && styles.darkTextSub]}>{confirmData?.message}</Text>
                </View>
                <View style={styles.confirmActions}>
                   <Pressable style={[styles.modalCancel, isDarkMode && styles.darkEditBtn]} onPress={() => setIsConfirmVisible(false)}>
                      <Text style={[styles.cancelTxt, isDarkMode && styles.darkText]}>Back</Text>
                   </Pressable>
                   <SoftButton 
                     title={confirmData?.btnLabel || "Confirm"} 
                     onPress={confirmData?.onConfirm || (() => {})} 
                     variant={confirmData?.isDestructive ? 'secondary' : 'primary'}
                     style={styles.confirmBtn}
                     isDarkMode={isDarkMode}
                   />
                </View>
             </View>
          </View>
        </Modal>

        <Modal visible={isProcessing} transparent animationType="fade">
          <View style={[styles.overlay, isDarkMode && { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
             <View style={[styles.loader, isDarkMode && styles.darkCard]}>
                <Feather name="refresh-cw" size={32} color={isDarkMode ? 'white' : '#111827'} />
                <Text style={[styles.loaderTxt, isDarkMode && styles.darkText]}>Updating infrastructure...</Text>
             </View>
          </View>
        </Modal>
      </View>

      <MapPicker 
        isVisible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        onConfirm={onLocationPicked}
        initialLocation={site?.latitude && site?.longitude ? { latitude: site.latitude, longitude: site.longitude } : undefined}
        isDarkMode={isDarkMode}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  darkRoot: { backgroundColor: Colors.dark.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24, backgroundColor: '#F8F9FB' },
  notFound: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#6B7280' },
  editBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  scroll: { paddingHorizontal: 24, gap: 24, paddingTop: 20 },
  
  mainCard: { padding: 32, gap: 20, borderRadius: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 4 },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1, shadowOpacity: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nameSection: { flex: 1, gap: 10 },
  siteName: { fontSize: 28, fontFamily: 'Inter_900Black', color: '#111827' },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  statusText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  address: { fontSize: 15, fontFamily: 'Inter_500Medium', color: '#6B7280', flex: 1 },
  metaDivider: { height: 1.5, backgroundColor: 'rgba(0,0,0,0.03)' },
  metaStats: { flexDirection: 'row', gap: 32 },
  metaBox: { gap: 6 },
  metaLab: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 0.8 },
  metaVal: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#111827' },
  
  section: { gap: 16 },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 1.5, marginLeft: 8 },
  statsGrid: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, padding: 24, gap: 12, borderRadius: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 4 },
  statLab: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF' },
  supMini: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  supAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  supInitials: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#4B5563' },
  supInfoGroup: { flex: 1, gap: 2 },
  supName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#111827' },
  supEmail: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  unassigned: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#F97316', fontStyle: 'italic' },
  
  metricsRow: { flexDirection: 'row', gap: 16 },
  metricBox: { flex: 1, padding: 24, alignItems: 'center', gap: 8, borderRadius: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 4 },
  metricVal: { fontSize: 28, fontFamily: 'Inter_900Black' },
  metricLab: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF' },
  
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyCount: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#9CA3AF' },
  emptyCard: { padding: 60, alignItems: 'center', gap: 16, borderRadius: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 4 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: '#9CA3AF' },
  list: { gap: 16 },
  
  dangerZone: { padding: 32, gap: 24, borderRadius: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 4 },
  dangerTitle: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#EF4444' },
  btnStack: { gap: 16 },
  actionBtn: { height: 60, borderRadius: 20 },
  
  overlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  editCard: { width: '100%', padding: 32, gap: 24, borderRadius: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHeadline: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  
  assignArea: { gap: 16 },
  assignLabel: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', marginLeft: 16 },
  inviteSection: { marginTop: 4, gap: 12, backgroundColor: 'white', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.02, shadowRadius: 20, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
  inviteHint: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280', lineHeight: 20 },
  
  confirmCard: { width: '100%', padding: 32, gap: 32, borderRadius: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
  confirmHeader: { alignItems: 'center', gap: 20, paddingVertical: 10 },
  confirmIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  confirmTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  confirmMsg: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#4B5563', textAlign: 'center', lineHeight: 24 },
  confirmActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  modalCancel: { flex: 1, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelTxt: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#111827' },
  confirmBtn: { flex: 1.5, height: 60, borderRadius: 20 },
  
  loader: { padding: 48, alignItems: 'center', gap: 24, borderRadius: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
  loaderTxt: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  
  mapActionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 12
  },
  inlineMapBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#146A65', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 16,
    shadowColor: '#146A65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  inlineMapBtnText: { color: 'white', fontSize: 13, fontFamily: 'Inter_800ExtraBold' },

  darkText: { color: 'white' },
  darkTextSub: { color: Colors.dark.textSub },
  darkTextMuted: { color: Colors.dark.textMuted },
  darkInviteSection: { backgroundColor: Colors.dark.surfaceElevated, borderColor: Colors.dark.border },
  darkEditBtn: { backgroundColor: Colors.dark.surfaceElevated },

  qrCard: { padding: 24, borderRadius: 24, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 4 },
  qrContentWrapper: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  qrImageFrame: { padding: 12, backgroundColor: '#F8FAFB', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  qrImage: { width: 100, height: 100 },
  qrInfoGroup: { flex: 1, gap: 8 },
  qrTitle: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827' },
  qrSub: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#6B7280', lineHeight: 18 },
  qrShareBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start', marginTop: 4 },
  qrShareText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary },
});
