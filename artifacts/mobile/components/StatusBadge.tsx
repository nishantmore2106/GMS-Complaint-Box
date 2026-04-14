import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { ComplaintStatus } from "@/context/AppContext";

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: "sm" | "md";
}

const STATUS = {
  pending: { label: "Pending", color: Colors.pending, bg: Colors.pending + '10' },
  in_progress: { label: "Active", color: Colors.primary, bg: Colors.primary + '10' },
  resolved: { label: "Resolved", color: Colors.resolved, bg: Colors.resolved + '10' },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const s = STATUS[status];
  const sm = size === "sm";
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }, sm && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: s.color }]} />
      <Text style={[styles.label, { color: s.color }, sm && styles.labelSm]}>{s.label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  sm: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  label: { fontSize: 10, fontFamily: "Inter_800ExtraBold", letterSpacing: 0.5 },
  labelSm: { fontSize: 8 },
});
