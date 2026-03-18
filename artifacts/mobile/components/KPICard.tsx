import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors } from "@/constants/colors";

interface KPICardProps {
  label: string;
  value: number | string;
  color?: string;
  subLabel?: string;
}

export function KPICard({ label, value, color = Colors.primary, subLabel }: KPICardProps) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...(Platform.OS === "ios" ? { boxShadow: "0px 1px 4px rgba(0,0,0,0.06)" } : {}),
    ...(Platform.OS === "android" ? { elevation: 2 } : {}),
  },
  value: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  subLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
});
