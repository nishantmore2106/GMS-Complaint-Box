import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftCard } from "@/components/SoftCard";
import { SoftInput } from "@/components/SoftInput";
import { SoftButton } from "@/components/SoftButton";

export default function AdminHubScreen() {
  const { 
    currentUser, 
    companies, 
    selectedCompanyId,
    setSelectedCompanyId,
    createSupervisor,
    getCompanySites,
    notifications,
    profileImage,
    isDarkMode
  } = useApp();
  const insets = useSafeAreaInsets();
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  const [supName, setSupName] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supPass, setSupPass] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [supError, setSupError] = useState("");
  const [supLoading, setSupLoading] = useState(false);

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const sites = getCompanySites(companyId);

  const handleCreateSupervisor = async () => {
    if (!supName || !supEmail || !supPass) {
      setSupError("Please fill all required fields");
      return;
    }
    setSupLoading(true);
    setSupError("");
    try {
      await createSupervisor(supEmail, supPass, supName, supPhone, companyId, selectedSiteIds);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSupName(""); setSupEmail(""); setSupPass(""); setSupPhone("");
      setSelectedSiteIds([]);
      Alert.alert("Success", "Supervisor account created successfully!");
    } catch (e: any) {
      setSupError(e.message || "Failed to create supervisor");
    } finally {
      setSupLoading(false);
    }
  };

  return (
    <View style={[styles.root, isDarkMode && { backgroundColor: Colors.dark.bg }]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && { backgroundColor: Colors.dark.bg, borderBottomWidth: 1, borderBottomColor: Colors.dark.border }, { paddingTop: Platform.OS === "web" ? insets.top + 40 : insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Pressable 
            style={[styles.backBtn, isDarkMode && { backgroundColor: Colors.dark.surface }]} 
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
          >
            <Feather name="chevron-left" size={24} color={isDarkMode ? Colors.dark.text : Colors.primary} />
          </Pressable>
          <View>
            <Text style={[styles.title, isDarkMode && { color: Colors.dark.text }]}>Founder Hub</Text>
            <Text style={[styles.subtitle, isDarkMode && { color: Colors.dark.textSub }]}>Administrative Suite</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={[styles.bellBtn, isDarkMode && { backgroundColor: Colors.dark.surface }]} onPress={() => router.push("/notifications")}>
            <Feather name="bell" size={20} color={isDarkMode ? Colors.dark.text : Colors.text} />
            {unreadNotifs > 0 && <View style={styles.notifBadge} />}
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/profile")}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, isDarkMode && { backgroundColor: Colors.dark.accent }]}>
                <Text style={styles.avatarFallbackText}>{currentUser?.name?.[0] || "U"}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
      >
        {/* Company Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Switch Organization</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.companyScroll}>
            {companies.map(c => {
              const isActive = companyId === c.id;
              return (
                <Pressable 
                  key={c.id} 
                  style={[styles.companyChip, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }, isActive && styles.companyChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCompanyId(c.id);
                  }}
                >
                  <Text style={[styles.companyChipText, isActive && styles.companyChipTextActive]}>
                    {c.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsRow}>
          <Pressable 
            style={styles.statCard} 
            onPress={() => router.push("/admin/sites")}
          >
            <SoftCard style={[styles.innerStatCard, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }]}>
              <View style={[styles.statIcon, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : Colors.primaryMuted }]}>
                <Feather name="map" size={18} color={isDarkMode ? '#60A5FA' : Colors.primary} />
              </View>
              <Text style={[styles.statLabel, isDarkMode && { color: 'white' }]}>Site Management</Text>
              <Feather name="arrow-right" size={14} color={isDarkMode ? Colors.dark.textMuted : Colors.textMuted} style={styles.statArrow} />
            </SoftCard>
          </Pressable>

          <Pressable 
            style={styles.statCard} 
            onPress={() => router.push("/admin/supervisors")}
          >
            <SoftCard style={[styles.innerStatCard, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }]}>
              <View style={[styles.statIcon, { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.1)' : Colors.accent + '15' }]}>
                <Feather name="users" size={18} color={isDarkMode ? '#34D399' : Colors.accent} />
              </View>
              <Text style={[styles.statLabel, isDarkMode && { color: 'white' }]}>Personnel</Text>
              <Feather name="arrow-right" size={14} color={isDarkMode ? Colors.dark.textMuted : Colors.textMuted} style={styles.statArrow} />
            </SoftCard>
          </Pressable>
        </View>

        {/* Create Supervisor Form */}
        <SoftCard style={[styles.formCard, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.1)' : Colors.primaryMuted }]}>
              <Feather name="user-plus" size={20} color={isDarkMode ? '#34D399' : Colors.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, isDarkMode && { color: 'white' }]}>New Supervisor</Text>
              <Text style={[styles.cardSubtitle, isDarkMode && { color: Colors.dark.textSub }]}>Issue field credentials</Text>
            </View>
          </View>

          <View style={styles.form}>
            <SoftInput 
              label="Full Name"
              placeholder="e.g. Michael Scott"
              value={supName}
              onChangeText={setSupName}
              icon="user"
            />
            <SoftInput 
              label="Email Address"
              placeholder="m.scott@gms.com"
              value={supEmail}
              onChangeText={setSupEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              icon="mail"
            />
            <SoftInput 
              label="Mobile Number"
              placeholder="+91 00000 00000"
              value={supPhone}
              onChangeText={setSupPhone}
              keyboardType="phone-pad"
              icon="phone"
            />
            <SoftInput 
              label="Onboarding Password"
              placeholder="Temp password"
              value={supPass}
              onChangeText={setSupPass}
              secureTextEntry
              icon="lock"
            />

            <View style={styles.siteSection}>
              <Text style={[styles.inputLabel, isDarkMode && { color: Colors.dark.textSub }]}>Assign to Sites</Text>
              {sites.length === 0 ? (
                <Text style={[styles.emptyText, isDarkMode && { color: Colors.dark.textMuted }]}>No sites found for this company.</Text>
              ) : (
                <View style={styles.siteGrid}>
                  {sites.map(s => {
                    const isSelected = selectedSiteIds.includes(s.id);
                    return (
                      <Pressable 
                        key={s.id} 
                        style={[styles.siteChip, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }, isSelected && styles.siteChipActive]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedSiteIds(prev => 
                            isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                        }}
                      >
                        <Text style={[styles.siteChipText, isSelected && styles.siteChipTextActive, isDarkMode && !isSelected && { color: Colors.dark.textSub }]}>
                          {s.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {supError ? <Text style={styles.errorText}>{supError}</Text> : null}

            <SoftButton 
              title={supLoading ? "Provisioning..." : "Create Supervisor Account"}
              onPress={handleCreateSupervisor}
              loading={supLoading}
              style={styles.submitBtn}
            />
          </View>
        </SoftCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFA' },
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
  subtitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#6B7280', marginTop: -2 },
  bellBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white' },
  avatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'white' },
  avatarFallback: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#146A65', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
  scroll: { paddingHorizontal: 32, paddingBottom: 120, gap: 32 },
  section: { gap: 16 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_800ExtraBold", color: '#9CA3AF', textTransform: "uppercase", letterSpacing: 1.5, marginLeft: 8 },
  companyScroll: { marginHorizontal: -32, paddingHorizontal: 32 },
  companyChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, backgroundColor: 'white', marginRight: 12, borderWidth: 1, borderColor: '#F0F4F4' },
  companyChipActive: { backgroundColor: '#146A65', borderColor: '#146A65' },
  companyChipText: { fontSize: 14, fontFamily: "Inter_700Bold", color: '#4B5563' },
  companyChipTextActive: { color: 'white' },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1 },
  innerStatCard: { padding: 24, gap: 16, alignItems: 'flex-start', borderRadius: 32 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#A4F0E920' },
  statLabel: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  statArrow: { position: 'absolute', top: 24, right: 24 },
  formCard: { padding: 32, gap: 32, borderRadius: 40 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center", backgroundColor: '#A4F0E920' },
  cardTitle: { fontSize: 20, fontFamily: "Inter_900Black", color: '#111827' },
  cardSubtitle: { fontSize: 13, fontFamily: "Inter_500Medium", color: '#6B7280', marginTop: 2 },
  form: { gap: 24 },
  siteSection: { gap: 16 },
  inputLabel: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#4B5563', marginLeft: 16 },
  siteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  siteChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 32, backgroundColor: '#F0F4F4' },
  siteChipActive: { backgroundColor: '#146A65' },
  siteChipText: { fontSize: 13, fontFamily: "Inter_700Bold", color: '#4B5563' },
  siteChipTextActive: { color: 'white' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#9CA3AF', marginLeft: 16, fontStyle: 'italic' },
  errorText: { color: '#EF4444', fontSize: 12, fontFamily: "Inter_700Bold", textAlign: 'center' },
  submitBtn: { marginTop: 8, height: 60, borderRadius: 30 },
});
