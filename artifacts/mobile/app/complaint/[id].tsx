import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, router } from "expo-router";
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
import { Colors } from "@/constants/colors";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { complaints, currentUser, updateComplaint } = useApp();
  const [loading, setLoading] = useState(false);

  const complaint = complaints.find((c) => c.id === id);

  if (!complaint) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={40} color={Colors.textMuted} />
        <Text style={styles.notFoundText}>Complaint not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isSupervisor = currentUser?.role === "supervisor";
  const canStart =
    isSupervisor && complaint.status === "pending" && complaint.supervisorId === currentUser?.id;
  const canUploadAfter =
    isSupervisor && complaint.status === "in_progress" && complaint.supervisorId === currentUser?.id;
  const canResolve =
    isSupervisor && complaint.status === "in_progress" && complaint.supervisorId === currentUser?.id;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStartWork = async () => {
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateComplaint(complaint.id, {
      status: "in_progress",
      startedAt: new Date().toISOString(),
    });
    setLoading(false);
  };

  const handlePickImage = async (type: "before" | "after") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const uri = result.assets[0].uri;
      if (type === "before") {
        await updateComplaint(complaint.id, { beforeMediaUrl: uri });
      } else {
        await updateComplaint(complaint.id, { afterMediaUrl: uri });
      }
    }
  };

  const handleResolve = () => {
    Alert.alert(
      "Mark as Resolved",
      "Confirm that the complaint has been fully resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          onPress: async () => {
            setLoading(true);
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
            await updateComplaint(complaint.id, {
              status: "resolved",
              resolvedAt: new Date().toISOString(),
            });
            setLoading(false);
          },
        },
      ]
    );
  };

  const timeline = [
    { label: "Raised", date: complaint.createdAt, color: Colors.textMuted },
    ...(complaint.startedAt
      ? [{ label: "Work Started", date: complaint.startedAt, color: Colors.accent }]
      : []),
    ...(complaint.resolvedAt
      ? [{ label: "Resolved", date: complaint.resolvedAt, color: Colors.success }]
      : []),
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: Platform.OS === "web" ? 34 : 40 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <StatusBadge status={complaint.status} />
        <PriorityBadge priority={complaint.priority} />
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{complaint.category}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Description</Text>
        <Text style={styles.description}>{complaint.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Feather name="map-pin" size={14} color={Colors.textMuted} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Site</Text>
              <Text style={styles.detailValue}>{complaint.siteName}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Feather name="user" size={14} color={Colors.textMuted} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Raised By</Text>
              <Text style={styles.detailValue}>{complaint.clientName}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Feather name="tool" size={14} color={Colors.textMuted} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Supervisor</Text>
              <Text style={styles.detailValue}>
                {complaint.supervisorName ?? "Unassigned"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Timeline</Text>
        {timeline.map((t, i) => (
          <View key={i} style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: t.color }]} />
            {i < timeline.length - 1 && <View style={styles.timelineLine} />}
            <View style={styles.timelineContent}>
              <Text style={[styles.timelineLabel, { color: t.color }]}>{t.label}</Text>
              <Text style={styles.timelineDate}>{formatDate(t.date)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Photo Evidence</Text>
        <View style={styles.photoRow}>
          <Pressable
            style={styles.photoSlot}
            onPress={() =>
              isSupervisor ? handlePickImage("before") : undefined
            }
          >
            {complaint.beforeMediaUrl ? (
              <Image
                source={{ uri: complaint.beforeMediaUrl }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.photoEmpty}>
                <Feather name="camera" size={24} color={Colors.textMuted} />
                <Text style={styles.photoEmptyText}>Before</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.photoSlot}
            onPress={() =>
              canUploadAfter ? handlePickImage("after") : undefined
            }
          >
            {complaint.afterMediaUrl ? (
              <Image
                source={{ uri: complaint.afterMediaUrl }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.photoEmpty}>
                <Feather name="camera" size={24} color={Colors.textMuted} />
                <Text style={styles.photoEmptyText}>After</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {canStart && (
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: Colors.accent },
            pressed && styles.actionBtnPressed,
            loading && styles.actionBtnDisabled,
          ]}
          onPress={handleStartWork}
          disabled={loading}
        >
          <Feather name="play-circle" size={20} color={Colors.white} />
          <Text style={styles.actionBtnText}>Start Work</Text>
        </Pressable>
      )}

      {canResolve && (
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: Colors.success },
            pressed && styles.actionBtnPressed,
            loading && styles.actionBtnDisabled,
          ]}
          onPress={handleResolve}
          disabled={loading}
        >
          <Feather name="check-circle" size={20} color={Colors.white} />
          <Text style={styles.actionBtnText}>Mark as Resolved</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  notFound: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surfaceSecondary,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  backBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: Colors.white,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryTag: {
    backgroundColor: Colors.surfaceTertiary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  description: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  detailGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailContent: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    position: "absolute",
    left: 4.5,
    top: 14,
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
    paddingBottom: 12,
  },
  timelineLabel: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  timelineDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoSlot: {
    flex: 1,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  photo: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  photoEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surfaceTertiary,
    gap: 6,
  },
  photoEmptyText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  actionBtn: {
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionBtnPressed: { opacity: 0.85 },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
});
