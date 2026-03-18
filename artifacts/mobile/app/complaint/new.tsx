import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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

const CATEGORIES = [
  { label: "Maintenance", icon: "tool" as const },
  { label: "Safety", icon: "shield" as const },
  { label: "Electrical", icon: "zap" as const },
  { label: "Structural", icon: "home" as const },
  { label: "Cleanliness", icon: "wind" as const },
  { label: "Security", icon: "lock" as const },
  { label: "Other", icon: "more-horizontal" as const },
];

const PRIORITIES = [
  { label: "Low", value: "low" as const, color: Colors.resolved },
  { label: "Medium", value: "medium" as const, color: Colors.inProgress },
  { label: "High", value: "high" as const, color: Colors.pending },
];

export default function NewComplaintScreen() {
  const { currentUser, selectedCompanyId, getCompanySites, getCompanyUsers, addComplaint } = useApp();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Maintenance");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [siteId, setSiteId] = useState("");
  const [beforeMedia, setBeforeMedia] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const insets = useSafeAreaInsets();

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const sites = getCompanySites(companyId);
  const users = getCompanyUsers(companyId);
  const supervisors = users.filter((u) => u.role === "supervisor");
  const defaultSite = sites[0]?.id ?? "";
  const effectiveSiteId = siteId || defaultSite;
  const selectedSite = sites.find((s) => s.id === effectiveSiteId);

  const assignedSupervisorId = selectedSite?.assignedSupervisorId ?? null;
  const supervisor = assignedSupervisorId ? users.find((u) => u.id === assignedSupervisorId) : supervisors[0];

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBeforeMedia(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim() || !effectiveSiteId) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    Keyboard.dismiss();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addComplaint({
      companyId,
      siteId: effectiveSiteId,
      siteName: selectedSite?.name ?? "Unknown Site",
      clientId: currentUser?.id ?? "",
      clientName: currentUser?.name ?? "Unknown",
      supervisorId: supervisor?.id ?? null,
      supervisorName: supervisor?.name ?? null,
      status: "pending",
      beforeMediaUrl: beforeMedia,
      afterMediaUrl: null,
      description: description.trim(),
      category,
      priority,
      resolvedAt: null,
      startedAt: null,
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.navbar, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 8 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="x" size={18} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Raise Complaint</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Camera-first photo upload */}
        <Pressable style={styles.cameraArea} onPress={handlePickPhoto}>
          {beforeMedia ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: beforeMedia }} style={styles.previewImg} />
              <LinearGradient colors={["transparent", "rgba(8,15,28,0.8)"]} style={styles.previewGrad} />
              <View style={styles.previewOverlay}>
                <Feather name="check-circle" size={16} color={Colors.resolved} />
                <Text style={styles.previewText}>Photo attached</Text>
                <Pressable style={styles.previewRemove} onPress={() => setBeforeMedia(null)}>
                  <Feather name="trash-2" size={14} color={Colors.pending} />
                  <Text style={styles.previewRemoveText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <LinearGradient colors={["rgba(37,99,235,0.1)", "rgba(37,99,235,0.03)"]} style={styles.cameraPlaceholder}>
              <View style={styles.cameraIconRing}>
                <Feather name="camera" size={28} color={Colors.accent} />
              </View>
              <Text style={styles.cameraTitle}>Add Photo Evidence</Text>
              <Text style={styles.cameraSub}>Tap to upload a before photo</Text>
            </LinearGradient>
          )}
        </Pressable>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Description *</Text>
          <TextInput
            style={[styles.textArea, descFocused && styles.textAreaFocused]}
            placeholder="Describe the issue in detail — be specific about location, severity, and impact…"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            selectionColor={Colors.accent}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.label;
              return (
                <Pressable
                  key={cat.label}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat.label); }}
                >
                  <Feather name={cat.icon} size={13} color={active ? Colors.white : Colors.textSub} />
                  <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Priority Level</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const active = priority === p.value;
              return (
                <Pressable
                  key={p.value}
                  style={[styles.priorityBtn, active && { backgroundColor: p.color + "22", borderColor: p.color }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPriority(p.value); }}
                >
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text style={[styles.priorityText, active && { color: p.color }]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Site selector */}
        {sites.length > 1 && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Site</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {sites.map((s) => {
                  const active = effectiveSiteId === s.id;
                  return (
                    <Pressable key={s.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setSiteId(s.id)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Summary info */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Feather name="map-pin" size={13} color={Colors.accent} />
            <Text style={styles.summaryLabel}>Site</Text>
            <Text style={styles.summaryValue}>{selectedSite?.name ?? "—"}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Feather name="user" size={13} color={Colors.accent} />
            <Text style={styles.summaryLabel}>Supervisor</Text>
            <Text style={styles.summaryValue}>{supervisor?.name ?? "Unassigned"}</Text>
          </View>
        </View>

        {/* Submit */}
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, (loading || !description.trim()) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={loading || !description.trim()}
        >
          <LinearGradient colors={["#2563EB", "#1D4ED8"]} style={styles.submitGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Feather name={loading ? "clock" : "send"} size={18} color={Colors.white} />
            <Text style={styles.submitText}>{loading ? "Submitting…" : "Submit Complaint"}</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.surfaceBorder },
  navTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 8, gap: 20 },
  cameraArea: { borderRadius: 18, overflow: "hidden", borderWidth: 1.5, borderColor: Colors.border, borderStyle: "dashed" },
  cameraPlaceholder: { alignItems: "center", paddingVertical: 36, gap: 10 },
  cameraIconRing: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryMuted, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: Colors.primary + "40" },
  cameraTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text },
  cameraSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  photoPreview: { height: 180, position: "relative" },
  previewImg: { width: "100%", height: "100%" },
  previewGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80 },
  previewOverlay: { position: "absolute", bottom: 12, left: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  previewText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.white },
  previewRemove: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  previewRemoveText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.pending },
  field: { gap: 10 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.textMuted, letterSpacing: 1, textTransform: "uppercase" },
  textArea: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, fontSize: 14,
    fontFamily: "Inter_400Regular", color: Colors.text, minHeight: 110,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  textAreaFocused: { borderColor: Colors.primary },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSub },
  catChipTextActive: { color: Colors.white },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSub },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSub },
  chipTextActive: { color: Colors.white },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 12 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textMuted, flex: 1 },
  summaryValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  summaryDivider: { height: 1, backgroundColor: Colors.surfaceBorder },
  submitBtn: { borderRadius: 14, overflow: "hidden" },
  submitGrad: { height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.white },
});
