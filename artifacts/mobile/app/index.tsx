import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftCard } from "@/components/SoftCard";
import { SoftButton } from "@/components/SoftButton";
import { SoftInput } from "@/components/SoftInput";
import { TextInput } from "react-native";

const { width } = Dimensions.get('window');

export default function RootEntry() {
  const { isDarkMode, isAuthLoading } = useApp();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useApp();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  if (Platform.OS === 'web') {
    const activeGradient = isDarkMode ? Colors.dark.heroGradient : ['#FFFFFF', '#F0F9FF', '#FDF2F8'];
    const activeBg = isDarkMode ? Colors.dark.bg : '#F8FAFA';

    return (
      <View style={[styles.root, { backgroundColor: activeBg }]}>
        <LinearGradient colors={activeGradient as any} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 80, alignItems: 'center' }]}>
          <View style={styles.hero}>
            <View style={[styles.logoContainer, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
              <View style={[styles.logoCircle, isDarkMode && { backgroundColor: '#3B82F620' }]}>
                <Feather name="inbox" size={32} color={isDarkMode ? Colors.dark.accent : Colors.primary} />
              </View>
            </View>
            <View style={styles.brandGroup}>
              <Text style={[styles.appName, isDarkMode && { color: Colors.dark.text }]}>GMS Public Portal</Text>
              <View style={[styles.pill, isDarkMode && { backgroundColor: '#10B98120' }]}>
                <Text style={[styles.tagline, { color: '#10B981' }]}>Official Reporting Desk</Text>
              </View>
            </View>
          </View>

          <SoftCard style={[styles.formCard, { maxWidth: 500, width: '100%', gap: 32 }, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
            <View style={{ gap: 12, alignItems: 'center' }}>
               <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                  <Feather name="maximize" size={28} color="#3B82F6" />
               </View>
               <Text style={[styles.formTitle, { textAlign: 'center' }, isDarkMode && { color: Colors.dark.text }]}>Scan QR to Begin</Text>
               <Text style={[styles.formSub, { textAlign: 'center' }, isDarkMode && { color: Colors.dark.textMuted }]}>
                 To report an issue, please scan the QR code located in the specific room or area of the building.
               </Text>
            </View>

            <View style={{ gap: 16, borderTopWidth: 1, borderTopColor: isDarkMode ? '#2D3748' : '#F3F4F6', paddingTop: 24 }}>
               <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />
                  <Text style={[styles.formSub, { fontSize: 14 }, isDarkMode && { color: Colors.dark.textSub }]}>Stay at your current location</Text>
               </View>
               <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />
                  <Text style={[styles.formSub, { fontSize: 14 }, isDarkMode && { color: Colors.dark.textSub }]}>Enable GPS location access when prompted</Text>
               </View>
               <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />
                  <Text style={[styles.formSub, { fontSize: 14 }, isDarkMode && { color: Colors.dark.textSub }]}>Reports are shared directly with site supervisors</Text>
               </View>
            </View>
          </SoftCard>

          <View style={[styles.footer, { opacity: 0.8 }]}>
            <Text style={[styles.footerText, isDarkMode && { color: Colors.dark.textMuted }]}>
              © 2026 GMS Facility Management Service
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const handleAction = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError("");

    try {
      await signIn(email.trim(), password.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message || "Action failed. Check your credentials.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const activeBg = isDarkMode ? Colors.dark.bg : '#F8FAFA';
  const activeGradient = isDarkMode ? Colors.dark.heroGradient : ['#FFFFFF', '#F0F9FF', '#FDF2F8'];

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: activeBg }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <LinearGradient colors={activeGradient as any} style={StyleSheet.absoluteFill} />
      
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.logoContainer, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
            <View style={[styles.logoCircle, isDarkMode && { backgroundColor: '#3B82F620' }]}>
              <Feather name="inbox" size={32} color={isDarkMode ? Colors.dark.accent : Colors.primary} />
            </View>
          </View>
          <View style={styles.brandGroup}>
            <Text style={[styles.appName, isDarkMode && { color: Colors.dark.text }]}>Staff Terminal</Text>
            <View style={[styles.pill, isDarkMode && { backgroundColor: '#3B82F620' }]}>
               <Text style={[styles.tagline, isDarkMode && { color: Colors.dark.accent }]}>Secure Login</Text>
            </View>
          </View>
        </View>

        <SoftCard style={[styles.formCard, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, isDarkMode && { color: Colors.dark.text }]}>
              Dashboard
            </Text>
            <Text style={[styles.formSub, isDarkMode && { color: Colors.dark.textMuted }]}>
              Enterprise credentials required
            </Text>
          </View>

          <View style={styles.inputs}>
            <SoftInput
              ref={emailRef}
              icon="mail"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              isDarkMode={isDarkMode}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <SoftInput
              ref={passwordRef}
              icon="lock"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              isDarkMode={isDarkMode}
              returnKeyType="done"
              onSubmitEditing={handleAction}
            />
          </View>

          {error ? (
            <View style={[styles.errorRow, isDarkMode && { backgroundColor: '#7F1D1D30', borderColor: '#7F1D1D' }]}>
              <Feather name="alert-circle" size={14} color="#F97316" />
              <Text style={[styles.errorText, isDarkMode && { color: '#FCA5A5' }]}>{error}</Text>
            </View>
          ) : null}

          <SoftButton
            title={loading ? "Authenticating..." : "Member Login"}
            onPress={handleAction}
            loading={loading}
            style={styles.actionBtn}
          />
        </SoftCard>

        <View style={styles.footer}>
           <Text style={[styles.footerText, isDarkMode && { color: Colors.dark.textMuted }]}>
             Mobile Access Preferred
           </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  hero: { alignItems: "center", gap: 24, marginBottom: 32 },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: "center",
    alignItems: "center",
    shadowColor: '#146A65',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#146A6510',
    justifyContent: "center",
    alignItems: "center",
  },
  brandGroup: { alignItems: 'center', gap: 8 },
  appName: { fontSize: 28, fontFamily: "Inter_900Black", color: '#111827', letterSpacing: -0.5 },
  pill: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  tagline: { fontSize: 13, fontFamily: "Inter_700Bold", color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  formCard: { 
    gap: 24, 
    padding: 32, 
    borderRadius: 40, 
    backgroundColor: 'white', 
    ...Platform.select({
      web: { boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' },
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 20 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 40, 
        elevation: 5 
      }
    })
  },
  formHeader: { gap: 8, marginBottom: 8 },
  formTitle: { fontSize: 28, fontFamily: "Inter_900Black", color: '#111827', letterSpacing: -0.5 },
  formSub: { fontSize: 15, fontFamily: "Inter_500Medium", color: '#6B7280', lineHeight: 22 },
  inputs: { gap: 20 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: '#FFF3E0', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FFEDD5' },
  errorText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: '#F97316' },
  actionBtn: { marginTop: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  toggleText: { fontSize: 14, fontFamily: "Inter_500Medium", color: '#6B7280' },
  toggleLink: { color: '#10B981', fontFamily: "Inter_800ExtraBold" },
  forgotPassBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotPassText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#6B7280' },
  footer: { marginTop: 40, alignItems: 'center', opacity: 0.5 },
  footerText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#6B7280' },
});
