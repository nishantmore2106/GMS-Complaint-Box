import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { useToast } from "@/components/Toast";
import { MapPicker } from "@/components/MapPicker";
import { SoftInput } from "@/components/SoftInput";
import * as Location from "expo-location";

export default function NewSiteScreen() {
  const { createSite, companies, users, currentUser, provisionClient, notifications, profileImage, sites } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const unreadNotifs = notifications.filter(n => !n.isRead).length;
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("gms258");
  const [clientPhone, setClientPhone] = useState("");
  const [authorityName, setAuthorityName] = useState("");
  const [companyId, setCompanyId] = useState(currentUser?.companyId || "");
  const [supervisorId, setSupervisorId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeters, setRadiusMeters] = useState("500");
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Refs for keyboard transitions
  const addressRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const logoRef = useRef<TextInput>(null);
  const clientNameRef = useRef<TextInput>(null);
  const clientEmailRef = useRef<TextInput>(null);
  const clientPasswordRef = useRef<TextInput>(null);
  const clientPhoneRef = useRef<TextInput>(null);
  const authorityRef = useRef<TextInput>(null);

  const companyUsers = users.filter(u => u.role === 'supervisor' && u.companyId === companyId);

  const onLocationPicked = (data: { latitude: number; longitude: number; address: string }) => {
    setLatitude(String(data.latitude));
    setLongitude(String(data.longitude));
    setAddress(data.address);
    // If name is empty, try to use address snippet as name
    if (!name && data.address) {
      setName(data.address.split(',')[0]);
    }
  };

  const handleMarkCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Refused", "GPS access is required to mark your location automatically.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      
      setLatitude(String(latitude));
      setLongitude(String(longitude));
      
      // Reverse Geocode
      const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addr) {
        const fullAddr = [addr.name, addr.street, addr.district, addr.city, addr.region].filter(Boolean).join(", ");
        setAddress(fullAddr);
        if (!name) setName(addr.name || addr.street || "New Site");
      }
      
      showToast("Location captured from GPS!");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err: any) {
      Alert.alert("GPS Error", err.message || "Could not fetch current location.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !companyId) {
      Alert.alert("Error", "Site Name and Company are required");
      return;
    }

    // Check supervisor site limit (max 5)
    if (supervisorId) {
      const assignedCount = sites.filter(s => s.assignedSupervisorId === supervisorId).length;
      if (assignedCount >= 5) {
        Alert.alert("Limit Reached", "This supervisor already has 5 assigned sites. Please select another supervisor or leave as unassigned.");
        return;
      }
    }

    setLoading(true);
    try {
      const newSite = await createSite({
        name,
        companyId,
        supervisorId: supervisorId || undefined,
        address,
        phone,
        logoUrl,
        clientPhone,
        authorityName,
        latitude: parseFloat(latitude) || undefined,
        longitude: parseFloat(longitude) || undefined,
        radiusMeters: parseInt(radiusMeters) || 500
      });

      // If client email provided, provision access immediately
      if (clientEmail.includes("@")) {
        console.log("[NewSite] Provisioning client access for", clientEmail);
        try {
          await provisionClient(newSite.id, clientEmail, clientName || name);
        } catch (linkError) {
          console.error("[NewSite] Client linkage failed but site was created:", linkError);
          Alert.alert("Partial Success", "Site created, but client account linking failed. You can link it later from site details.");
        }
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Site registered and client linked successfully!");
      router.replace("/(tabs)");
    } catch (e: any) {
      showToast(e.message || "Failed to register site", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? insets.top + 40 : insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Pressable 
            style={styles.backBtn} 
            onPress={() => router.canGoBack() ? router.back() : router.replace("/admin")}
          >
            <Feather name="arrow-left" size={22} color={Colors.primary} />
          </Pressable>
          <View>
            <Text style={styles.title}>New Site</Text>
            <Text style={styles.subtitle}>Registration</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.bellBtn} onPress={() => router.push("/notifications")}>
            <Feather name="bell" size={20} color={Colors.text} />
            {unreadNotifs > 0 && <View style={styles.notifBadge} />}
          </Pressable>

          <Pressable onPress={() => router.push("/(tabs)/profile")}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{currentUser?.name?.[0] || "U"}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={[styles.headerSub, { marginBottom: 8 }]}>
               <Text style={styles.sectionTitle}>Basic Information</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Site Name *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. Skyline Residency" 
                  value={name} 
                  onChangeText={setName} 
                  returnKeyType="next"
                  onSubmitEditing={() => addressRef.current?.focus()}
                />
              </View>
              <SoftInput 
                ref={addressRef}
                label="Full Address"
                placeholder="Enter complete site address"
                value={address}
                onChangeText={setAddress}
                icon="map-pin"
                rightIcon="map"
                onRightIconPress={() => setIsMapVisible(true)}
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />

              <View style={[styles.mapActionRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 12 }]}>
                 <Text style={[styles.inlineHint, { marginBottom: 0 }]}>Geographic Intel</Text>
                 <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    contentContainerStyle={{ gap: 8, paddingRight: 16 }}
                 >
                   <Pressable style={styles.inlineMapBtn} onPress={handleMarkCurrentLocation}>
                      <Feather name="crosshair" size={14} color="white" />
                      <Text style={styles.inlineMapBtnText}>Mark My Location</Text>
                   </Pressable>
                   <Pressable style={[styles.inlineMapBtn, { backgroundColor: '#4B5563' }]} onPress={() => setIsMapVisible(true)}>
                      <Feather name="map" size={14} color="white" />
                      <Text style={styles.inlineMapBtnText}>Pick from Google Maps</Text>
                   </Pressable>
                 </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Site Phone Number</Text>
                <TextInput 
                  ref={phoneRef}
                  style={styles.input} 
                  placeholder="e.g. +91 99999 88888" 
                  keyboardType="phone-pad"
                  value={phone} 
                  onChangeText={setPhone} 
                  returnKeyType="next"
                  onSubmitEditing={() => logoRef.current?.focus()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Site Logo URL</Text>
                <TextInput 
                  ref={logoRef}
                  style={styles.input} 
                  placeholder="e.g. https://site.com/logo.png" 
                  value={logoUrl} 
                  onChangeText={setLogoUrl} 
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, gap: 10 }}>
                  <Text style={styles.label}>Latitude</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 22.3072" 
                    value={latitude} 
                    onChangeText={setLatitude} 
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, gap: 10 }}>
                  <Text style={styles.label}>Longitude</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="e.g. 73.1812" 
                    value={longitude} 
                    onChangeText={setLongitude} 
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Geofence Radius (Meters)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Default: 500" 
                  value={radiusMeters} 
                  onChangeText={setRadiusMeters} 
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Details & Login</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client Name (Company/Person)</Text>
                <TextInput 
                  ref={clientNameRef}
                  style={styles.input} 
                  placeholder="e.g. Skyline Ventures" 
                  value={clientName} 
                  onChangeText={setClientName} 
                  returnKeyType="next"
                  onSubmitEditing={() => clientEmailRef.current?.focus()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Login Email (For Site Access)</Text>
                <TextInput 
                  ref={clientEmailRef}
                  style={styles.input} 
                  placeholder="e.g. client01@gmail.com" 
                  value={clientEmail} 
                  onChangeText={setClientEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => clientPasswordRef.current?.focus()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Login Password (Reference)</Text>
                <TextInput 
                  ref={clientPasswordRef}
                  style={styles.input} 
                  placeholder="gms258" 
                  value={clientPassword} 
                  onChangeText={setClientPassword}
                  secureTextEntry
                  returnKeyType="next"
                  onSubmitEditing={() => clientPhoneRef.current?.focus()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Phone</Text>
                <TextInput 
                  ref={clientPhoneRef}
                  style={styles.input} 
                  placeholder="+91 00000 00000" 
                  keyboardType="phone-pad" 
                  value={clientPhone} 
                  onChangeText={setClientPhone} 
                  returnKeyType="next"
                  onSubmitEditing={() => authorityRef.current?.focus()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Authority Point of Contact</Text>
                <TextInput 
                  ref={authorityRef}
                  style={styles.input} 
                  placeholder="e.g. Mr. Sharma (Sec)" 
                  value={authorityName} 
                  onChangeText={setAuthorityName} 
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allotment</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Company *</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  style={styles.chipRow}
                  contentContainerStyle={{ paddingBottom: 4 }}
                >
                  {companies.map(c => (
                    <Pressable 
                      key={c.id} 
                      style={[styles.chip, companyId === c.id && styles.chipActive]}
                      onPress={() => setCompanyId(c.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: companyId === c.id }}
                    >
                      <Text style={[styles.chipText, companyId === c.id && styles.chipTextActive]}>{c.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Allot Supervisor</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  <Pressable 
                    style={[styles.chip, !supervisorId && styles.chipActive]}
                    onPress={() => setSupervisorId("")}
                  >
                    <Text style={[styles.chipText, !supervisorId && styles.chipTextActive]}>Unassigned</Text>
                  </Pressable>
                  {companyUsers.map(u => (
                    <Pressable 
                      key={u.id} 
                      style={[styles.chip, supervisorId === u.id && styles.chipActive]}
                      onPress={() => setSupervisorId(u.id)}
                    >
                      <Text style={[styles.chipText, supervisorId === u.id && styles.chipTextActive]}>{u.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          <Pressable 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>{loading ? "Saving Site..." : "Register Site"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <MapPicker 
        isVisible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        onConfirm={onLocationPicked}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFA' },
  headerSub: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 8 },
  mapActionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#F0F4F4', 
    padding: 20, 
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed'
  },
  inlineHint: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280', paddingRight: 16 },
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
  title: { fontSize: 18, fontFamily: "Inter_900Black", color: '#111827' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#6B7280', marginTop: -2 },
  bellBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white' },
  avatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'white' },
  avatarFallback: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#146A65', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
  scroll: { padding: 32, gap: 32, paddingBottom: 120 },
  section: { gap: 16 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_800ExtraBold", color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 8 },
  card: { backgroundColor: 'white', borderRadius: 40, padding: 32, gap: 24, shadowColor: '#146A65', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 6 },
  inputGroup: { gap: 10 },
  label: { fontSize: 14, fontFamily: "Inter_700Bold", color: '#4B5563', marginLeft: 4 },
  input: { backgroundColor: '#F8FAFA', borderRadius: 16, borderWidth: 1, borderColor: '#F0F4F4', paddingHorizontal: 20, fontSize: 15, fontFamily: 'Inter_500Medium', color: '#111827', height: 56 },
  chipRow: { flexGrow: 0, marginHorizontal: -4 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 32, backgroundColor: '#F8FAFA', borderWidth: 1, borderColor: '#F0F4F4', marginRight: 10 },
  chipActive: { backgroundColor: '#146A65', borderColor: '#146A65' },
  chipText: { fontSize: 13, fontFamily: "Inter_700Bold", color: '#4B5563' },
  chipTextActive: { color: "white" },
  submitBtn: { height: 64, backgroundColor: '#146A65', borderRadius: 32, justifyContent: "center", alignItems: "center", marginTop: 14, shadowColor: '#146A65', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8 },
  submitBtnText: { color: "white", fontSize: 18, fontFamily: "Inter_900Black" },
});
