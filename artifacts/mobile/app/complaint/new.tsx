import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
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
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const CATEGORIES = [
  "Maintenance",
  "Safety",
  "Electrical",
  "Structural",
  "Cleanliness",
  "Security",
  "Other",
];

const PRIORITIES: { label: string; value: "low" | "medium" | "high" }[] = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const PRIORITY_COLORS = {
  low: Colors.success,
  medium: Colors.warning,
  high: Colors.danger,
};

export default function NewComplaintScreen() {
  const { currentUser, selectedCompanyId, getCompanySites, getCompanyUsers, addComplaint } = useApp();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Maintenance");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [siteId, setSiteId] = useState("");
  const [beforeMedia, setBeforeMedia] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const sites = getCompanySites(companyId);
  const users = getCompanyUsers(companyId);
  const supervisors = users.filter((u) => u.role === "supervisor");
  const defaultSite = sites[0]?.id ?? "";

  const selectedSite = sites.find((s) => s.id === (siteId || defaultSite));
  const supervisor = supervisors[0];

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setBeforeMedia(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const effectiveSiteId = siteId || defaultSite;
    if (!effectiveSiteId) {
      return;
    }

    setLoading(true);
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
    <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.container,
            { paddingBottom: Platform.OS === "web" ? 34 : 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the complaint in detail..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.chip,
                    category === cat && styles.chipActive,
                  ]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(cat);
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === cat && styles.chipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.value}
                  style={[
                    styles.priorityBtn,
                    priority === p.value && {
                      backgroundColor: PRIORITY_COLORS[p.value],
                      borderColor: PRIORITY_COLORS[p.value],
                    },
                  ]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPriority(p.value);
                  }}
                >
                  <Text
                    style={[
                      styles.priorityBtnText,
                      priority === p.value && { color: Colors.white },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {sites.length > 1 && (
            <View style={styles.section}>
              <Text style={styles.label}>Site</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {sites.map((s) => {
                  const active = (siteId || defaultSite) === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSiteId(s.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Before Photo (Optional)</Text>
            <Pressable style={styles.photoUpload} onPress={handlePickPhoto}>
              {beforeMedia ? (
                <View style={styles.photoPreview}>
                  <Image
                    source={{ uri: beforeMedia }}
                    style={styles.previewImage}
                  />
                  <Pressable
                    style={styles.removePhoto}
                    onPress={() => setBeforeMedia(null)}
                  >
                    <Feather name="x" size={14} color={Colors.white} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Feather name="camera" size={28} color={Colors.textMuted} />
                  <Text style={styles.photoPlaceholderText}>
                    Upload photo evidence
                  </Text>
                  <Text style={styles.photoPlaceholderSub}>Tap to select</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.infoBox}>
            <Feather name="info" size={14} color={Colors.accent} />
            <Text style={styles.infoText}>
              Assigned to: <Text style={styles.infoBold}>{supervisor?.name ?? "Unassigned"}</Text>
              {" · "}
              Site: <Text style={styles.infoBold}>{selectedSite?.name ?? "—"}</Text>
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.submitBtnPressed,
              loading && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !description.trim()}
          >
            <Feather name="send" size={18} color={Colors.white} />
            <Text style={styles.submitBtnText}>
              {loading ? "Submitting..." : "Submit Complaint"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipRow: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 10,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
  },
  priorityBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  photoUpload: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    minHeight: 130,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surfaceTertiary,
    minHeight: 130,
    gap: 6,
  },
  photoPlaceholderText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  photoPlaceholderSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  photoPreview: {
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 180,
  },
  removePhoto: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.accent + "12",
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoBold: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  submitBtnPressed: { opacity: 0.85 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
});
