import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { ComplaintStatus } from "@/context/AppContext";

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: "sm" | "md";
}

const STATUS = {
  pending: { label: "Pending", color: Colors.pending, bg: Colors.pendingBg },
  in_progress: { label: "In Progress", color: Colors.inProgress, bg: Colors.inProgressBg },
  resolved: { label: "Resolved", color: Colors.resolved, bg: Colors.resolvedBg },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const s = STATUS[status];
  const sm = size === "sm";
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }, sm && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: s.color }, sm && styles.dotSm]} />
      <Text style={[styles.label, { color: s.color }, sm && styles.labelSm]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    gap: 5,
  },
  sm: { paddingHorizontal: 7, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotSm: { width: 5, height: 5, borderRadius: 2.5 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  labelSm: { fontSize: 10 },
});
