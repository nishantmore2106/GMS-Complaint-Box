import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useMemo, useRef } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  Image,
  RefreshControl,
  TextInput
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftInput } from "@/components/SoftInput";
import { SoftButton } from "@/components/SoftButton";
import * as Haptics from 'expo-haptics';
import { useToast } from "@/components/Toast";
import { DashboardHeader } from "@/components/DashboardHeader";

export default function SitesTabScreen() {
  const { 
    currentUser, 
    getCompanySites, 
    selectedCompanyId, 
    complaints, 
    users, 
    getCompanyById, 
    createSite, 
    provisionClient, 
    isDarkMode,
    refreshData 
  } = useApp();
  
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const role = currentUser?.role;
  
  const [search, setSearch] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  
  // Add Site Form State
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newSupEmail, setNewSupEmail] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientPhoto, setNewClientPhoto] = useState("");
  const [newAuthority, setNewAuthority] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const locationRef = useRef<TextInput>(null);
  const clientNameRef = useRef<TextInput>(null);
  const clientEmailRef = useRef<TextInput>(null);
  const supEmailRef = useRef<TextInput>(null);

  const pickClientImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setNewClientPhoto(result.assets[0].uri);
    }
  };

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const company = getCompanyById(companyId);
  const sites = getCompanySites(companyId);

  const filteredSites = useMemo(() => {
    const q = search.toLowerCase();
    let baseSites = sites;
    if (role === 'supervisor') {
      baseSites = sites.filter(s => s.assignedSupervisorId === currentUser?.id);
    }
    return baseSites.filter((s) => {
      const supervisor = users.find((u) => u.id === s.assignedSupervisorId);
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.address || "").toLowerCase().includes(q) ||
        (supervisor?.name || "").toLowerCase().includes(q) ||
        (s.clientName || "").toLowerCase().includes(q)
      );
    });
  }, [sites, search, users, role, currentUser]);

  const handleAddSite = async () => {
    if (!newName.trim() || !newLocation.trim()) {
      showToast("Site name and location are required", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      let supId = null;
      if (newSupEmail.trim()) {
        const existingUser = users.find((u) => u.email?.toLowerCase() === newSupEmail.toLowerCase() && u.role === 'supervisor');
        if (existingUser) supId = existingUser.id;
      }
      const site = await createSite({
        name: newName,
        companyId,
        address: newLocation,
        clientName: newClientName,
        clientPhone: newClientPhone,
        authorityName: newAuthority,
        supervisorId: supId || undefined
      });
      if (newClientEmail) {
        await provisionClient(site.id, newClientEmail, newClientName || newName + " Client", newClientPassword, newClientPhoto, companyId);
      }
      showToast("Site added successfully", "success");
      setIsAddModalVisible(false);
      setNewName(""); setNewLocation(""); setNewSupEmail("");
      setNewClientName(""); setNewClientPhone(""); setNewClientEmail("");
      setNewClientPassword(""); setNewClientPhoto(""); setNewAuthority("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      showToast(e.message || "Failed to add site", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSiteItem = ({ item: s }: { item: any }) => {
    const sc = complaints.filter((c) => c.siteId === s.id);
    const activeCount = sc.filter(c => c.status !== 'resolved').length;
    const supervisor = users.find(u => u.id === s.assignedSupervisorId);
    
    return (
      <Pressable 
        style={[styles.siteCard, isDarkMode && styles.darkCard]}
        onPress={() => router.push(`/admin/site/${s.id}`)}
      >
        <View style={styles.siteHeaderRow}>
          <View style={styles.titleArea}>
            <Text style={[styles.siteName, isDarkMode && styles.darkText]}>{s.name}</Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"} />
              <Text style={[styles.siteAddress, isDarkMode && styles.darkTextSub]} numberOfLines={1}>{s.address || "Location pending"}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: activeCount > 5 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }]}>
             <Text style={[styles.statusText, { color: activeCount > 5 ? '#EF4444' : '#10B981' }]}>{activeCount} {role === 'client' ? 'ISSUES' : 'ACTIVE'}</Text>
          </View>
        </View>
        <View style={[styles.divider, isDarkMode && styles.darkDivider]} />
        <View style={styles.metaRow}>
           <View style={styles.supProfileRow}>
              <View style={[styles.avatarMini, isDarkMode && styles.darkAvatar]}>
                {supervisor ? (
                  <Text style={[styles.avatarText, isDarkMode && styles.darkText]}>{supervisor.name.substring(0, 1).toUpperCase()}</Text>
                ) : (
                  <Feather name="user-x" size={14} color="#9CA3AF" />
                )}
              </View>
              <Text style={[styles.supName, isDarkMode && styles.darkTextSub]}>{supervisor?.name || "Unassigned"}</Text>
           </View>
           <Feather name="chevron-right" size={18} color="#D1D5DB" />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, isDarkMode && styles.darkRoot]}>
      <DashboardHeader 
        title="Sites"
        subtitle={company?.name || "Service Locations"}
        rightElement={
          role === 'founder' && (
            <Pressable style={styles.addBtn} onPress={() => setIsAddModalVisible(true)}>
              <Feather name="plus" size={20} color="white" />
            </Pressable>
          )
        }
      />
      <View style={styles.searchBox}>
        <View style={[styles.searchBar, isDarkMode && styles.darkSearchBar]}>
          <Feather name="search" size={18} color={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"} />
          <TextInput
            placeholder="Search sites..."
            placeholderTextColor={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"}
            style={[styles.searchInput, isDarkMode && styles.darkText]}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        data={filteredSites}
        renderItem={renderSiteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={false} 
            onRefresh={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              await refreshData();
            }} 
            tintColor={isDarkMode ? 'white' : Colors.primary} 
          />
        }
      />

      <Modal visible={isAddModalVisible} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDarkMode && styles.darkCard]}>
               <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Add Site</Text>
                  <Pressable onPress={() => setIsAddModalVisible(false)} style={styles.closeBtn}>
                     <Feather name="x" size={20} color={isDarkMode ? "white" : "#6B7280"} />
                  </Pressable>
               </View>
               <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
                  <SoftInput label="Site Name" placeholder="e.g. Skyline Towers" value={newName} onChangeText={setNewName} isDarkMode={isDarkMode} returnKeyType="next" onSubmitEditing={() => locationRef.current?.focus()} />
                  <SoftInput ref={locationRef} label="Location" placeholder="Full address" value={newLocation} onChangeText={setNewLocation} isDarkMode={isDarkMode} returnKeyType="next" onSubmitEditing={() => clientNameRef.current?.focus()} />
                  <SoftInput ref={clientNameRef} label="Client Name" value={newClientName} onChangeText={setNewClientName} isDarkMode={isDarkMode} returnKeyType="next" onSubmitEditing={() => clientEmailRef.current?.focus()} />
                  <SoftInput ref={clientEmailRef} label="Client Email" value={newClientEmail} onChangeText={setNewClientEmail} isDarkMode={isDarkMode} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" onSubmitEditing={() => supEmailRef.current?.focus()} />
                  <SoftInput ref={supEmailRef} label="Supervisor Email" value={newSupEmail} onChangeText={setNewSupEmail} isDarkMode={isDarkMode} keyboardType="email-address" autoCapitalize="none" returnKeyType="done" onSubmitEditing={handleAddSite} />
               </ScrollView>
               <View style={styles.modalFooter}>
                  <SoftButton title="Cancel" variant="secondary" onPress={() => setIsAddModalVisible(false)} style={{ flex: 1 }} isDarkMode={isDarkMode} />
                  <SoftButton title={isSubmitting ? "Creating..." : "Add Site"} onPress={handleAddSite} loading={isSubmitting} style={{ flex: 2 }} isDarkMode={isDarkMode} />
               </View>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  darkRoot: { backgroundColor: Colors.dark.bg },
  searchBox: { paddingHorizontal: 24, paddingBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, height: 52, borderRadius: 12, gap: 12 },
  darkSearchBar: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 24, gap: 16, paddingBottom: 120 },
  siteCard: { padding: 20, backgroundColor: 'white', borderRadius: 24 },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1 },
  siteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleArea: { flex: 1, gap: 4 },
  siteName: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  siteAddress: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.03)', marginVertical: 12 },
  darkDivider: { backgroundColor: Colors.dark.border },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  supProfileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  darkAvatar: { backgroundColor: Colors.dark.surfaceElevated },
  avatarText: { fontSize: 12, fontFamily: 'Inter_800ExtraBold' },
  supName: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17,24,39,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_900Black' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  modalForm: { gap: 16 },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  darkText: { color: 'white' },
  darkTextSub: { color: Colors.dark.textSub },
});
