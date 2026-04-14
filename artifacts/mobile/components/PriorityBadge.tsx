import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";

const P = {
  low: { label: "Low", color: Colors.resolved, bg: Colors.resolved + '10' },
  medium: { label: "Med", color: Colors.primary, bg: Colors.primary + '10' },
  high: { label: "High", color: Colors.pending, bg: Colors.pending + '10' },
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
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  label: { fontSize: 9, fontFamily: "Inter_900Black", textTransform: "uppercase", letterSpacing: 0.5 },
});
