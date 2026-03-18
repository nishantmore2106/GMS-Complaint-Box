import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface Props {
  label: string;
  value: number | string;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
  bg: string;
  sub?: string;
}

export function KPICard({ label, value, icon, color, bg, sub }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  value: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSub },
  sub: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});
