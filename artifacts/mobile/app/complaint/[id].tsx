import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { complaints, currentUser, updateComplaint } = useApp();
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const complaint = complaints.find((c) => c.id === id);

  if (!complaint) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={40} color={Colors.textMuted} />
        <Text style={styles.notFoundText}>Complaint not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const role = currentUser?.role;
  const isSupervisor = role === "supervisor" && complaint.supervisorId === currentUser?.id;
  const canStart = isSupervisor && complaint.status === "pending";
  const canUploadAfter = isSupervisor && complaint.status === "in_progress";
  const canResolve = isSupervisor && complaint.status === "in_progress";

  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—";

  const handleStartWork = async () => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateComplaint(complaint.id, { status: "in_progress", startedAt: new Date().toISOString() });
    setLoading(false);
  };

  const handlePickImage = async (type: "before" | "after") => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await updateComplaint(complaint.id, type === "before" ? { beforeMediaUrl: result.assets[0].uri } : { afterMediaUrl: result.assets[0].uri });
    }
  };

  const handleResolve = () => {
    Alert.alert("Mark as Resolved", "Confirm that this complaint has been fully resolved?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve", onPress: async () => {
          setLoading(true);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await updateComplaint(complaint.id, { status: "resolved", resolvedAt: new Date().toISOString() });
          setLoading(false);
        },
      },
    ]);
  };

  const timeline = [
    { label: "Raised", date: complaint.createdAt, icon: "alert-circle" as const, color: Colors.textMuted },
    ...(complaint.startedAt ? [{ label: "Work Started", date: complaint.startedAt, icon: "play-circle" as const, color: Colors.inProgress }] : []),
    ...(complaint.resolvedAt ? [{ label: "Resolved", date: complaint.resolvedAt, icon: "check-circle" as const, color: Colors.resolved }] : []),
  ];

  const STATUS_GRADIENTS: Record<string, [string, string]> = {
    pending: [Colors.pendingBg, "transparent"],
    in_progress: [Colors.inProgressBg, "transparent"],
    resolved: [Colors.resolvedBg, "transparent"],
  };

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}
      >
        {/* Header bar */}
        <View style={[styles.navbar, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 8 }]}>
          <Pressable style={styles.backArrow} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={Colors.text} />
          </Pressable>
          <Text style={styles.navTitle}>Complaint Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status banner */}
        <LinearGradient colors={STATUS_GRADIENTS[complaint.status]} style={styles.statusBanner}>
          <View style={styles.statusRow}>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            <View style={styles.catTag}>
              <Text style={styles.catText}>{complaint.category}</Text>
            </View>
          </View>
          <Text style={styles.descriptionText}>{complaint.description}</Text>
        </LinearGradient>

        {/* Meta details */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DETAILS</Text>
          <View style={styles.detailList}>
            {[
              { icon: "map-pin" as const, label: "Site", value: complaint.siteName },
              { icon: "user" as const, label: "Raised By", value: complaint.clientName },
              { icon: "tool" as const, label: "Supervisor", value: complaint.supervisorName ?? "Unassigned" },
            ].map((d) => (
              <View key={d.label} style={styles.detailItem}>
                <View style={styles.detailIconWrap}>
                  <Feather name={d.icon} size={13} color={Colors.accent} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text style={styles.detailValue}>{d.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* BEFORE / AFTER comparison */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PHOTO EVIDENCE</Text>
          <View style={styles.photoCompare}>
            {/* BEFORE */}
            <View style={styles.photoSide}>
              <View style={styles.photoLabel}>
                <View style={[styles.photoLabelDot, { backgroundColor: Colors.pending }]} />
                <Text style={styles.photoLabelText}>BEFORE</Text>
              </View>
              <Pressable
                style={styles.photoSlot}
                onPress={() => isSupervisor && handlePickImage("before")}
              >
                {complaint.beforeMediaUrl ? (
                  <Image source={{ uri: complaint.beforeMediaUrl }} style={styles.photo} />
                ) : (
                  <View style={styles.photoEmpty}>
                    <Feather name="camera" size={22} color={Colors.textMuted} />
                    {isSupervisor && <Text style={styles.photoEmptyText}>Tap to upload</Text>}
                  </View>
                )}
              </Pressable>
            </View>

            <View style={styles.photoVsLine}>
              <View style={styles.vsLine} />
              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>
              <View style={styles.vsLine} />
            </View>

            {/* AFTER */}
            <View style={styles.photoSide}>
              <View style={styles.photoLabel}>
                <View style={[styles.photoLabelDot, { backgroundColor: Colors.resolved }]} />
                <Text style={styles.photoLabelText}>AFTER</Text>
              </View>
              <Pressable
                style={styles.photoSlot}
                onPress={() => canUploadAfter && handlePickImage("after")}
              >
                {complaint.afterMediaUrl ? (
                  <Image source={{ uri: complaint.afterMediaUrl }} style={styles.photo} />
                ) : (
                  <View style={[styles.photoEmpty, canUploadAfter && { borderColor: Colors.resolved }]}>
                    <Feather name={canUploadAfter ? "upload" : "lock"} size={22} color={canUploadAfter ? Colors.resolved : Colors.textMuted} />
                    <Text style={[styles.photoEmptyText, canUploadAfter && { color: Colors.resolved }]}>
                      {canUploadAfter ? "Upload proof" : "Pending"}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>TIMELINE</Text>
          {timeline.map((t, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: t.color }]}>
                  <Feather name={t.icon} size={10} color={Colors.white} />
                </View>
                {i < timeline.length - 1 && <View style={styles.timelineConnector} />}
              </View>
              <View style={styles.timelineBody}>
                <Text style={[styles.timelineLabel, { color: t.color }]}>{t.label}</Text>
                <Text style={styles.timelineDate}>{fmt(t.date)}</Text>
              </View>
            </View>
          ))}
          {complaint.status !== "resolved" && (
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: Colors.surfaceBorder, borderWidth: 1.5, borderColor: Colors.border }]} />
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelinePending}>Resolution pending…</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action buttons */}
        {canStart && (
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: Colors.inProgress }, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            onPress={handleStartWork}
            disabled={loading}
          >
            <Feather name="play-circle" size={20} color={Colors.white} />
            <Text style={styles.actionBtnText}>{loading ? "Starting…" : "Start Work"}</Text>
          </Pressable>
        )}

        {canUploadAfter && !canResolve && (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
            onPress={() => handlePickImage("after")}
          >
            <Feather name="upload" size={20} color={Colors.white} />
            <Text style={styles.actionBtnText}>Upload After Photo</Text>
          </Pressable>
        )}

        {canResolve && (
          <Pressable
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: Colors.resolved }, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            onPress={handleResolve}
            disabled={loading}
          >
            <Feather name="check-circle" size={20} color={Colors.white} />
            <Text style={styles.actionBtnText}>{loading ? "Resolving…" : "Mark as Resolved"}</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, gap: 14 },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, backgroundColor: Colors.bg },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textSub },
  backBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: Colors.white, fontFamily: "Inter_600SemiBold", fontSize: 14 },
  navbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingBottom: 8,
  },
  backArrow: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.surfaceBorder },
  navTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  statusBanner: { borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.surfaceBorder },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  catTag: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  catText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textSub },
  descriptionText: { fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text, lineHeight: 22 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: Colors.surfaceBorder },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.textMuted, letterSpacing: 1.2, textTransform: "uppercase" },
  detailList: { gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailIconWrap: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.primaryMuted, justifyContent: "center", alignItems: "center" },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text, marginTop: 1 },
  photoCompare: { flexDirection: "row", alignItems: "flex-start", gap: 0 },
  photoSide: { flex: 1, gap: 6 },
  photoLabel: { flexDirection: "row", alignItems: "center", gap: 5 },
  photoLabelDot: { width: 6, height: 6, borderRadius: 3 },
  photoLabelText: { fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.textMuted, letterSpacing: 1 },
  photoSlot: { height: 130, borderRadius: 12, overflow: "hidden", borderWidth: 1.5, borderColor: Colors.border, borderStyle: "dashed" },
  photo: { width: "100%", height: "100%" },
  photoEmpty: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.surfaceElevated, gap: 6 },
  photoEmptyText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  photoVsLine: { width: 28, alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 22 },
  vsLine: { flex: 1, width: 1, backgroundColor: Colors.surfaceBorder },
  vsBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceElevated, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  vsText: { fontSize: 8, fontFamily: "Inter_700Bold", color: Colors.textMuted, letterSpacing: 0.5 },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineLeft: { alignItems: "center", width: 24 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  timelineConnector: { flex: 1, width: 1.5, backgroundColor: Colors.surfaceBorder, marginVertical: 4 },
  timelineBody: { flex: 1, paddingBottom: 14, gap: 2 },
  timelineLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  timelineDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  timelinePending: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, fontStyle: "italic" },
  actionBtn: {
    borderRadius: 14, height: 54, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  actionBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.white },
});
