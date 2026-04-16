// FORCE_REFRESH_V11_DECOMPOSED
import { Feather } from "@expo/vector-icons";
import { SoftInput } from '@/components/SoftInput';
import { SoftButton } from '@/components/SoftButton';
import { SiteAllocationModal } from '@/components/SiteAllocationModal';
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MapPicker } from "@/components/MapPicker";
import React, { useMemo, useState, useEffect } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  useWindowDimensions,
  Pressable,
  Modal
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { useTranslation } from "react-i18next";
import { DashboardHeader } from "@/components/DashboardHeader";

// New Decomposed Components
import { FounderDashboard } from "@/components/dashboard/FounderDashboard";
import { SupervisorDashboard } from "@/components/dashboard/SupervisorDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";
import { QuickAddSupervisorModal } from "@/components/QuickAddSupervisorModal";
import { QuickAddSiteModal } from "@/components/QuickAddSiteModal";
import { DashboardStatsSkeleton } from "@/components/Skeleton";

export default function HomeScreen() {
  const {
    currentUser,
    selectedCompanyId,
    getCompanyComplaints,
    refreshData,
    notifications,
    sites,
    users,
    createSupervisor,
    createSite,
    provisionClient,
    siteMetrics,
    supervisorMetrics,
    isDarkMode,
    getCompanyById,
    profileImage,
    updateSite,
    isLoading
  } = useApp();

  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals Visibility
  const [isAddSupVisible, setIsAddSupVisible] = useState(false);
  const [isAddSiteVisible, setIsAddSiteVisible] = useState(false);
  const [isAllocationVisible, setIsAllocationVisible] = useState(false);
  const [isSupProfileVisible, setIsSupProfileVisible] = useState(false);

  // Form States (Supervisor)
  const [supName, setSupName] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supPass, setSupPass] = useState("");
  const [isCreatingSup, setIsCreatingSup] = useState(false);

  // Form States (Site)
  const [siteName, setSiteName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [siteSupEmail, setSiteSupEmail] = useState("");
  const [siteClientName, setClientName] = useState("");
  const [siteClientEmail, setClientEmail] = useState("");
  const [siteClientPhone, setClientPhone] = useState("");
  const [siteClientPass, setClientPass] = useState("");
  const [siteClientPhoto, setSiteClientPhoto] = useState("");
  const [siteAuthority, setSiteAuthority] = useState("");
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [siteLat, setSiteLat] = useState("");
  const [siteLong, setSiteLong] = useState("");

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const role = currentUser?.role;

  // Onboarding check
  useEffect(() => {
    if (currentUser && currentUser.hasOnboarded === false) {
      router.replace("/onboarding");
    }
  }, [currentUser]);

  // Data Fetching & Computed Stats
  const complaints = getCompanyComplaints(companyId);
  
  const clientStats = useMemo(() => {
    if (role !== 'client') return null;
    const myComplaints = complaints.filter(c => c.clientId === currentUser?.id);
    const mySite = sites.find(s => s.clientId === currentUser?.id);
    
    const siteComplaints = mySite ? complaints.filter(c => c.siteId === mySite.id && c.status !== 'resolved') : [];
    const activeCount = siteComplaints.length;
    const highPriorityCount = siteComplaints.filter(c => c.priority === 'high').length;
    
    let health: 'stable' | 'warning' | 'critical' = 'stable';
    if (highPriorityCount > 0 || activeCount >= 3) health = 'critical';
    else if (activeCount > 0) health = 'warning';

    return {
      pendingCount: myComplaints.filter(c => c.status === 'pending').length,
      inProgressCount: myComplaints.filter(c => c.status === 'in_progress').length,
      resolvedToday: myComplaints.filter(c => c.status === 'resolved' && new Date(c.resolvedAt || "").toDateString() === new Date().toDateString()).length,
      latestComplaint: myComplaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
      weeklyResolved: myComplaints.filter(c => c.status === 'resolved' && new Date(c.resolvedAt || "").getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
      avgResStr: "24h",
      activeComplaints: myComplaints.filter(c => c.status !== 'resolved').slice(0, 5),
      siteName: mySite?.name || "My Site",
      siteData: mySite,
      supervisor: users.find(u => u.id === mySite?.assignedSupervisorId),
      siteHealth: health,
      siteActiveCount: activeCount,
      alerts: []
    };
  }, [role, complaints, currentUser, sites, users]);

  const supervisorStats = useMemo(() => {
    if (role !== 'supervisor') return null;
    const mySites = sites.filter(s => s.assignedSupervisorId === currentUser?.id);
    const mySiteIds = mySites.map(s => s.id);
    const myComplaints = complaints.filter(c => 
      c.supervisorId === currentUser?.id || 
      mySiteIds.includes(c.siteId)
    );
    const pending = myComplaints.filter(c => c.status === 'pending').length;
    const inProgress = myComplaints.filter(c => c.status === 'in_progress').length;
    const completedToday = myComplaints.filter(c => c.status === 'resolved' && new Date(c.resolvedAt || "").toDateString() === new Date().toDateString()).length;
    
    return {
      pendingCount: pending,
      inProgressCount: inProgress,
      completedTodayCount: completedToday,
      urgentTasks: myComplaints.filter(c => c.priority === 'high' && c.status !== 'resolved'),
      nextBest: myComplaints.filter(c => c.status === 'pending').sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0],
      progress: (pending + inProgress) > 0 ? completedToday / (pending + inProgress + completedToday) : 1,
      mySites: mySites.map(s => {
        const siteComplaints = complaints.filter(c => c.siteId === s.id && c.status !== 'resolved');
        const activeCount = siteComplaints.length;
        const highPriorityCount = siteComplaints.filter(c => c.priority === 'high').length;
        
        let health: 'stable' | 'warning' | 'critical' = 'stable';
        if (highPriorityCount > 0 || activeCount >= 3) health = 'critical';
        else if (activeCount > 0) health = 'warning';

        return {
          id: s.id,
          name: s.name,
          address: s.address,
          taskCount: activeCount,
          highPriorityCount,
          health,
          isCritical: health === 'critical'
        };
      }),
      activeTasks: myComplaints.filter(c => c.status !== 'resolved').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  }, [role, complaints, currentUser, sites]);

  const founderStats = useMemo(() => {
    if (role !== 'founder') return null;
    const activeIssues = complaints.filter(c => c.status !== 'resolved').length;
    const resolvedToday = complaints.filter(c => c.status === 'resolved' && new Date(c.resolvedAt || "").toDateString() === new Date().toDateString()).length;
    const criticalSites = siteMetrics.filter(m => m.status === 'critical');
    
    // Daily Bar Data for Founder (Last 7 Days)
    const chartData = [];
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const count = complaints.filter(c => 
        c.status === 'resolved' && 
        new Date(c.resolvedAt || c.createdAt).toDateString() === dayStr
      ).length;
      chartData.push({ label: dayNames[d.getDay()], value: count, isToday: i === 0 });
    }

    const topSupervisors = (supervisorMetrics || [])
      .sort((a, b) => (b.tasks_completed - a.tasks_completed))
      .slice(0, 3)
      .map(m => {
        const user = users.find(u => u.id === m.supervisor_id);
        return { ...m, name: user?.name || "Unknown", avatar: user?.name?.substring(0, 2).toUpperCase() };
      });

    return {
      activeIssueCount: activeIssues,
      resolvedTodayCount: resolvedToday,
      criticalSiteCount: sites.filter(s => {
        const active = complaints.filter(c => c.siteId === s.id && c.status !== 'resolved');
        return active.some(c => c.priority === 'high') || active.length >= 3;
      }).length,
      criticalSites: sites.filter(s => {
        const active = complaints.filter(c => c.siteId === s.id && c.status !== 'resolved');
        return active.some(c => c.priority === 'high') || active.length >= 3;
      }).slice(0, 5),
      topSupervisors,
      chartData,
      healthProgress: activeIssues > 10 ? 0.4 : (activeIssues > 5 ? 0.7 : 0.95),
      healthMessage: activeIssues > 10 ? "Critical workload peak" : (activeIssues > 0 ? "Operations active" : "All operations stable")
    };
  }, [role, complaints, siteMetrics, sites, supervisorMetrics, users]);

  const activeSites = useMemo(() => {
    const companySites = sites.filter(s => s.companyId === companyId);
    let filtered = companySites;
    if (role === 'supervisor') filtered = companySites.filter(s => s.assignedSupervisorId === currentUser?.id);
    
    return filtered.slice(0, 10).map(s => {
      const siteComplaints = complaints.filter(c => c.siteId === s.id && c.status !== 'resolved');
      const activeCount = siteComplaints.length;
      const highPriorityCount = siteComplaints.filter(c => c.priority === 'high').length;
      
      let health: 'stable' | 'warning' | 'critical' = 'stable';
      if (highPriorityCount > 0 || activeCount >= 3) health = 'critical';
      else if (activeCount > 0) health = 'warning';

      return {
        ...s,
        taskCount: activeCount,
        highPriorityCount,
        health,
        isCritical: health === 'critical'
      };
    });
  }, [sites, complaints, companyId, role, currentUser]);

  const filteredPersonnel = useMemo(() => {
    if (role !== 'founder' || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  }, [users, role, searchQuery]);

  // Event Handlers
  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refreshData();
    } catch (e) {
      console.error("[Home] Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSupervisor = async () => {
    if (!supName || !supEmail || !supPass) {
      showToast("Required fields missing", "error");
      return;
    }
    setIsCreatingSup(true);
    try {
      await createSupervisor(supEmail, supPass, supName, supPhone, companyId);
      showToast("Supervisor account created", "success");
      setIsAddSupVisible(false);
      setSupName(""); setSupEmail(""); setSupPhone(""); setSupPass("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      showToast(e.message || "Failed to create supervisor", "error");
    } finally {
      setIsCreatingSup(false);
    }
  };

  const handleQuickAddSite = async () => {
    if (!siteName || !siteLocation) {
      showToast("Required fields missing", "error");
      return;
    }
    setIsCreatingSite(true);
    try {
      let supId = null;
      if (siteSupEmail) {
        const found = users.find(u => u.email?.toLowerCase() === siteSupEmail.toLowerCase() && u.role === 'supervisor');
        if (found) supId = found.id;
      }
      const site = await createSite({
        name: siteName,
        companyId,
        address: siteLocation,
        clientName: siteClientName,
        clientPhone: siteClientPhone,
        authorityName: siteAuthority,
        supervisorId: supId || undefined,
        latitude: siteLat ? parseFloat(siteLat) : undefined,
        longitude: siteLong ? parseFloat(siteLong) : undefined,
        radius: 200 // Default geofencing radius
      });
      if (siteClientEmail) {
        await provisionClient(site.id, siteClientEmail, siteClientName || siteName + " Client", siteClientPass, siteClientPhoto, companyId);
      }
      showToast("Site added successfully", "success");
      setIsAddSiteVisible(false);
      setSiteName(""); setSiteLocation(""); setSiteSupEmail("");
      setClientName(""); setClientEmail(""); setClientPhone(""); setClientPass(""); setSiteClientPhoto("");
      setSiteLat(""); setSiteLong("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      showToast(e.message || "Failed to add site", "error");
    } finally {
      setIsCreatingSite(false);
    }
  };

  const handleAllocate = async (siteId: string, supervisorId: string) => {
    try {
      await updateSite(siteId, { assignedSupervisorId: supervisorId });
      showToast("Site allocation updated", "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      showToast(e.message || "Allocation failed", "error");
      throw e;
    }
  };

  const handleMarkCurrentLocation = async () => {
    try {
      showToast("Fetching precise GPS coordinates...", "info");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast("Permission to access location was denied", "error");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setSiteLat(String(loc.coords.latitude));
      setSiteLong(String(loc.coords.longitude));

      const [addr] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });

      if (addr) {
        const fullAddr = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim().replace(/^ ,/, '');
        setSiteLocation(fullAddr);
        if (!siteName) setSiteName(addr.name || addr.street || "My New Site");
        showToast("Location marked successfully!", "success");
      }
    } catch (err: any) {
      showToast("Could not determine location: " + err.message, "error");
    }
  };

  const onLocationPicked = (data: { latitude: number; longitude: number; address: string }) => {
    setSiteLat(String(data.latitude));
    setSiteLong(String(data.longitude));
    setSiteLocation(data.address);
    if (!siteName && data.address) {
      setSiteName(data.address.split(',')[0]);
    }
    setIsMapVisible(false);
  };

  const pickClientImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setSiteClientPhoto(result.assets[0].uri);
  };

  if (!currentUser) return null;

  return (
    <View style={[styles.root, isDarkMode && styles.darkBg]}>
      {/* Global Refreshable Container */}
      <ScrollView
         showsVerticalScrollIndicator={false}
         refreshControl={
           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDarkMode ? 'white' : Colors.primary} />
         }
         contentContainerStyle={{ paddingBottom: 100 }}
      >
        <DashboardHeader 
           showCompanyPill={role === 'founder'} 
           title={role === 'founder' ? t('founder_hub', 'Founder Hub') : (role === 'supervisor' ? t('ops_center', 'Ops Center') : t('status_room', 'Status Room'))}
           subtitle={role === 'founder' ? t('strategic_overview', 'Strategic Overview') : (role === 'supervisor' ? t('field_active', 'Field Active') : t('client_overview', 'Client Overview'))}
         />

        {/* Universal Search Bar */}
        <View style={[styles.searchContainer, isDarkMode && styles.darkSearchBar]}>
          <Feather name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isDarkMode && styles.darkText]}
            placeholder={t('search_placeholder', "Search tasks, sites, or staff...")}
            placeholderTextColor={isDarkMode ? Colors.dark.textMuted : Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={{ padding: 8 }}>
              <Feather name="x-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Dashboards (Role-Based) */}
        {searchQuery.length === 0 ? (
          <>
            {isLoading && !refreshing ? (
              <DashboardStatsSkeleton isDarkMode={isDarkMode} />
            ) : (
              <>
                {role === 'founder' && (
                  <FounderDashboard 
                    founderStats={founderStats} 
                    activeSites={activeSites} 
                    siteMetrics={siteMetrics} 
                    isDarkMode={isDarkMode} 
                    t={t} 
                    setIsAddSiteVisible={setIsAddSiteVisible} 
                    setIsAddSupVisible={setIsAddSupVisible}
                    setIsAllocationVisible={setIsAllocationVisible}
                  />
                )}
                {role === 'supervisor' && (
                  <SupervisorDashboard 
                    supervisorStats={supervisorStats} 
                    isDarkMode={isDarkMode} 
                    t={t} 
                    refreshData={refreshData} 
                  />
                )}
                {role === 'client' && (
                  <ClientDashboard 
                    clientStats={clientStats} 
                    isDarkMode={isDarkMode} 
                    t={t} 
                    setIsSupProfileVisible={setIsSupProfileVisible} 
                  />
                )}
              </>
            )}
          </>
        ) : (
          <View style={styles.searchResults}>
            {/* Personnel Match (Founder Only) */}
            {role === 'founder' && filteredPersonnel.length > 0 && (
              <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
                <Text style={styles.sectionHeading}>Personnel Match</Text>
                {filteredPersonnel.map(person => (
                  <Pressable key={person.id} style={[styles.siteCard, isDarkMode && styles.darkCard]} onPress={() => router.push(`/admin/supervisors?search=${person.name}`)}>
                    <View style={styles.siteCardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.siteName, isDarkMode && styles.darkText]}>{person.name}</Text>
                        <Text style={[styles.address, isDarkMode && styles.darkTextSub]}>{person.email}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
                        <Text style={[styles.statusTxt, { color: '#666' }]}>{person.role?.toUpperCase()}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
            {filteredPersonnel.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No results found for "{searchQuery}"</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Shared Modals */}
      <QuickAddSupervisorModal 
        visible={isAddSupVisible}
        onClose={() => setIsAddSupVisible(false)}
        name={supName} setName={setSupName}
        email={supEmail} setEmail={setSupEmail}
        phone={supPhone} setPhone={setSupPhone}
        pass={supPass} setPass={setSupPass}
        loading={isCreatingSup}
        onSave={handleCreateSupervisor}
      />

      <QuickAddSiteModal 
        visible={isAddSiteVisible}
        onClose={() => setIsAddSiteVisible(false)}
        name={siteName} setName={setSiteName}
        location={siteLocation} setLocation={setSiteLocation}
        supEmail={siteSupEmail} setSupEmail={setSiteSupEmail}
        clientName={siteClientName} setClientName={setClientName}
        clientEmail={siteClientEmail} setClientEmail={setClientEmail}
        clientPhone={siteClientPhone} setClientPhone={setClientPhone}
        clientPass={siteClientPass} setClientPass={setClientPass}
        clientPhoto={siteClientPhoto} onPickPhoto={pickClientImage}
        loading={isCreatingSite}
        onSave={handleQuickAddSite}
        onMarkLocation={handleMarkCurrentLocation}
        onOpenMap={() => setIsMapVisible(true)}
        lat={siteLat}
        long={siteLong}
      />

      <MapPicker 
        isVisible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        onConfirm={onLocationPicked}
        isDarkMode={isDarkMode}
      />

      {/* Supervisor Profile Modal (Simplified placeholder as it's less critical for OOM) */}
      <Modal visible={isSupProfileVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
           <View style={[styles.supProfileCard, isDarkMode && styles.darkCard]}>
              <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, isDarkMode && styles.darkText]}>Supervisor</Text>
                 <Pressable onPress={() => setIsSupProfileVisible(false)} style={styles.closeBtn}>
                   <Feather name="x" size={20} color={Colors.textMuted} />
                 </Pressable>
              </View>
              <View style={{ alignItems: 'center', padding: 20 }}>
                 <Text style={[styles.darkText, { fontSize: 18, fontFamily: 'Inter_700Bold' }]}>{clientStats?.supervisor?.name || "Assigned Manager"}</Text>
                 <Text style={styles.emptyStateText}>{clientStats?.supervisor?.email || "Email pending"}</Text>
              </View>
           </View>
        </View>
      </Modal>

      <SiteAllocationModal 
        visible={isAllocationVisible}
        onClose={() => setIsAllocationVisible(false)}
        sites={sites.filter(s => s.companyId === companyId)}
        supervisors={users.filter(u => u.role === 'supervisor' && u.companyId === companyId)}
        onAllocate={handleAllocate}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  darkBg: { backgroundColor: Colors.dark.bg },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.secondary, marginHorizontal: 24, borderRadius: 100, paddingHorizontal: 20, height: 56, marginTop: 4, marginBottom: 20 },
  darkSearchBar: { backgroundColor: Colors.dark.surfaceElevated, borderColor: Colors.dark.border, borderWidth: 1 },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text },
  darkText: { color: 'white' },
  darkTextSub: { color: Colors.dark.textSub },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1 },
  searchResults: { paddingTop: 10 },
  sectionHeading: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: Colors.text, paddingHorizontal: 24, marginBottom: 16 },
  siteCard: { padding: 16, borderRadius: 20, backgroundColor: 'white', marginBottom: 12 },
  siteCardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  siteName: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827', marginBottom: 4 },
  address: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusTxt: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.4)', justifyContent: 'flex-end' },
  supProfileCard: { width: '100%', padding: 24, borderRadius: 40, backgroundColor: 'white' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
});
