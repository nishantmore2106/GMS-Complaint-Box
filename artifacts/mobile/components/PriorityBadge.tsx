import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high";
}

const PRIORITY_CONFIG = {
  low: { label: "Low", color: Colors.success, bg: "#DCFCE7" },
  medium: { label: "Medium", color: Colors.warning, bg: "#FEF3C7" },
  high: { label: "High", color: Colors.danger, bg: "#FEE2E2" },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
