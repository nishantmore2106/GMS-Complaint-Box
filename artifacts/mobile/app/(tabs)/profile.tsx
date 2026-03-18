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

interface MenuItemProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function MenuItem({ icon, label, value, onPress, danger }: MenuItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.menuIconWrap,
          { backgroundColor: danger ? Colors.danger + "15" : Colors.accent + "15" },
        ]}
      >
        <Feather
          name={icon}
          size={18}
          color={danger ? Colors.danger : Colors.accent}
        />
      </View>
      <Text style={[styles.menuLabel, danger && { color: Colors.danger }]}>
        {label}
      </Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {!danger && <Feather name="chevron-right" size={16} color={Colors.textMuted} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { currentUser, logout, getCompanyById } = useApp();
  const insets = useSafeAreaInsets();

  const company = getCompanyById(currentUser?.companyId ?? "");

  const roleLabel =
    currentUser?.role === "founder"
      ? "Founder"
      : currentUser?.role === "client"
      ? "Client"
      : "Supervisor";

  const roleColor =
    currentUser?.role === "founder"
      ? Colors.accent
      : currentUser?.role === "client"
      ? Colors.success
      : Colors.warning;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop:
            Platform.OS === "web" ? insets.top + 67 : insets.top + 16,
          paddingBottom: Platform.OS === "web" ? 120 : 120,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {currentUser?.name?.charAt(0) ?? "?"}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{currentUser?.name}</Text>
          <View style={[styles.rolePill, { backgroundColor: roleColor + "20" }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="phone"
            label="Phone"
            value={currentUser?.phone}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="briefcase"
            label="Company"
            value={company?.name}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="shield"
            label="Role"
            value={roleLabel}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.menuCard}>
          <MenuItem
            icon="info"
            label="App Version"
            value="1.0.0"
          />
          <View style={styles.divider} />
          <MenuItem
            icon="help-circle"
            label="Help & Support"
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.menuCard}>
          <MenuItem
            icon="log-out"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <Text style={styles.footerText}>
        GMS Complaints Box · Multi-Tenant Edition
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  container: {
    paddingHorizontal: 16,
    gap: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  rolePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  roleText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: Colors.surfaceSecondary,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  menuValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    maxWidth: 140,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
});
