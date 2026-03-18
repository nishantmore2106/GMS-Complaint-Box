import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { Complaint } from "@/context/AppContext";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

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

export function ComplaintCard({ complaint }: Props) {
  const icon = CATEGORY_ICONS[complaint.category] ?? "file-text";

  const timeAgo = () => {
    const diff = Date.now() - new Date(complaint.createdAt).getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return "Just now";
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/complaint/${complaint.id}`);
      }}
    >
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Feather name={icon} size={15} color={Colors.accent} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.category}>{complaint.category}</Text>
          <Text style={styles.site} numberOfLines={1}>{complaint.siteName}</Text>
        </View>
        <StatusBadge status={complaint.status} size="sm" />
      </View>
      <Text style={styles.description} numberOfLines={2}>{complaint.description}</Text>
      <View style={styles.footer}>
        <PriorityBadge priority={complaint.priority} />
        <View style={styles.footerRight}>
          {complaint.supervisorName && (
            <View style={styles.supervisor}>
              <Feather name="user" size={11} color={Colors.textMuted} />
              <Text style={styles.supervisorText}>{complaint.supervisorName}</Text>
            </View>
          )}
          <Text style={styles.time}>{timeAgo()}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  meta: { flex: 1 },
  category: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  site: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 1 },
  description: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSub, lineHeight: 19 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  supervisor: { flexDirection: "row", alignItems: "center", gap: 4 },
  supervisorText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  time: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});
