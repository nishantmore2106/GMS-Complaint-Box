import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    setLoading(true);
    setError("");

    await new Promise((r) => setTimeout(r, 800));

    const user = users.find((u) => u.phone === phone.trim());
    if (!user) {
      setError("No account found. Contact your administrator.");
      setLoading(false);
      return;
    }

    await setCurrentUser(user);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(false);
    router.replace("/(tabs)");
  };

  const DEMO_ACCOUNTS = [
    { label: "Founder (TechCorp)", phone: "1001", role: "founder" },
    { label: "Client (TechCorp)", phone: "1002", role: "client" },
    { label: "Supervisor (TechCorp)", phone: "1003", role: "supervisor" },
    { label: "Founder (BuildMaster)", phone: "2001", role: "founder" },
  ];

  const quickLogin = async (p: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhone(p);
    const user = users.find((u) => u.phone === p);
    if (user) {
      await setCurrentUser(user);
      router.replace("/(tabs)");
    }
  };

  return (
    <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            {
              paddingTop:
                Platform.OS === "web" ? insets.top + 67 : insets.top + 32,
              paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Feather name="inbox" size={36} color={Colors.white} />
            </View>
            <Text style={styles.appName}>GMS Complaints Box</Text>
            <Text style={styles.tagline}>
              Manpower Complaint & Resolution System
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign In</Text>
            <Text style={styles.cardSubtitle}>
              Enter your registered phone number
            </Text>

            <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
              <Feather name="phone" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  setError("");
                }}
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={14} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && styles.loginBtnPressed,
                loading && styles.loginBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.loginBtnText}>Signing in...</Text>
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Feather name="arrow-right" size={18} color={Colors.white} />
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Demo Accounts</Text>
            <View style={styles.demoGrid}>
              {DEMO_ACCOUNTS.map((acc) => (
                <Pressable
                  key={acc.phone}
                  style={({ pressed }) => [
                    styles.demoChip,
                    pressed && styles.demoChipPressed,
                  ]}
                  onPress={() => quickLogin(acc.phone)}
                >
                  <View
                    style={[
                      styles.roleTag,
                      acc.role === "founder"
                        ? styles.roleFounder
                        : acc.role === "client"
                        ? styles.roleClient
                        : styles.roleSupervisor,
                    ]}
                  >
                    <Text style={styles.roleTagText}>
                      {acc.role.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.demoLabel}>{acc.label}</Text>
                  <Text style={styles.demoPhone}>{acc.phone}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    textAlign: "center",
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 14,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: -6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.danger,
  },
  loginBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  loginBtnPressed: { opacity: 0.85 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  demoSection: {
    gap: 12,
  },
  demoTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  demoGrid: {
    gap: 8,
  },
  demoChip: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  demoChipPressed: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  roleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  roleFounder: { backgroundColor: "#4D8AFF" },
  roleClient: { backgroundColor: "#22C55E" },
  roleSupervisor: { backgroundColor: "#F59E0B" },
  roleTagText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  demoLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.white,
  },
  demoPhone: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
});
