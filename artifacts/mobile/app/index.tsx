import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef, useEffect } from "react";
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
  ActivityIndicator,
  TextInput
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftCard } from "@/components/SoftCard";
import { SoftButton } from "@/components/SoftButton";
import { SoftInput } from "@/components/SoftInput";
import { supabase } from "@/lib/supabase";
import { NotificationManager } from "@/services/notification.manager";

const { width } = Dimensions.get('window');

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RootEntry() {
  const { isDarkMode, isAuthLoading } = useApp();
  const insets = useSafeAreaInsets();
  
  // Mobile Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useApp();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // Web Portal State
  const [detectedSite, setDetectedSite] = useState<any>(null);
  const [locating, setLocating] = useState(Platform.OS === 'web');
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Form State (shared with [id].tsx logic)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState<"Cleaning" | "Misbehave">("Cleaning");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      autoDetectSite();
    }
  }, []);

  const autoDetectSite = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError("Permission to access location was denied. Please scan a QR code.");
        setLocating(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      // Fetch all sites with coordinates
      const { data: sites, error: siteErr } = await supabase
        .from('sites')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (siteErr) throw siteErr;

      let closest = null;
      let minDistance = Infinity;

      for (const s of (sites || [])) {
        const dist = getDistance(latitude, longitude, s.latitude, s.longitude);
        const radius = s.radius_meters || 500;
        if (dist <= radius && dist < minDistance) {
          minDistance = dist;
          closest = s;
        }
      }

      if (closest) {
        setDetectedSite(closest);
      } else {
        setLocationError("No nearby GMS facility detected. Please scan the QR code in the room.");
      }
    } catch (err: any) {
      console.error("AutoDetect error:", err);
      setLocationError("Could not determine your location. Please ensure GPS is on.");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !description) {
      Alert.alert("Missing Fields", "Please enter your name and issue details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('complaints').insert([{
        site_id: detectedSite.id,
        company_id: detectedSite.company_id,
        category: category,
        subcategory: category === 'Cleaning' ? 'Public Area Cleaning' : 'Improper Behavior',
        description: `${description}\nFloor: ${floor}, Room: ${room}`,
        is_anonymous: true,
        anonymous_name: name,
        floor: floor,
        room_number: room,
        status: 'pending',
        priority: 'medium'
      }]);

      if (error) throw error;
      
      try {
        await NotificationManager.notifyNewComplaint({
          id: detectedSite.id + '_web_' + Date.now(),
          company_id: detectedSite.company_id,
          site_id: detectedSite.id,
          priority: 'medium',
          is_anonymous: true,
          category: category
        }, detectedSite.name);
      } catch (e) {}

      setSubmitted(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMobileLogin = async () => {
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

  if (Platform.OS === 'web') {
    const activeGradient = isDarkMode ? Colors.dark.heroGradient : ['#FFFFFF', '#F0F9FF', '#FDF2F8'];
    const activeBg = isDarkMode ? Colors.dark.bg : '#F8FAFA';

    return (
      <View style={[styles.root, { backgroundColor: activeBg }]}>
        <LinearGradient colors={activeGradient as any} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 50, paddingBottom: 60 }]}>
          
          {/* Web Header */}
          <View style={styles.webHeader}>
            <View style={styles.logoCircleSmall}>
               <Feather name="inbox" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.webTitle}>GMS Public Portal</Text>
          </View>

          {locating ? (
            <View style={styles.centerSection}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.statusText}>Detecting Facility...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.centerSection}>
               <View style={styles.errorIconCircle}>
                 <Feather name="map-pin" size={32} color="#EF4444" />
               </View>
               <Text style={styles.errorTitle}>Verification Required</Text>
               <Text style={styles.errorSub}>{locationError}</Text>
               <SoftButton title="Try Again" onPress={autoDetectSite} variant="outline" style={{ marginTop: 24, width: 200 }} />
            </View>
          ) : submitted ? (
            <View style={styles.centerSection}>
              <View style={styles.successIconLarge}>
                 <Feather name="check" size={40} color="white" />
              </View>
              <Text style={styles.successTitle}>Alert Sent!</Text>
              <Text style={styles.successSub}>
                Sent to supervisor at {detectedSite.name}. They will arrive shortly.
              </Text>
              <SoftButton title="Raise Another" onPress={() => setSubmitted(false)} variant="outline" style={{ marginTop: 24, width: 200 }} />
            </View>
          ) : detectedSite ? (
            <View style={styles.formSection}>
               <View style={styles.siteBanner}>
                  <Text style={styles.atText}>Current Location:</Text>
                  <Text style={styles.siteName}>{detectedSite.name}</Text>
               </View>

               <SoftCard style={styles.webCard}>
                 <Text style={styles.sectionLabel}>YOUR DETAILS</Text>
                 <SoftInput placeholder="Your Name" value={name} onChangeText={setName} />

                 <Text style={styles.sectionLabel}>LOCATION DETAILS</Text>
                 <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                       <SoftInput placeholder="Floor" value={floor} onChangeText={setFloor} keyboardType="numeric" />
                    </View>
                    <View style={{ flex: 1 }}>
                       <SoftInput placeholder="Room / Area" value={room} onChangeText={setRoom} />
                    </View>
                 </View>

                 <Text style={styles.sectionLabel}>ISSUE CATEGORY</Text>
                 <View style={styles.catGrid}>
                    <Pressable 
                      style={[styles.catItem, category === 'Cleaning' && styles.catActive]}
                      onPress={() => setCategory('Cleaning')}
                    >
                      <Feather name="wind" size={18} color={category === 'Cleaning' ? 'white' : '#6B7280'} />
                      <Text style={[styles.catText, category === 'Cleaning' && { color: 'white' }]}>Cleaning</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.catItem, category === 'Misbehave' && styles.catActive]}
                      onPress={() => setCategory('Misbehave')}
                    >
                      <Feather name="user-x" size={18} color={category === 'Misbehave' ? 'white' : '#6B7280'} />
                      <Text style={[styles.catText, category === 'Misbehave' && { color: 'white' }]}>Behavior</Text>
                    </Pressable>
                 </View>

                 <Text style={styles.sectionLabel}>DETAILS</Text>
                 <SoftInput 
                   placeholder="Describe what needs attention..." 
                   value={description} 
                   onChangeText={setDescription}
                   multiline
                   style={{ height: 100 }}
                 />

                 <SoftButton 
                   title={isSubmitting ? "Dispatching..." : "Contact Site Supervisor"} 
                   onPress={handleSubmit} 
                   loading={isSubmitting}
                   style={{ marginTop: 12 }}
                 />
               </SoftCard>
            </View>
          ) : null}

          <View style={styles.webFooter}>
            <Text style={styles.footerText}>© 2026 GMS Facility Management Service</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mobile Version
  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: isDarkMode ? Colors.dark.bg : '#F8FAFA' }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <LinearGradient colors={(isDarkMode ? Colors.dark.heroGradient : ['#FFFFFF', '#F0F9FF', '#FDF2F8']) as any} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: 40 }]}>
        <View style={styles.hero}>
          <View style={[styles.logoContainer, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
            <Feather name="inbox" size={32} color={isDarkMode ? Colors.dark.accent : Colors.primary} />
          </View>
          <Text style={[styles.appName, isDarkMode && { color: Colors.dark.text }]}>Staff Terminal</Text>
        </View>

        <SoftCard style={[styles.formCard, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
          <Text style={[styles.formTitle, isDarkMode && { color: Colors.dark.text }]}>Dashboard</Text>
          <SoftInput ref={emailRef} icon="mail" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <SoftInput ref={passwordRef} icon="lock" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <SoftButton title={loading ? "Logging in..." : "Member Login"} onPress={handleMobileLogin} loading={loading} />
        </SoftCard>

        <View style={styles.footer}>
           <Text style={[styles.footerText, isDarkMode && { color: Colors.dark.textMuted }]}>Mobile Access Preferred</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  hero: { alignItems: "center", gap: 16, marginBottom: 32 },
  logoContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'white', justifyContent: "center", alignItems: "center", elevation: 4 },
  appName: { fontSize: 24, fontFamily: "Inter_900Black", color: '#111827' },
  formCard: { gap: 20, padding: 32, borderRadius: 32, backgroundColor: 'white' },
  formTitle: { fontSize: 20, fontFamily: "Inter_800ExtraBold", color: '#111827', marginBottom: 8 },
  errorText: { color: '#EF4444', fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#9CA3AF' },
  
  // Web Specific Styles
  webHeader: { alignItems: 'center', marginBottom: 32, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  logoCircleSmall: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  webTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  centerSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  statusText: { marginTop: 16, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#6B7280' },
  errorIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#111827', marginBottom: 8 },
  errorSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  successIconLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827', marginBottom: 12 },
  successSub: { fontSize: 15, fontFamily: 'Inter_500Medium', color: '#6B7280', textAlign: 'center', lineHeight: 24, maxWidth: 300 },
  formSection: { gap: 20, width: '100%', maxWidth: 500, alignSelf: 'center' },
  siteBanner: { backgroundColor: 'white', padding: 20, borderRadius: 24, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#3B82F6', elevation: 2 },
  atText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#3B82F6', textTransform: 'uppercase', marginBottom: 4 },
  siteName: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#111827' },
  webCard: { gap: 16, padding: 24, borderRadius: 32, backgroundColor: 'white' },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 1.5, marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  catGrid: { flexDirection: 'row', gap: 12 },
  catItem: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'white' },
  catActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  catText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#4B5563' },
  webFooter: { marginTop: 60, alignItems: 'center' }
});
