import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/colors";
import { Complaint } from "@/context/AppContext";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusBadge } from "@/components/StatusBadge";

interface ComplaintCardProps {
  complaint: Complaint;
  showCompany?: boolean;
}

export function ComplaintCard({
  complaint,
  showCompany = false,
}: ComplaintCardProps) {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() =>
        router.push({
          pathname: "/complaint/[id]",
          params: { id: complaint.id },
        })
      }
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.category}>{complaint.category}</Text>
          <PriorityBadge priority={complaint.priority} />
        </View>
        <StatusBadge status={complaint.status} size="sm" />
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {complaint.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Feather name="map-pin" size={12} color={Colors.textMuted} />
          <Text style={styles.footerText}>{complaint.siteName}</Text>
        </View>
        {complaint.supervisorName && (
          <View style={styles.footerInfo}>
            <Feather name="user" size={12} color={Colors.textMuted} />
            <Text style={styles.footerText}>{complaint.supervisorName}</Text>
          </View>
        )}
        <Text style={styles.timeAgo}>{timeAgo(complaint.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Platform.OS === "ios" ? { boxShadow: "0px 1px 4px rgba(0,0,0,0.06)" } : {}),
    ...(Platform.OS === "android" ? { elevation: 2 } : {}),
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  category: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  timeAgo: {
    marginLeft: "auto",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});
