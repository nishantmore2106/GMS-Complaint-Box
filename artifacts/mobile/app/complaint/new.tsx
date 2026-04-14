import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { DashboardHeader } from "@/components/DashboardHeader";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";
import { SoftCard } from "@/components/SoftCard";
import { SoftButton } from "@/components/SoftButton";

const CATEGORY_MAP: Record<string, { icon: any, subcategories: string[] }> = {
  "Attendance": {
    icon: "users",
    subcategories: ["Staff Shortage", "Late Arrival", "Uninformed Leave", "Shift Handover Issue"]
  },
  "Cleaning": {
    icon: "wind",
    subcategories: ["Common Area", "Washroom Hygiene", "Waste Management", "Deep Cleaning"]
  },
  "Security": {
    icon: "shield",
    subcategories: ["Unauthorized Entry", "Sleeping on Duty", "Gate Log Issue", "Safety Hazard"]
  },
  "Conduct": {
    icon: "user-check",
    subcategories: ["Improper Uniform", "Rude Behavior", "Mobile Misuse", "Indiscipline"]
  },
  "Maintenance": {
    icon: "tool",
    subcategories: ["Electrical Issue", "Plumbing Issue", "Lift Failure", "General Repair"]
  },
  "Other": {
    icon: "more-horizontal",
    subcategories: ["General Inquiry", "Miscellaneous"]
  }
};

const PRIORITIES = [
  { label: "Low", value: "low" as const, color: '#10B981' }, // emerald
  { label: "Medium", value: "medium" as const, color: '#F59E0B' }, // amber
  { label: "High", value: "high" as const, color: '#EF4444' }, // red
];

export default function NewComplaintScreen() {
  const params = useLocalSearchParams<{ siteId: string }>();
  const { currentUser, selectedCompanyId, getCompanySites, getCompanyUsers, addComplaint, uploadImage, isDarkMode } = useApp();
  const { showToast } = useToast();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Attendance");
  const [subcategory, setSubcategory] = useState(CATEGORY_MAP["Attendance"].subcategories[0]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [siteId, setSiteId] = useState("");
  const [beforeMedia, setBeforeMedia] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (params.siteId) {
      setSiteId(params.siteId);
    }
  }, [params.siteId]);

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const role = currentUser?.role;
  const sites = getCompanySites(companyId).filter(s => {
    if (role === 'client') return s.clientId === currentUser?.id && s.name !== 'Elite Residences';
    return true;
  }).slice(0, role === 'client' ? 1 : undefined);
  const users = getCompanyUsers(companyId);
  const supervisors = users.filter((u) => u.role === "supervisor");
  const defaultSite = sites[0]?.id ?? "";
  const effectiveSiteId = siteId || defaultSite;
  const selectedSite = sites.find((s) => s.id === effectiveSiteId);
  const isSuspended = selectedSite?.status === 'suspended';

  const assignedSupervisorId = selectedSite?.assignedSupervisorId ?? null;
  const supervisor = assignedSupervisorId ? users.find((u) => u.id === assignedSupervisorId) : null;
  const noSupervisor = role === 'client' && !assignedSupervisorId;

  const handlePickPhoto = async () => {
    // 🛡️ PERMISSION CHECK (Production requirement)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Gallery access required to attach photos", "error");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ['images'], 
        quality: 0.7 
      });
      if (!result.canceled && result.assets[0]) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setBeforeMedia(result.assets[0].uri);
      }
    } catch (err) {
      console.warn("[NewComplaint] Image pick error:", err);
      showToast("Unable to open gallery", "error");
    }
  };

  const handleSubmit = async () => {
    if (!description.trim() || !effectiveSiteId) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (isSuspended) {
      showToast("This site is currently suspended", "error");
      return;
    }
    if (noSupervisor) {
      showToast("Cannot submit: No supervisor assigned to this site", "error");
      return;
    }
    setLoading(true);
    Keyboard.dismiss();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let publicUrl = beforeMedia;
      if (beforeMedia && !beforeMedia.startsWith('http')) {
        console.log("[NewComplaint] Uploading image...");
        const fileName = `complaints/before_${Date.now()}.jpg`;
        publicUrl = await uploadImage(beforeMedia, fileName);
        console.log("[NewComplaint] Image uploaded:", publicUrl);
      }

      console.log("[NewComplaint] Submitting complaint...");
      await addComplaint({
        companyId,
        siteId: effectiveSiteId,
        siteName: selectedSite?.name ?? "Unknown Site",
        clientId: currentUser?.id ?? "",
        clientName: currentUser?.name ?? "Unknown",
        supervisorId: supervisor?.id ?? null,
        supervisorName: supervisor?.name ?? null,
        status: "pending",
        beforeMediaUrl: publicUrl,
        afterMediaUrl: null,
        description: description.trim(),
        category,
        priority,
        subcategory,
        resolvedAt: null,
        startedAt: null,
      });
      console.log("[NewComplaint] Complaint submitted successfully!");
      showToast("Complaint raised!", "success");
      router.back();
    } catch (e: any) {
      console.error("[NewComplaint] Submit ERROR:", e);
      showToast(e.message || "Submission failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, isDarkMode && { backgroundColor: Colors.dark.bg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <DashboardHeader 
        title="Raise Complaint"
        subtitle="New service request"
        showBack={true}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Upload Area */}
        <Pressable onPress={handlePickPhoto}>
          <View style={[styles.photoCard, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
            {beforeMedia ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: beforeMedia }} style={styles.preview} />
                <Pressable style={styles.removeBtn} onPress={() => setBeforeMedia(null)}>
                  <Feather name="trash-2" size={16} color="white" />
                </Pressable>
              </View>
            ) : (
              <View style={[styles.emptyPhoto, isDarkMode && { backgroundColor: '#1E293B30', borderColor: Colors.dark.border }]}>
                <View style={[styles.cameraIcon, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
                  <Feather name="camera" size={28} color={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"} />
                </View>
                <Text style={[styles.photoTitle, isDarkMode && { color: Colors.dark.text }]}>Attach Photo Evidence</Text>
                <Text style={[styles.photoSub, isDarkMode && { color: Colors.dark.textMuted }]}>Help us identify the issue visually</Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Site Selection (if multiple) */}
        {sites.length > 1 && !params.siteId && (
          <View style={styles.field}>
            <Text style={[styles.label, isDarkMode && { color: Colors.dark.textMuted }]}>SITE LOCATION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {sites.map((s) => {
                const active = effectiveSiteId === s.id;
                return (
                  <Pressable 
                    key={s.id} 
                    style={[styles.chip, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated, borderColor: Colors.dark.border, borderWidth: 1 }, active && (isDarkMode ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : styles.chipActive)]} 
                    onPress={() => setSiteId(s.id)}
                  >
                    <Text style={[styles.chipText, isDarkMode && { color: Colors.dark.textSub }, active && styles.chipTextActive]}>{s.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Categories */}
        <View style={styles.field}>
          <Text style={[styles.label, isDarkMode && { color: Colors.dark.textMuted }]}>ISSUE CATEGORY</Text>
          <View style={styles.catGrid}>
            {Object.keys(CATEGORY_MAP).map((catKey) => {
              const active = category === catKey;
              const cat = CATEGORY_MAP[catKey];
              return (
                <Pressable
                  key={catKey}
                  style={[styles.catChip, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated, borderColor: Colors.dark.border, borderWidth: 1 }, active && (isDarkMode ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : styles.catChipActive)]}
                  onPress={() => { 
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                    setCategory(catKey);
                    setSubcategory(cat.subcategories[0]);
                  }}
                >
                  <Feather name={cat.icon} size={14} color={active ? 'white' : (isDarkMode ? Colors.dark.text : '#111827')} />
                  <Text style={[styles.catText, isDarkMode && { color: Colors.dark.text }, active && styles.catTextActive]}>{catKey}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Subcategories (Dynamic) */}
        <View style={styles.field}>
          <Text style={[styles.label, isDarkMode && { color: Colors.dark.textMuted }]}>SPECIFIC INCIDENT</Text>
          <View style={styles.catGrid}>
            {CATEGORY_MAP[category].subcategories.map((sub) => {
              const active = subcategory === sub;
              return (
                <Pressable
                  key={sub}
                  style={[styles.subChip, isDarkMode && { backgroundColor: '#1E293B50' }, active && (isDarkMode ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : styles.subChipActive)]}
                  onPress={() => { 
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                    setSubcategory(sub);
                  }}
                >
                  <Text style={[styles.subText, isDarkMode && { color: Colors.dark.textSub }, active && { color: 'white' }]}>{sub}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={[styles.label, isDarkMode && { color: Colors.dark.textMuted }]}>DETAILED DESCRIPTION</Text>
          <TextInput
            style={[styles.textArea, isDarkMode && { backgroundColor: Colors.dark.surface, color: Colors.dark.text, borderColor: Colors.dark.border }]}
            placeholder="Provide context, location details, and any specific requests..."
            placeholderTextColor={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {/* Priority Row */}
        <View style={styles.field}>
          <Text style={[styles.label, isDarkMode && { color: Colors.dark.textMuted }]}>SEVERITY LEVEL</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const active = priority === p.value;
              return (
                <Pressable
                  key={p.value}
                  style={[styles.pBtn, isDarkMode && { backgroundColor: Colors.dark.surface }, active && { backgroundColor: p.color + '10', borderColor: p.color, borderWidth: 1.5 }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPriority(p.value); }}
                >
                  <View style={[styles.pDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.pText, isDarkMode && { color: Colors.dark.textSub }, active && { color: p.color }]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Summary Mini-Card */}
        <View style={[styles.summaryCard, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
           <View style={styles.summaryInfo}>
              <Feather name="info" size={16} color={noSupervisor ? '#EF4444' : (isDarkMode ? Colors.dark.textMuted : '#6B7280')} />
              <Text style={[styles.summaryLabel, isDarkMode && { color: Colors.dark.textSub }]}>Assigned to</Text>
              <Text style={[styles.summaryValue, isDarkMode && { color: Colors.dark.text }, noSupervisor && { color: '#EF4444' }]}>{supervisor?.name ?? 'Not Assigned'}</Text>
           </View>
        </View>

        {noSupervisor && (
          <View style={[styles.errorBox, isDarkMode && { backgroundColor: '#7F1D1D30', borderColor: '#7F1D1D' }]}>
            <Feather name="alert-triangle" size={16} color="#EF4444" />
            <Text style={[styles.errorText, isDarkMode && { color: '#FCA5A5' }]}>No supervisor is assigned to this site. Complaints cannot be submitted until a supervisor is assigned by your administrator.</Text>
          </View>
        )}

        {isSuspended && (
          <View style={[styles.errorBox, isDarkMode && { backgroundColor: '#7F1D1D30', borderColor: '#7F1D1D' }]}>
            <Feather name="slash" size={16} color="#EF4444" />
            <Text style={[styles.errorText, isDarkMode && { color: '#FCA5A5' }]}>Site services are currently paused.</Text>
          </View>
        )}

        <SoftButton
          title={loading ? "Transmitting..." : "Raise Complaint"}
          onPress={handleSubmit}
          loading={loading}
          disabled={!description.trim() || isSuspended || noSupervisor}
          style={styles.submitBtn}
          isDarkMode={isDarkMode}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 32, paddingBottom: 20 },
  navBtn: { 
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', 
    justifyContent: "center", alignItems: "center",
  },
  navTitle: { fontSize: 24, fontFamily: "Inter_900Black", color: '#111827' },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 24, paddingTop: 10, gap: 32 },
  
  photoCard: { height: 200, borderRadius: 40, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 30, elevation: 4 },
  emptyPhoto: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', gap: 12, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 40 },
  cameraIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  photoTitle: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827' },
  photoSub: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#9CA3AF' },
  previewContainer: { flex: 1, borderRadius: 40, overflow: 'hidden' },
  preview: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(17, 24, 39, 0.6)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  
  field: { gap: 16 },
  label: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 1.5, marginLeft: 8 },
  
  chipScroll: { marginHorizontal: -24, paddingHorizontal: 24 },
  chip: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 100, backgroundColor: 'white', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  chipActive: { backgroundColor: '#111827' },
  chipText: { fontSize: 14, fontFamily: "Inter_700Bold", color: '#4B5563' },
  chipTextActive: { color: 'white' },
  
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 100, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  catChipActive: { backgroundColor: '#111827' },
  catText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#111827' },
  catTextActive: { color: 'white' },
  
  subChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 100, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: 'transparent' },
  subChipActive: { backgroundColor: 'white', borderColor: '#111827' },
  subText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#4B5563' },
  subTextActive: { color: '#111827', fontFamily: 'Inter_800ExtraBold' },
  
  textArea: { backgroundColor: '#F3F4F6', borderRadius: 32, padding: 24, fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#111827', height: 160, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  
  priorityRow: { flexDirection: 'row', gap: 12 },
  pBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 58, borderRadius: 100, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1.5, borderColor: 'transparent' },
  pDot: { width: 10, height: 10, borderRadius: 5 },
  pText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#4B5563' },
  
  summaryCard: { padding: 24, borderRadius: 32, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 30, elevation: 4 },
  summaryInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#6B7280', flex: 1 },
  summaryValue: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF2F2', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#EF4444' },
  
  submitBtn: { height: 64, borderRadius: 100 },
});
