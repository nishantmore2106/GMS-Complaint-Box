import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftCard } from "@/components/SoftCard";
import { SoftButton } from "@/components/SoftButton";
import { SoftInput } from "@/components/SoftInput";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function SupervisorAdminScreen() {
  const { 
    currentUser, 
    companies, 
    users, 
    sites,
    complaints,
    selectedCompanyId,
    getCompanySites, 
    deleteUser, 
    updateUser,
    assignSupervisorToSite,
    notifications,
    profileImage,
    isDarkMode,
    loadMoreUsers,
    refreshData,
    resetUserPassword
  } = useApp();
  
  const insets = useSafeAreaInsets();
  const unreadNotifs = notifications.filter(n => !n.isRead).length;
  const [selectedCid, setSelectedCid] = useState<string | null>(selectedCompanyId);
  
  // Edit Modal State
  const [editingSup, setEditingSup] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSites, setEditSites] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Delete Modal State
  const [deleteConfirmSup, setDeleteConfirmSup] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isDeletingRef = useRef(false);
  const editPhoneRef = useRef<TextInput>(null);

  const companySupervisors = useMemo(() => {
    return users.filter(u => u.status !== 'deleted' && u.role !== 'client' && (!selectedCid || u.companyId === selectedCid));
  }, [users, selectedCid]);

  const companySites = useMemo(() => {
    return selectedCid ? getCompanySites(selectedCid) : sites;
  }, [selectedCid, getCompanySites, sites]);

  const handleEdit = (sup: any) => {
    setEditingSup(sup);
    setEditName(sup.name);
    setEditPhone(sup.phone);
    const assigned = sites.filter(s => s.assignedSupervisorId === sup.id).map(s => s.id);
    setEditSites(assigned);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refreshData();
    } catch (e) {
      console.error("[Supervisors] Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || companySupervisors.length < 20) return;
    setLoadingMore(true);
    await loadMoreUsers({ companyId: selectedCid });
    setLoadingMore(false);
  };

  const saveEdit = async () => {
    if (!editingSup) return;
    setIsSaving(true);
    try {
      await updateUser(editingSup.id, { name: editName, phone: editPhone });
      const currentAssigned = sites.filter(s => s.assignedSupervisorId === editingSup.id).map(s => s.id);
      const toRemove = currentAssigned.filter(id => !editSites.includes(id));
      const toAdd = editSites.filter(id => !currentAssigned.includes(id));

      await Promise.all([
        ...toRemove.map(sid => assignSupervisorToSite(sid, null)),
        ...toAdd.map(sid => assignSupervisorToSite(sid, editingSup.id))
      ]);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Keyboard.dismiss();
      setEditingSup(null);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update supervisor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingSup) return;
    Alert.alert(
      "Confirm Password Reset",
      `Are you sure you want to reset the password for ${editingSup.name} to "dmore2912"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Now", 
          style: "destructive",
          onPress: async () => {
            setIsSaving(true);
            try {
              await resetUserPassword(editingSup.id, "dmore2912");
              Alert.alert("Success", "Password has been reset to: dmore2912");
              setEditingSup(null);
            } catch (err: any) {
              Alert.alert("Reset Failed", err.message || "Failed to reset password.");
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!deleteConfirmSup) return;
    setIsDeleting(true);
    isDeletingRef.current = true;
    
    console.log(`[Supervisors] Initiating delete for: ${deleteConfirmSup.name} (${deleteConfirmSup.id})`);
    
    // Safety timeout to prevent permanent "Removing..." state
    const timeoutId = setTimeout(() => {
      if (isDeletingRef.current) {
        console.warn("[Supervisors] Deletion safety timeout reached (30s)");
        setIsDeleting(false);
        isDeletingRef.current = false;
        setDeleteConfirmSup(null); // Force close modal
        Alert.alert("Still Processing", "The deletion is taking longer than expected, but it is likely still running in the background. Please wait a moment and refresh.");
      }
    }, 30000); // 30 seconds

    try {
      await deleteUser(deleteConfirmSup.id);
      console.log("[Supervisors] Delete successful");
      clearTimeout(timeoutId);
      isDeletingRef.current = false;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDeleteConfirmSup(null);
    } catch (err: any) {
      console.error("[Supervisors] Delete failed:", err);
      clearTimeout(timeoutId);
      isDeletingRef.current = false;
      Alert.alert("Error", err.message || "Failed to remove personnel");
    } finally {
      setIsDeleting(false);
      isDeletingRef.current = false;
    }
  };

  const handleDelete = (sup: any) => {
    setDeleteConfirmSup(sup);
  };

  const renderSupervisorItem = ({ item: sup }: { item: any }) => {
    const relevant = complaints.filter(c => c.supervisorId === sup.id && c.rating);
    const avgRating = relevant.length > 0 
        ? (relevant.reduce((acc, c) => acc + (c.rating || 0), 0) / relevant.length).toFixed(1)
        : "N/A";

    const solved = complaints.filter(c => c.supervisorId === sup.id && c.status === 'resolved');
    
    return (
      <SoftCard key={sup.id} style={styles.supCard}>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
              <Text style={[styles.supName, isDarkMode && { color: 'white' }]}>{sup.name}</Text>
              <View style={[styles.idBadge, isDarkMode && { backgroundColor: 'rgba(20,106,101,0.2)' }]}>
                <Text style={styles.idText}>{sup.displayId}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: sup.role === 'founder' ? 'rgba(253,224,71,0.1)' : (sup.role === 'supervisor' ? 'rgba(99,102,241,0.1)' : 'rgba(20,106,101,0.1)'), borderColor: sup.role === 'founder' ? '#FDE047' : (sup.role === 'supervisor' ? '#818CF8' : '#146A65') }]}>
                <Text style={[styles.idText, { color: sup.role === 'founder' ? '#A16207' : (sup.role === 'supervisor' ? '#4338CA' : '#146A65') }, isDarkMode && { color: sup.role === 'founder' ? '#FDE047' : (sup.role === 'supervisor' ? '#818CF8' : '#146A65') }]}>{sup.role.toUpperCase()}</Text>
              </View>
          </View>
          
          <Text style={[styles.supPhone, isDarkMode && { color: Colors.dark.textSub }]}>{sup.phone || "No contact info"}</Text>
          
          <View style={[styles.metricsRow, isDarkMode && { borderTopColor: Colors.dark.border }]}>
            <View style={[styles.metric, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : Colors.primaryMuted }]}>
              <Feather name="star" size={12} color={isDarkMode ? '#60A5FA' : Colors.primary} fill={isDarkMode ? '#60A5FA' : Colors.primary} />
              <Text style={[styles.metricText, { color: isDarkMode ? '#60A5FA' : Colors.primary }]}>{avgRating}</Text>
            </View>

            <View style={[styles.metric, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : Colors.resolved + '15' }]}>
              <Feather name="check-circle" size={12} color={isDarkMode ? '#10B981' : Colors.resolved} />
              <Text style={[styles.metricText, { color: isDarkMode ? '#10B981' : Colors.resolved }]}>{solved.length} Solved</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actions}>
          <Pressable style={[styles.editBtn, isDarkMode && { backgroundColor: 'rgba(59,130,246,0.1)' }]} onPress={() => handleEdit(sup)}>
            <Feather name="edit-3" size={18} color={isDarkMode ? '#60A5FA' : Colors.inProgress} />
          </Pressable>
          <Pressable 
            style={[styles.deleteBtn, isDarkMode && { backgroundColor: 'rgba(239,68,68,0.1)' }]} 
            onPress={() => handleDelete(sup)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </Pressable>
        </View>
      </SoftCard>
    );
  };

  return (
    <View style={[styles.root, isDarkMode && styles.darkRoot]}>
      <DashboardHeader 
        title="Personnel Management"
        subtitle="Global Staff & Supervisors"
        showBack
      />

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <Pressable 
            style={[styles.chip, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }, !selectedCid && styles.chipActive]} 
            onPress={() => setSelectedCid(null)}
          >
            <Text style={[styles.chipText, !selectedCid && styles.chipTextActive]}>All Orgs</Text>
          </Pressable>
          {companies.map(c => (
            <Pressable 
              key={c.id} 
              style={[styles.chip, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }, selectedCid === c.id && styles.chipActive]} 
              onPress={() => setSelectedCid(c.id)}
            >
              <Text style={[styles.chipText, selectedCid === c.id && styles.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={companySupervisors}
        renderItem={renderSupervisorItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No field personnel found.</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={isDarkMode ? 'white' : Colors.primary}
            colors={[isDarkMode ? '#3B82F6' : Colors.primary]}
            progressBackgroundColor={isDarkMode ? Colors.dark.surface : 'white'}
          />
        }
      />

      {/* Edit Modal */}
      <Modal visible={!!editingSup} animationType="fade" transparent>
        <View style={[styles.modalOverlay, isDarkMode && { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
           <SoftCard style={[styles.modalContent, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, isDarkMode && { color: 'white' }]}>Modify Personnel</Text>
                 <Pressable onPress={() => setEditingSup(null)} style={[styles.closeBtn, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }]}>
                    <Feather name="x" size={20} color={isDarkMode ? Colors.dark.textMuted : Colors.textMuted} />
                 </Pressable>
              </View>

              <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                 <View style={styles.formContent}>
                    <SoftInput 
                      label="Full Name"
                      value={editName}
                      onChangeText={setEditName}
                      icon="user"
                      returnKeyType="next"
                      onSubmitEditing={() => editPhoneRef.current?.focus()}
                    />
                    <SoftInput 
                      ref={editPhoneRef}
                      label="Contact Number"
                      value={editPhone}
                      onChangeText={setEditPhone}
                      icon="phone"
                      keyboardType="phone-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />

                    <View style={styles.siteAssignArea}>
                       <Text style={[styles.siteLabel, isDarkMode && { color: Colors.dark.textMuted }]}>ASSIGNEE SITES</Text>
                       <View style={styles.siteGrid}>
                          {companySites.map(s => {
                            const isSelected = editSites.includes(s.id);
                            return (
                              <Pressable 
                                key={s.id} 
                                style={[styles.siteChip, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }, isSelected && styles.siteChipActive]}
                                onPress={() => {
                                  if (!isSelected && editSites.length >= 5) {
                                    Alert.alert("Limit Reached", "A supervisor can have a maximum of 5 assigned sites.");
                                    return;
                                  }
                                  setEditSites(prev => isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id])
                                }}
                              >
                                <Text style={[styles.siteChipText, isSelected && styles.siteChipTextActive, isDarkMode && !isSelected && { color: Colors.dark.textSub }]}>{s.name}</Text>
                              </Pressable>
                            );
                          })}
                       </View>
                    </View>
                 </View>
              </ScrollView>

              <SoftButton 
                title={isSaving ? "Updating Roster..." : "Save Modifications"}
                onPress={saveEdit}
                loading={isSaving}
                style={{ marginTop: 10 }}
              />
           </SoftCard>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteConfirmSup} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <SoftCard style={[styles.deleteConfirmCard, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }]}>
            <View style={styles.deleteHeader}>
              <View style={[styles.warningIconContainer, isDarkMode && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Feather name="alert-triangle" size={32} color="#EF4444" />
              </View>
              <Text style={[styles.deleteTitle, isDarkMode && { color: 'white' }]}>Remove Personnel?</Text>
              <Text style={[styles.deleteSubtitle, isDarkMode && { color: Colors.dark.textSub }]}>
                Are you sure you want to permanently remove {deleteConfirmSup?.name} from the roster? This action cannot be undone.
              </Text>
            </View>
            
            <View style={styles.deleteActions}>
              <SoftButton 
                title="Cancel" 
                variant="outline" 
                onPress={() => setDeleteConfirmSup(null)}
                style={{ flex: 1 }}
              />
              <SoftButton 
                title={isDeleting ? "Removing..." : "Remove"} 
                onPress={confirmDelete}
                loading={isDeleting}
                style={{ flex: 1, backgroundColor: '#EF4444' }}
              />
            </View>
          </SoftCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFA' },
  darkRoot: { backgroundColor: Colors.dark.bg },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { 
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', 
    justifyContent: "center", alignItems: "center",
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  title: { fontSize: 20, fontFamily: "Inter_900Black", color: '#111827' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#6B7280', marginTop: 2 },
  bellBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white' },
  avatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'white' },
  avatarFallback: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#146A65', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
  filterBar: { paddingVertical: 12 },
  filterScroll: { paddingHorizontal: 32, gap: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 32, backgroundColor: 'white', shadowColor: '#146A65', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  chipActive: { backgroundColor: '#146A65' },
  chipText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#6B7280' },
  chipTextActive: { color: "white" },
  list: { padding: 32, gap: 20, paddingBottom: 120 },
  supCard: { padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 32 },
  cardInfo: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  supName: { fontSize: 18, fontFamily: "Inter_900Black", color: '#111827' },
  idBadge: { backgroundColor: 'rgba(20,106,101,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(20,106,101,0.1)' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  idText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#146A65', letterSpacing: 0.5 },
  supPhone: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#94A3B8' },
  metricsRow: { flexDirection: "row", gap: 12, marginTop: 8, borderTopWidth: 1.5, borderTopColor: '#F8FAFA', paddingTop: 16 },
  metric: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  metricText: { fontSize: 11, fontFamily: "Inter_800ExtraBold" },
  actions: { flexDirection: "row", gap: 12 },
  editBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#A4F0E920', justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { width: '100%', maxHeight: '90%', padding: 32, gap: 32, borderRadius: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 24, fontFamily: "Inter_900Black", color: '#111827' },
  closeBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F4F4', justifyContent: 'center', alignItems: 'center' },
  formScroll: { maxHeight: 500 },
  formContent: { gap: 24 },
  siteAssignArea: { gap: 16 },
  siteLabel: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 1.5, marginLeft: 16 },
  siteGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  siteChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 32, backgroundColor: '#F0F4F4' },
  siteChipActive: { backgroundColor: '#146A65' },
  siteChipText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#4B5563' },
  siteChipTextActive: { color: "white" },
  empty: { padding: 80, alignItems: "center", gap: 20 },
  emptyText: { fontSize: 16, fontFamily: "Inter_800ExtraBold", color: '#6B7280' },
  securityResetBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: '#FEF2F2', 
    padding: 16, 
    borderRadius: 20, 
    marginHorizontal: 16 
  },
  securityResetText: { 
    fontSize: 13, 
    fontFamily: 'Inter_700Bold', 
    color: '#EF4444' 
  },
  // Delete Modal Styles
  deleteConfirmCard: { width: '90%', padding: 32, gap: 32, borderRadius: 40, alignItems: 'center' },
  deleteHeader: { alignItems: 'center', gap: 16 },
  warningIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  deleteTitle: { fontSize: 24, fontFamily: "Inter_900Black", color: '#111827', textAlign: 'center' },
  deleteSubtitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  deleteActions: { flexDirection: 'row', gap: 16, width: '100%' },
});
