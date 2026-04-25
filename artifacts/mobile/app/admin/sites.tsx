// REVISION: SCALABILITY_FIX_V2
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useMemo, useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  Alert,
  Image,
  InteractionManager
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftCard } from "@/components/SoftCard";
import { SoftInput } from "@/components/SoftInput";
import { SoftButton } from "@/components/SoftButton";
import * as Haptics from 'expo-haptics';
import { useToast } from "@/components/Toast";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MapPicker } from "@/components/MapPicker";
import * as Location from "expo-location";

export default function SitesManagementScreen() {
  const { 
    currentUser, 
    selectedCompanyId, 
    complaints, 
    users, 
    getCompanyById, 
    createSite, 
    provisionClient, 
    notifications, 
    profileImage,
    isDarkMode,
    loadMoreSites,
    refreshData,
    sites,
  } = useApp();
  
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  
  // Add Site Form State
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newSupEmail, setNewSupEmail] = useState("");
  const [newLat, setNewLat] = useState("");
  const [newLong, setNewLong] = useState("");
  const [newRadius, setNewRadius] = useState("500");

  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientPhoto, setNewClientPhoto] = useState("");
  const [newAuthority, setNewAuthority] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLogoUrl, setNewLogoUrl] = useState("");
  const [isMapVisible, setIsMapVisible] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const company = getCompanyById(companyId);

  // 🕵️ Search Debounce Logic
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // 🛡️ GSD Optimization: Using loadMore(search) instead of full refreshData()
      // to reduce bridge traffic during typing.
      if (search.trim().length > 0) {
        loadMoreSites({ search: search.trim(), companyId });
      }
    }, 1000); // Increased debounce to 1s

    return () => clearTimeout(delayDebounceFn);
  }, [search]); 

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  }, [refreshData]);

  const onEndReached = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    await loadMoreSites({ search: search.trim() || undefined, companyId });
    setIsLoadingMore(false);
  }, [isLoadingMore, loadMoreSites, search, companyId]);

  const pickClientImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setNewClientPhoto(result.assets[0].uri);
    }
  };

  const onLocationPicked = (data: { latitude: number; longitude: number; address: string }) => {
    setNewLat(String(data.latitude.toFixed(6)));
    setNewLong(String(data.longitude.toFixed(6)));
    setNewLocation(data.address);
    if (!newName && data.address) {
      setNewName(data.address.split(',')[0]);
    }
  };

  const handleMarkCurrentLocation = async () => {
    setIsSubmitting(true);
    showToast("Locking coordinates...", "info");
    
    try {
      // 🛡️ GSD Optimization: Offload GPS task to avoid thread blockage
      await new Promise(resolve => InteractionManager.runAfterInteractions(() => resolve(true)));

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Refused", "GPS access is required to mark site location.");
        setIsSubmitting(false);
        return;
      }

      // 🛡️ GSD WATCHDOG: 6s Timeout for GPS
      const locationPromise = Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced 
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("GPS_TIMEOUT")), 6000)
      );

      console.log("[Admin/Sites] Requesting GPS lock (6s watchdog active)");
      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
      const { latitude, longitude } = location.coords;
      
      setNewLat(String(latitude.toFixed(6)));
      setNewLong(String(longitude.toFixed(6)));
      
      const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addr) {
        const fullAddr = [addr.name, addr.street, addr.district, addr.city, addr.region].filter(Boolean).join(", ");
        setNewLocation(fullAddr);
        if (!newName) setNewName(addr.name || addr.street || "New Facility");
      }
      showToast("Location captured successfully!", "success");
      
      showToast("Location updated from GPS!", "success");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      console.warn("[Admin/Sites] GPS Lock Warning:", err.message);
      if (err.message === "GPS_TIMEOUT") {
        Alert.alert("GPS Timeout", "Taking too long to get a lock. Please pick from map instead.");
      } else {
        Alert.alert("GPS Error", err.message || "Failed to fetch GPS coordinates.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSite = async () => {
    if (!newName.trim() || !newLocation.trim()) {
      showToast("Site Nomenclature and Geolocation are required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      let supId = null;
      if (newSupEmail.trim()) {
        const existingUser = users.find((u) => u.email?.toLowerCase() === newSupEmail.toLowerCase() && u.role === 'supervisor');
        if (existingUser) {
          supId = existingUser.id;
        } else {
          showToast("Invitation will be sent to new supervisor", "success");
        }
      }

      // Create Site
      const site = await createSite({
        companyId,
        name: newName,
        address: newLocation,
        clientName: newClientName,
        clientPhone: newClientPhone,
        authorityName: newAuthority,
        supervisorId: supId || undefined,
        latitude: newLat ? parseFloat(newLat) : null,
        longitude: newLong ? parseFloat(newLong) : null,
        radiusMeters: newRadius ? parseInt(newRadius) : null,
        phone: newPhone || null,
        logoUrl: newLogoUrl || null
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Provision Client if data provided
      if (newClientEmail) {
        try {
          await provisionClient(site.id, newClientEmail, newClientName || newName + " Client", newClientPassword, newClientPhoto, companyId);
        } catch (provErr) {
          console.error("[Admin Sites] Provisioning failed:", provErr);
          showToast("Site created, but client account failed", "warning");
        }
      }

      showToast("Site added successfully", "success");
      
      setIsAddModalVisible(false);
      setNewName("");
      setNewLocation("");
      setNewSupEmail("");
      setNewClientName("");
      setNewClientPhone("");
      setNewClientEmail("");
      setNewClientPassword("");
      setNewClientPhoto("");
      setNewAuthority("");
      setNewLat("");
      setNewLong("");
      setNewRadius("500");
      setNewPhone("");
      setNewLogoUrl("");
    } catch (e: any) {
      showToast(e.message || "Failed to add site", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSiteItem = ({ item: s }: { item: any }) => {
    const sc = complaints.filter((c) => c.siteId === s.id);
    const resolved = sc.filter(c => c.status === 'resolved');
    const activeCount = sc.length - resolved.length;
    
    // Status Logic
    let statusTheme = { color: '#10B981', bg: '#ECFDF5', label: 'Good' }; 
    if (activeCount > 5 || sc.some(c => c.priority === 'high' && c.status !== 'resolved')) {
      statusTheme = { color: '#EF4444', bg: '#FEF2F2', label: 'Critical' };
    } else if (activeCount > 0) {
      statusTheme = { color: '#F59E0B', bg: '#FFF7ED', label: 'Medium' };
    }

    const supervisor = users.find(u => u.id === s.assignedSupervisorId);
    const avgTime = sc.length > 0 ? `${Math.max(2, 24 - (resolved.length * 2))}h` : '-';

    return (
      <SoftCard 
        style={styles.siteCard}
        onPress={() => router.push(`/admin/site/${s.id}`)}
      >
        <View style={styles.siteHeaderRow}>
          <View style={styles.titleArea}>
            <Text style={[styles.siteName, isDarkMode && { color: 'white' }]}>{s.name}</Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"} />
              <Text style={[styles.siteAddress, isDarkMode && { color: Colors.dark.textSub }]} numberOfLines={1}>{s.address || "Location pending"}</Text>
            </View>
          </View>
          <View style={[styles.healthBadge, { backgroundColor: isDarkMode ? (statusTheme.label === 'Good' ? 'rgba(16,185,129,0.1)' : statusTheme.label === 'Critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)') : statusTheme.bg, borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderWidth: 1 }]}>
             <View style={[styles.healthDot, { backgroundColor: isDarkMode ? (statusTheme.label === 'Good' ? '#10B981' : statusTheme.label === 'Critical' ? '#EF4444' : '#F59E0B') : statusTheme.color }]} />
             <Text style={[styles.healthText, { color: isDarkMode ? (statusTheme.label === 'Good' ? '#10B981' : statusTheme.label === 'Critical' ? '#EF4444' : '#F59E0B') : statusTheme.color }]}>{statusTheme.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.metaRow}>
           {/* Mini Stats */}
           <View style={styles.statsBlock}>
              <View style={styles.statMini}>
                 <Feather name="layers" size={14} color="#6B7280" />
                 <Text style={[styles.statVal, isDarkMode && { color: 'white' }]}>{sc.length} <Text style={styles.statSub}>Total</Text></Text>
              </View>
              <View style={styles.statMini}>
                 <Feather name="clock" size={14} color="#6B7280" />
                 <Text style={[styles.statVal, isDarkMode && { color: 'white' }]}>{avgTime} <Text style={styles.statSub}>Avg Res</Text></Text>
              </View>
           </View>
           
           {/* Supervisor Info */}
           <View style={styles.supBlock}>
              <Text style={styles.supLabel}>SUPERVISOR</Text>
              <View style={styles.supProfileRow}>
                 <View style={styles.supAvatar}>
                    {supervisor ? (
                       <Text style={styles.supInitials}>{supervisor.name.substring(0, 2).toUpperCase()}</Text>
                    ) : (
                       <Feather name="user-x" size={14} color="#9CA3AF" />
                    )}
                 </View>
                 <Text style={[styles.supName, isDarkMode && { color: 'white' }, !supervisor && { color: '#9CA3AF', fontStyle: 'italic' }]} numberOfLines={1}>
                    {supervisor ? supervisor.name : "Unassigned"}
                 </Text>
              </View>
           </View>
        </View>

         {/* GSD Phase 5: UAT Lab (Simulator) */}
         <View style={[styles.uatLab, isDarkMode && { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }]}>
            <View style={styles.uatHeader}>
               <Feather name="shield" size={10} color={isDarkMode ? Colors.dark.textMuted : "#94A3B8"} />
               <Text style={styles.uatLabel}>UAT LAB · SIMULATOR</Text>
            </View>
            <View style={styles.uatActions}>
               <Pressable 
                  style={({ pressed }) => [styles.simBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => {
                     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                     router.push(`/public/scan/${s.id}?test=true`);
                  }}
               >
                  <View style={styles.simGradient}>
                    <Feather name="zap" size={14} color="#F59E0B" />
                    <Text style={styles.simText}>Simulate Public Scan</Text>
                  </View>
               </Pressable>
            </View>
         </View>
      </SoftCard>
    );
  };

  return (
    <>
      <View style={[styles.root, isDarkMode && styles.darkRoot]}>
        <DashboardHeader 
          title="Site Management"
          subtitle={company?.name || "All Facilities"}
          showBack
          rightElement={
            <View style={styles.headerRightRow}>
              <Pressable style={styles.addBtn} onPress={() => setIsAddModalVisible(true)}>
                <Feather name="plus" size={20} color="white" />
              </Pressable>
            </View>
          }
        />

        <View style={styles.searchBox}>
          <SoftInput 
            icon="search"
            placeholder="Search sites or locations..."
            value={search}
            onChangeText={setSearch}
            isDarkMode={isDarkMode}
          />
        </View>

        <FlatList
          data={sites}
          renderItem={renderSiteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isLoadingMore ? <View style={{ padding: 20 }}><Text style={{ textAlign: 'center', color: isDarkMode ? Colors.dark.textMuted : Colors.textMuted }}>Loading more sites...</Text></View> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
               <View style={styles.emptyIcon}>
                 <Feather name="map" size={32} color="#9CA3AF" />
               </View>
              <Text style={styles.emptyText}>{search ? "No matching sites found" : "No sites registered yet"}</Text>
            </View>
          }
        />

        {/* Add Site Modal */}
        <Modal visible={isAddModalVisible} animationType="slide" transparent>
           <View style={[styles.modalOverlay, isDarkMode && { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              <View style={[styles.modalContent, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }]}>
                 <View style={styles.modalHeader}>
                    <View style={{ flex: 1 }}>
                       <Text style={[styles.modalTitle, isDarkMode && { color: 'white' }]}>New Facility</Text>
                    </View>
                    <Pressable onPress={() => setIsAddModalVisible(false)} style={[styles.closeBtn, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated, marginLeft: 12 }]}>
                       <Feather name="x" size={20} color={isDarkMode ? Colors.dark.text : "#6B7280"} />
                    </Pressable>
                 </View>

                 <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
                    <SoftInput 
                       label="Site Nomenclature" 
                       placeholder="e.g. Elite Residences"
                       icon="home"
                       value={newName}
                       onChangeText={setNewName}
                       isDarkMode={isDarkMode}
                    />

                    <View style={{ marginTop: 12, gap: 12 }}>
                       <Text style={[styles.sectionHeading, { marginBottom: 0 }]}>Geographic Intel</Text>
                       <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          <Pressable style={styles.inlineMapBtn} onPress={handleMarkCurrentLocation}>
                             <Feather name="crosshair" size={14} color="white" />
                             <Text style={styles.inlineMapBtnText}>Mark My Location</Text>
                          </Pressable>
                          <Pressable style={[styles.inlineMapBtn, { backgroundColor: '#4B5563' }]} onPress={() => setIsMapVisible(true)}>
                             <Feather name="map" size={14} color="white" />
                             <Text style={styles.inlineMapBtnText}>Pick from Google Maps</Text>
                          </Pressable>
                       </View>
                    </View>

                    <SoftInput 
                       label="Geographical Address" 
                       placeholder="Full geographical address"
                       icon="map-pin"
                       rightIcon="map"
                       onRightIconPress={() => setIsMapVisible(true)}
                       value={newLocation}
                       onChangeText={setNewLocation}
                       isDarkMode={isDarkMode}
                    />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <SoftInput 
                          label="Site Phone" 
                          placeholder="e.g. +91 98765 43210"
                          icon="phone"
                          value={newPhone}
                          onChangeText={setNewPhone}
                          isDarkMode={isDarkMode}
                          keyboardType="phone-pad"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <SoftInput 
                          label="Site Logo URL" 
                          placeholder="https://..."
                          icon="image"
                          value={newLogoUrl}
                          onChangeText={setNewLogoUrl}
                          isDarkMode={isDarkMode}
                          autoCapitalize="none"
                        />
                      </View>
                    </View>

                    <SoftInput 
                       label="Client Point of Contact" 
                       placeholder="Name of the client organization/person"
                       icon="user"
                       value={newClientName}
                       onChangeText={setNewClientName}
                       isDarkMode={isDarkMode}
                    />

                    <SoftInput 
                       label="Authority / Sub-Org" 
                       placeholder="e.g. Building Manager, RWA President"
                       icon="shield"
                       value={newAuthority}
                       onChangeText={setNewAuthority}
                       isDarkMode={isDarkMode}
                    />

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <SoftInput 
                          label="Latitude" 
                          placeholder="e.g. 22.30"
                          icon="crosshair"
                          value={newLat}
                          onChangeText={setNewLat}
                          isDarkMode={isDarkMode}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <SoftInput 
                          label="Longitude" 
                          placeholder="e.g. 73.18"
                          icon="maximize"
                          value={newLong}
                          onChangeText={setNewLong}
                          isDarkMode={isDarkMode}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>

                    <SoftInput 
                       label="Scan Radius (Meters)" 
                       placeholder="e.g. 500"
                       icon="aperture"
                       value={newRadius}
                       onChangeText={setNewRadius}
                       isDarkMode={isDarkMode}
                       keyboardType="numeric"
                    />

                    <View style={{ height: 10 }} />
                    <Text style={styles.sectionHeading}>CLIENT ACCOUNT PROVISIONING</Text>
                    
                    <SoftInput 
                       label="Client Login Email" 
                       placeholder="client@organization.com"
                       icon="mail"
                       value={newClientEmail}
                       onChangeText={setNewClientEmail}
                       keyboardType="email-address"
                       autoCapitalize="none"
                       isDarkMode={isDarkMode}
                    />
                    
                    <SoftInput 
                       label="Account Password" 
                       placeholder="Min 6 characters"
                       icon="lock"
                       value={newClientPassword}
                       onChangeText={setNewClientPassword}
                       secureTextEntry
                       isDarkMode={isDarkMode}
                    />

                    <SoftInput 
                       label="Client Phone" 
                       placeholder="Contact number"
                       icon="phone"
                       value={newClientPhone}
                       onChangeText={setNewClientPhone}
                       isDarkMode={isDarkMode}
                    />

                    <View style={[styles.photoPickerRow, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated, borderColor: Colors.dark.border }]}>
                      <Pressable style={[styles.photoPickerBtn, isDarkMode && { backgroundColor: Colors.dark.bg, borderColor: Colors.dark.border }]} onPress={pickClientImage}>
                        {newClientPhoto ? (
                          <Image source={{ uri: newClientPhoto }} style={styles.clientPhotoPreview} />
                        ) : (
                          <Feather name="camera" size={20} color={isDarkMode ? Colors.dark.textMuted : "#6B7280"} />
                        )}
                      </Pressable>
                      <View>
                        <Text style={[styles.photoPickerTitle, isDarkMode && { color: 'white' }]}>Client Profile Photo</Text>
                        <Text style={[styles.photoPickerSub, isDarkMode && { color: Colors.dark.textMuted }]}>Required for identification</Text>
                       </View>
                    </View>
                    
                    <View style={{ height: 10 }} />
                    <View style={[styles.inviteSection, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }]}>
                       <Text style={styles.sectionHeading}>RESPONSIBLE SUPERVISOR</Text>
                       <Text style={[styles.inviteHint, isDarkMode && { color: Colors.dark.textSub }]}>
                          Enter the email of an existing supervisor to assign them, or a new email to invite them.
                       </Text>
                       <SoftInput 
                          placeholder="supervisor@company.com"
                          icon="mail"
                          value={newSupEmail}
                          onChangeText={setNewSupEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          isDarkMode={isDarkMode}
                       />
                    </View>
                 </ScrollView>

                 <View style={styles.modalFooter}>
                    <SoftButton 
                       title="Cancel" 
                       variant="secondary" 
                       onPress={() => setIsAddModalVisible(false)} 
                       style={styles.modalFooterBtn}
                    />
                    <SoftButton 
                       title={isSubmitting ? "Deploying..." : "Add Site"} 
                       onPress={handleAddSite} 
                       loading={isSubmitting} 
                       style={styles.modalFooterBtn}
                    />
                 </View>

               </View>
               <MapPicker 
                  isVisible={isMapVisible}
                  onClose={() => setIsMapVisible(false)}
                  onConfirm={onLocationPicked}
                  isDarkMode={isDarkMode}
               />
            </View>
         </Modal>

      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  darkRoot: { backgroundColor: Colors.dark.bg },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
    gap: 8,
  },
  backBtn: { 
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', 
    justifyContent: "center", alignItems: "center",
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  title: { fontSize: 18, fontFamily: "Inter_900Black", color: '#111827' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#6B7280' },
  bellBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white' },
  avatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'white' },
  avatarFallback: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#146A65', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  
  searchBox: { paddingHorizontal: 24, paddingBottom: 16 },
  list: { padding: 24, gap: 20, paddingBottom: 120 },
  
  siteCard: { padding: 24, gap: 16 },
  siteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleArea: { flex: 1, gap: 6, paddingRight: 16 },
  siteName: { fontSize: 18, fontFamily: "Inter_900Black", color: '#111827' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  siteAddress: { fontSize: 13, fontFamily: "Inter_500Medium", color: '#6B7280', flex: 1 },
  
  healthBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  healthText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.04)' },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsBlock: { gap: 8 },
  statMini: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statVal: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  statSub: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#9CA3AF' },
  
  supBlock: { alignItems: 'flex-end', gap: 6 },
  supLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 1 },
  supProfileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  supAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  supInitials: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#4B5563' },
  supName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#111827', maxWidth: 100 },
  
  empty: { padding: 80, alignItems: "center", gap: 20 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  emptyText: { fontSize: 16, fontFamily: "Inter_800ExtraBold", color: '#9CA3AF' },
  
  uatLab: { marginTop: 12, padding: 16, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', gap: 12 },
  uatHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  uatLabel: { fontSize: 10, fontFamily: 'Inter_900Black', color: '#94A3B8', letterSpacing: 0.5 },
  uatActions: { flexDirection: 'row' },
  simBtn: { flex: 1, height: 44, borderRadius: 12, overflow: 'hidden' },
  simGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#111827' },
  simText: { color: 'white', fontSize: 13, fontFamily: 'Inter_700Bold' },

  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(11,18,39,0.4)', 
    justifyContent: 'flex-end',
    position: 'relative', // 🛡️ GSD: Anchors absolute children (MapPicker)
  },
  modalContent: { 
    backgroundColor: Colors.bg, 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 32, 
    paddingBottom: Platform.OS === 'ios' ? 60 : 48, 
    maxHeight: '94%', // Increased slightly for iOS
    borderTopWidth: 1, 
    borderColor: '#E5E7EB',
    width: '100%'
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  modalForm: { gap: 20, flexGrow: 1 },
  inviteSection: { marginTop: 12, gap: 12, backgroundColor: 'white', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.02, shadowRadius: 20, elevation: 2 },
  sectionHeading: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 1 },
  inviteHint: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280', lineHeight: 20 },
  modalFooter: { flexDirection: 'row', gap: 16, marginTop: 32 },
  modalFooterBtn: { flex: 1, height: 60, borderRadius: 100 },

  photoPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  photoPickerBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  clientPhotoPreview: { width: '100%', height: '100%' },
  photoPickerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#111827' },
  photoPickerSub: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#9CA3AF' },
  mapActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 4, paddingHorizontal: 4 },
  inlineMapBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#146A65', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, shadowColor: '#146A65', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  inlineMapBtnText: { color: 'white', fontSize: 13, fontFamily: 'Inter_800ExtraBold' },
});
