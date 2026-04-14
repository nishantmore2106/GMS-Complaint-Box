import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useRef } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/Toast";

export default function NewCompanyScreen() {
  const { createCompany, currentUser, notifications, profileImage } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const unreadNotifs = notifications.filter(n => !n.isRead).length;
  const [loading, setLoading] = useState(false);

  // Company Details
  const [compName, setCompName] = useState("");
  
  // Admin User Details
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  // Refs for keyboard transitions
  const adminNameRef = useRef<TextInput>(null);
  const adminEmailRef = useRef<TextInput>(null);
  const adminPassRef = useRef<TextInput>(null);
  const adminPhoneRef = useRef<TextInput>(null);

  const handleCreate = async () => {
    if (!compName || !adminName || !adminEmail || !adminPass || !adminPhone) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      await createCompany(compName, {
        name: adminName,
        email: adminEmail,
        pass: adminPass,
        phone: adminPhone
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Company registered successfully!");
      router.replace("/(tabs)");
    } catch (e: any) {
      showToast(e.message || "Failed to create company", "error");
    } finally {
      setLoading(false);
    }

    // Safety dismissal
    setTimeout(() => {
      setLoading(false);
    }, 25000);
  };

  if (currentUser?.role !== 'founder') {
    return <View style={styles.centered}><Text>Access Denied</Text></View>;
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? insets.top + 40 : insets.top + 20 }]}>
        <View style={styles.headerLeft}>
          <Pressable 
            style={styles.backBtn} 
            onPress={() => router.canGoBack() ? router.back() : router.replace("/admin")}
          >
            <Feather name="arrow-left" size={22} color={Colors.primary} />
          </Pressable>
          <Text style={styles.title}>Register Company</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable style={styles.bellBtn} onPress={() => router.push("/notifications")}>
            <Feather name="bell" size={20} color={Colors.text} />
            {unreadNotifs > 0 && <View style={styles.notifBadge} />}
          </Pressable>

          <Pressable onPress={() => router.push("/(tabs)/profile")}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{currentUser?.name?.[0] || "U"}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Legal Name *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. GMS Solutions Ltd" 
                  value={compName}
                  onChangeText={setCompName}
                  returnKeyType="next"
                  onSubmitEditing={() => adminNameRef.current?.focus()}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Credentials</Text>
            <Text style={styles.sectionSub}>Set up the primary administrator for this company</Text>
            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput 
                  ref={adminNameRef}
                  style={styles.input} 
                  placeholder="John Doe" 
                  value={adminName} 
                  onChangeText={setAdminName} 
                  returnKeyType="next"
                  onSubmitEditing={() => adminEmailRef.current?.focus()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Work Email *</Text>
                <TextInput 
                  ref={adminEmailRef}
                  style={styles.input} 
                  placeholder="admin@gmail.com" 
                  autoCapitalize="none" 
                  value={adminEmail} 
                  onChangeText={setAdminEmail} 
                  returnKeyType="next"
                  onSubmitEditing={() => adminPassRef.current?.focus()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <TextInput 
                  ref={adminPassRef}
                  style={styles.input} 
                  placeholder="••••••••" 
                  secureTextEntry 
                  value={adminPass} 
                  onChangeText={setAdminPass} 
                  returnKeyType="next"
                  onSubmitEditing={() => adminPhoneRef.current?.focus()}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput 
                  ref={adminPhoneRef}
                  style={styles.input} 
                  placeholder="+91 00000 00000" 
                  keyboardType="phone-pad" 
                  value={adminPhone} 
                  onChangeText={setAdminPhone} 
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>
          </View>

          <Pressable 
            style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>{loading ? "Processing..." : "Complete Registration"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFA' },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { 
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', 
    justifyContent: "center", alignItems: "center",
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  title: { fontSize: 20, fontFamily: "Inter_900Black", color: '#111827' },
  bellBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white' },
  avatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'white' },
  avatarFallback: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#146A65', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
  scroll: { padding: 32, gap: 32, paddingBottom: 120 },
  section: { gap: 16 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_800ExtraBold", color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, marginLeft: 8 },
  sectionSub: { fontSize: 14, fontFamily: "Inter_500Medium", color: '#6B7280', marginTop: -8, marginLeft: 8, lineHeight: 20 },
  card: { backgroundColor: 'white', borderRadius: 40, padding: 32, gap: 24, shadowColor: '#146A65', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 6 },
  inputGroup: { gap: 10 },
  label: { fontSize: 14, fontFamily: "Inter_700Bold", color: '#4B5563', marginLeft: 4 },
  input: { height: 56, backgroundColor: '#F8FAFA', borderRadius: 16, borderWidth: 1, borderColor: '#F0F4F4', paddingHorizontal: 20, fontSize: 15, fontFamily: 'Inter_500Medium', color: '#111827' },
  submitBtn: { height: 64, backgroundColor: '#146A65', borderRadius: 32, justifyContent: "center", alignItems: "center", marginTop: 14, shadowColor: '#146A65', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8 },
  submitBtnText: { color: "white", fontSize: 18, fontFamily: "Inter_900Black" },
});
