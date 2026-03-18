import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

function MenuItem({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? Colors.pendingBg : Colors.primaryMuted }]}>
        <Feather name={icon} size={16} color={danger ? Colors.pending : Colors.accent} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: Colors.pending }]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {!danger && <Feather name="chevron-right" size={15} color={Colors.textMuted} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { currentUser, logout, getCompanyById } = useApp();
  const insets = useSafeAreaInsets();
  const company = getCompanyById(currentUser?.companyId ?? "");

  const roleLabels = { founder: "Founder", client: "Client", supervisor: "Supervisor" };
  const roleColors = { founder: Colors.primary, client: Colors.success, supervisor: Colors.warning };
  const role = currentUser?.role ?? "client";
  const roleLabel = roleLabels[role];
  const roleColor = roleColors[role];

  const initials = currentUser?.name?.split(" ").map((n) => n[0]).join("") ?? "?";

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive", onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16, paddingBottom: 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profile</Text>

      <View style={styles.heroCard}>
        <View style={[styles.avatar, { backgroundColor: roleColor + "30" }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>{initials}</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{currentUser?.name}</Text>
          <View style={[styles.rolePill, { backgroundColor: roleColor + "22" }]}>
            <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>
        <View style={[styles.idBadge]}>
          <Text style={styles.idText}>ID {currentUser?.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT DETAILS</Text>
        <View style={styles.card}>
          <MenuItem icon="phone" label="Employee ID" value={currentUser?.phone} />
          <View style={styles.divider} />
          <MenuItem icon="briefcase" label="Company" value={company?.name} />
          <View style={styles.divider} />
          <MenuItem icon="shield" label="Access Role" value={roleLabel} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APP</Text>
        <View style={styles.card}>
          <MenuItem icon="info" label="Version" value="2.0.0" />
          <View style={styles.divider} />
          <MenuItem icon="help-circle" label="Help & Support" onPress={() => {}} />
          <View style={styles.divider} />
          <MenuItem icon="file-text" label="Privacy Policy" onPress={() => {}} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          <MenuItem icon="log-out" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>

      <Text style={styles.footer}>GMS Complaints Box · v2.0 · Multi-Tenant Edition</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, gap: 20 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.text },
  heroCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20, borderWidth: 1,
    borderColor: Colors.surfaceBorder, flexDirection: "row", alignItems: "center", gap: 14,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroInfo: { flex: 1, gap: 6 },
  heroName: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text },
  rolePill: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 100 },
  roleDot: { width: 5, height: 5, borderRadius: 3 },
  roleText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  idBadge: { backgroundColor: Colors.surfaceElevated, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  idText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textMuted },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.textMuted, letterSpacing: 1.2, paddingHorizontal: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.surfaceBorder, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowPressed: { backgroundColor: Colors.surfaceElevated },
  rowIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  rowValue: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, maxWidth: 130, textAlign: "right" },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginHorizontal: 16 },
  footer: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center" },
});
