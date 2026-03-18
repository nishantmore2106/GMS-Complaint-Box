import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";

const P = {
  low: { label: "Low", color: Colors.resolved, bg: Colors.resolvedBg },
  medium: { label: "Med", color: Colors.inProgress, bg: Colors.inProgressBg },
  high: { label: "High", color: Colors.pending, bg: Colors.pendingBg },
};

export function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
  const c = P[priority];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  label: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.4 },
});
