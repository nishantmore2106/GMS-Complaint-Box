import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, Platform, Alert } from "react-native";
import { SoftCard } from "./SoftCard";
import { ConfirmModal } from "./ConfirmModal";
import { Colors } from "@/constants/colors";
import { useApp, Complaint } from "@/context/AppContext";

interface Props {
  complaint: Complaint;
}

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  Maintenance: "tool",
  Safety: "shield",
  Electrical: "zap",
  Structural: "home",
  Plumbing: "droplet",
  Other: "file-text",
};

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.pending,
  in_progress: Colors.inProgress,
  resolved: Colors.resolved,
};

export function ComplaintCard({ complaint }: Props) {
  const { isDarkMode, currentUser, deleteComplaint } = useApp();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = React.useState(false);
  
  // Pulse animation for live status
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const role = currentUser?.role;
  const currentPhase = complaint.currentPhase || 'reported';
  const isLive = true; // Always show status banner on dashboard as requested

  useEffect(() => {
    if (isLive) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.8, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [isLive, pulseAnim]);
  
  const isFounder = role === 'founder';
  const isSup = role === 'supervisor' && complaint.supervisorId === currentUser?.id;
  const isClient = role === 'client';
  const canDelete = isFounder || isSup;
  const showLiveBanner = complaint.status !== 'resolved' && (isClient || isFounder || isSup);
  const icon = CATEGORY_ICONS[complaint.category] ?? "file-text";
  const statusColor = STATUS_COLORS[complaint.status] || Colors.primary;

  const timeAgo = () => {
    const diff = Date.now() - new Date(complaint.createdAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (h > 24) return new Date(complaint.createdAt).toLocaleDateString();
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return "Just now";
  };

  const workElapsed = () => {
    if (!complaint.startedAt) return '';
    const diff = Date.now() - new Date(complaint.startedAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleDelete = () => setIsDeleteModalVisible(true);

  const confirmDelete = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await deleteComplaint(complaint.id);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to delete");
    } finally {
      setIsDeleteModalVisible(false);
    }
  };

  return (
    <SoftCard
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/complaint/${complaint.id}`);
      }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: isDarkMode ? statusColor + '20' : statusColor + '15' }]}>
          <Feather name={icon} size={16} color={statusColor} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.category, isDarkMode && { color: Colors.dark.text }]}>{complaint.category}</Text>
          <Text style={[styles.site, isDarkMode && { color: Colors.dark.textSub }]} numberOfLines={1}>{complaint.siteName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '10', borderColor: statusColor + '30', borderWidth: 1 }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {complaint.status.replace('_', ' ')}
          </Text>
        </View>
        {canDelete && (
          <Pressable 
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]} 
            onPress={(e) => {
              if (Platform.OS === 'web') (e as any).stopPropagation();
              handleDelete();
            }}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </Pressable>
        )}
      </View>

      <Text style={[styles.description, isDarkMode && { color: Colors.dark.textSub }]} numberOfLines={2}>
        {complaint.description}
      </Text>

      {/* Glassmorphic Live Status Banner */}
      {showLiveBanner && (
        <View style={[styles.liveBanner, isDarkMode && styles.liveBannerDark]}>
          <View style={styles.liveDotWrapper}>
            <Animated.View style={[styles.liveDotPulse, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.liveDotCore} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.liveBannerTitle, { color: Colors.inProgress }]}>
              {currentPhase === 'reported' ? 'Reported' :
               currentPhase === 'assigned' ? 'Supervisor Assigned' :
               currentPhase === 'in_transit' ? 'Supervisor In Transit' : 
               currentPhase === 'arrived' ? 'Supervisor Arrived' :
               currentPhase === 'validating' ? 'Validating Complaint' :
               currentPhase === 'checking_issue' ? 'Checking Issue' :
               currentPhase === 'solving' ? 'Solving Issue' :
               'Supervisor is on it!'}
            </Text>
            <Text style={[styles.liveBannerSub, { color: Colors.inProgress }]}>
              {currentPhase === 'in_transit' ? 'Heading to site now' :
               currentPhase === 'arrived' ? 'Starting work session' :
               currentPhase === 'validating' ? 'Confirming details with site' :
               currentPhase === 'checking_issue' ? 'Technical inspection in progress' :
               currentPhase === 'solving' ? 'Fix currently being performed' :
               'Action expected soon'}
              {complaint.startedAt ? ` · ${workElapsed()} elapsed` : ''}
            </Text>
          </View>
          <Feather name="chevron-right" size={14} color={Colors.inProgress} />
        </View>
      )}

      <View style={[styles.footer, isDarkMode && { borderTopColor: Colors.dark.border }]}>
        <View style={styles.metaRow}>
          <Feather name="clock" size={12} color={isDarkMode ? Colors.dark.textMuted : Colors.textMuted} />
          <Text style={[styles.metaText, isDarkMode && { color: Colors.dark.textMuted }]}>{timeAgo()}</Text>
        </View>
        {complaint.priority === 'high' && (
          <View style={[styles.priorityLabel, isDarkMode && { backgroundColor: 'rgba(249,115,22,0.1)' }]}>
            <Feather name="alert-circle" size={10} color="#F97316" />
            <Text style={styles.priorityText}>Urgent</Text>
          </View>
        )}
      </View>
      <ConfirmModal
        visible={isDeleteModalVisible}
        title={isSup ? "Reject Complaint" : "Delete Complaint"}
        message={isSup 
          ? "Are you sure you want to reject this complaint? It will be removed from your list."
          : "Are you sure you want to permanently delete this complaint? This cannot be undone."}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        confirmText={isSup ? "Reject" : "Delete"}
        type="danger"
      />
    </SoftCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: { flex: 1, gap: 2 },
  category: { fontSize: 18, fontFamily: "Inter_900Black", color: '#111827' },
  site: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: '#6B7280' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontFamily: "Inter_800ExtraBold", textTransform: 'uppercase', letterSpacing: 0.5 },
  deleteBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },
  description: { fontSize: 15, fontFamily: "Inter_500Medium", color: '#374151', lineHeight: 22 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: '#F0F4F4', paddingTop: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: '#9CA3AF' },
  priorityLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priorityText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#F97316' },

  // Zomato-style live status banner
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
  },
  liveBannerDark: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: 'rgba(37, 99, 235, 0.12)',
  },
  liveDotWrapper: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDotPulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(37,99,235,0.3)',
  },
  liveDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
  liveBannerTitle: {
    fontSize: 13,
    fontFamily: 'Inter_800ExtraBold',
    color: '#1D4ED8',
  },
  liveBannerSub: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#3B82F6',
    marginTop: 1,
  },
});
