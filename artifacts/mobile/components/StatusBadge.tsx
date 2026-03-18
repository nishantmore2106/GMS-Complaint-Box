import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { ComplaintStatus } from "@/context/AppContext";

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: Colors.warning, bg: "#FEF3C7" },
  in_progress: { label: "In Progress", color: Colors.accent, bg: "#DBEAFE" },
  resolved: { label: "Resolved", color: Colors.success, bg: "#DCFCE7" },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: config.color },
          isSmall && styles.dotSm,
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: config.color },
          isSmall && styles.labelSm,
        ]}
      >
        {config.label}
      </Text>
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
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSm: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  labelSm: {
    fontSize: 10,
  },
});
