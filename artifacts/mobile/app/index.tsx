import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function LoginScreen() {
  const { users, setCurrentUser } = useApp();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!phone.trim()) {
      setError("Enter your employee ID or phone number");
      return;
    }
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 900));
    const user = users.find((u) => u.phone === phone.trim());
    if (!user) {
      setError("Account not found. Contact your administrator.");
      setLoading(false);
      return;
    }
    await setCurrentUser(user);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
    router.replace("/(tabs)");
  };

  const DEMO_ACCOUNTS = [
    { label: "Founder · TechCorp", phone: "1001", role: "founder" as const },
    { label: "Client · TechCorp", phone: "1002", role: "client" as const },
    { label: "Supervisor · TechCorp", phone: "1003", role: "supervisor" as const },
    { label: "Founder · BuildMaster", phone: "2001", role: "founder" as const },
  ];

  const roleColors = {
    founder: Colors.primary,
    client: Colors.success,
    supervisor: Colors.warning,
  };

  const quickLogin = async (p: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const user = users.find((u) => u.phone === p);
    if (user) {
      await setCurrentUser(user);
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#040910", "#080F1C", "#0D1929"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 48,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Feather name="inbox" size={30} color={Colors.accent} />
            </View>
          </View>
          <Text style={styles.appName}>GMS Complaints Box</Text>
          <Text style={styles.tagline}>Manpower Complaint & Resolution System</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>
          <Text style={styles.formSub}>Enter your registered employee ID</Text>

          <View
            style={[
              styles.inputRow,
              focused && styles.inputRowFocused,
              error ? styles.inputRowError : null,
            ]}
          >
            <Feather
              name="user"
              size={17}
              color={focused ? Colors.accent : Colors.textMuted}
            />
            <TextInput
              style={styles.input}
              placeholder="Employee ID / Phone"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={(t) => { setPhone(t); setError(""); }}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              selectionColor={Colors.accent}
            />
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color={Colors.pending} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.loginBtn,
              pressed && { opacity: 0.8 },
              loading && { opacity: 0.6 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={["#2563EB", "#1D4ED8"]}
              style={styles.loginBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={styles.loginBtnText}>Signing in…</Text>
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Feather name="arrow-right" size={18} color={Colors.white} />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.demoSection}>
          <View style={styles.demoHeader}>
            <View style={styles.dividerLine} />
            <Text style={styles.demoLabel}>DEMO ACCOUNTS</Text>
            <View style={styles.dividerLine} />
          </View>
          {DEMO_ACCOUNTS.map((acc) => (
            <Pressable
              key={acc.phone}
              style={({ pressed }) => [
                styles.demoRow,
                pressed && styles.demoRowPressed,
              ]}
              onPress={() => quickLogin(acc.phone)}
            >
              <View
                style={[
                  styles.demoAvatar,
                  { backgroundColor: roleColors[acc.role] + "22" },
                ]}
              >
                <Feather
                  name={
                    acc.role === "founder"
                      ? "briefcase"
                      : acc.role === "client"
                      ? "user"
                      : "tool"
                  }
                  size={14}
                  color={roleColors[acc.role]}
                />
              </View>
              <View style={styles.demoInfo}>
                <Text style={styles.demoName}>{acc.label}</Text>
                <Text style={styles.demoId}>ID: {acc.phone}</Text>
              </View>
              <View
                style={[
                  styles.roleTag,
                  { backgroundColor: roleColors[acc.role] + "22" },
                ]}
              >
                <Text style={[styles.roleTagText, { color: roleColors[acc.role] }]}>
                  {acc.role.toUpperCase()}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, gap: 24 },
  hero: { alignItems: "center", gap: 12, paddingTop: 8 },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.primary + "50",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primaryMuted,
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  formSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSub,
    marginTop: -6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    height: 52,
  },
  inputRowFocused: { borderColor: Colors.primary },
  inputRowError: { borderColor: Colors.pending },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.pending,
  },
  loginBtn: { borderRadius: 14, overflow: "hidden" },
  loginBtnGrad: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  demoSection: { gap: 8 },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  demoLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 1.2,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  demoRowPressed: { backgroundColor: Colors.surfaceElevated },
  demoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  demoInfo: { flex: 1 },
  demoName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  demoId: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    marginTop: 1,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
});
