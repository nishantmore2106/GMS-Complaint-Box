import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, SlideInRight, SlideOutLeft, Layout } from "react-native-reanimated";
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
  const { test } = useLocalSearchParams<{ test?: string }>();
  
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
  
  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 3;

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

  const autoDetectSite = async (isTestMode = false) => {
    setLocating(true);
    setLocationError(null);
    try {
      let latitude = 0;
      let longitude = 0;

      if (!isTestMode && test !== 'true') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError("Permission to access location was denied. Please scan a QR code.");
          setLocating(false);
          return;
        }
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }

      // Fetch all sites
      const { data: sites, error: siteErr } = isTestMode || test === 'true'
        ? await supabase.from('sites').select('*')
        : await supabase.from('sites').select('*').not('latitude', 'is', null).not('longitude', 'is', null);

      if (siteErr) throw siteErr;

      let closest = null;
      let minDistance = Infinity;

      if (isTestMode || test === 'true') {
        closest = sites?.[0] || null;
      } else {
        for (const s of (sites || [])) {
          const dist = getDistance(latitude, longitude, s.latitude, s.longitude);
          const radius = s.radius_meters || 500;
          if (dist <= radius && dist < minDistance) {
            minDistance = dist;
            closest = s;
          }
        }
      }

      if (closest) {
        setDetectedSite(closest);
      } else {
        setLocationError("No nearby facility detected. Please scan the QR code in the room.");
      }
    } catch (err: any) {
      console.error("AutoDetect error:", err);
      setLocationError("Could not determine your location. Please ensure GPS is on.");
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    console.log("[WebSubmit] handleSubmit TRIGGERED");
    
    // 1. SET STATE IMMEDIATELY - Ensure spinner shows up
    setIsSubmitting(true);
    
    // 2. Perform validation after setting state (so spinner shows)
    if (!name || !description) {
      console.log("[WebSubmit] Validation failed:", { name: !!name, desc: !!description });
      setIsSubmitting(false); // Revert since we aren't proceeding
      Alert.alert("Missing Fields", "Please enter your name and issue details.");
      return;
    }

    try {
      // 3. Optional Safeties for Haptics on Web
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (hapticErr) {
        console.warn("[WebSubmit] Haptics not supported or blocked:", hapticErr);
      }
      
      console.log("[WebSubmit] Payload:", {
        site_id: detectedSite.id,
        company_id: detectedSite.company_id,
        client_id: detectedSite.client_id,
        supervisor_id: detectedSite.assigned_supervisor_id,
        category: category,
        description: description
      });

      const { error } = await supabase.from('complaints').insert([{
        site_id: detectedSite.id,
        company_id: detectedSite.company_id,
        client_id: detectedSite.client_id,
        supervisor_id: detectedSite.assigned_supervisor_id,
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

      if (error) {
        console.error("[WebWebSubmit] Supabase Error Details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      console.log("[WebSubmit] Success!");
      
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
      setStep(1); // Reset for next time
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {}
    } catch (err: any) {
      console.error("[WebSubmit] Catch Error:", err);
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
    const activeBg = isDarkMode ? Colors.dark.bg : '#F8FAFC';

    return (
      <View style={[styles.root, { backgroundColor: activeBg }]}>
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: 60 }]}>
          
          {/* Web Header */}
          <View style={styles.webHeader}>
            <View style={styles.logoCircleSmall}>
               <Feather name="box" size={24} color="#1E3A8A" />
            </View>
            <Text style={styles.webTitle}>GMS Public Portal</Text>
          </View>

          {locating ? (
            <View style={styles.centerSection}>
              <ActivityIndicator size="large" color="#1E3A8A" />
              <Text style={styles.statusText}>Detecting Facility...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.centerSection}>
               <View style={styles.errorIconCircle}>
                 <Feather name="map-pin" size={32} color="#EF4444" />
               </View>
               <Text style={styles.errorTitle}>Verification Required</Text>
               <Text style={styles.errorSub}>{locationError}</Text>
               <SoftButton title="Try Again" onPress={() => autoDetectSite(false)} variant="outline" style={{ marginTop: 24, width: 200 }} />
               <Pressable onPress={() => autoDetectSite(true)} style={{ marginTop: 20 }}>
                  <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#64748B', textDecorationLine: 'underline' }}>Testing? Use Mock Facility</Text>
               </Pressable>
            </View>
          ) : submitted ? (
            <View style={styles.centerSection}>
              <View style={styles.successIconLarge}>
                 <Feather name="check" size={40} color="white" />
              </View>
              <Text style={styles.successTitle}>Alert Sent!</Text>
              <Text style={styles.successSub}>
                Your report has been dispatched to {detectedSite.name}. A supervisor will assist shortly.
              </Text>
              <SoftButton title="Raise Another" onPress={() => setSubmitted(false)} variant="outline" style={{ marginTop: 24, width: 200 }} />
            </View>
          ) : detectedSite ? (
            <View style={styles.formSection}>
               <View style={styles.siteBanner}>
                  <Text style={styles.atText}>Current Location</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Feather name="map-pin" size={16} color="#1E3A8A" />
                    <Text style={styles.siteName}>{detectedSite.name}</Text>
                  </View>
               </View>

               <View style={styles.webCard}>
                 
                 {/* Progress Bar */}
                 <View style={styles.progressContainer}>
                   <View style={styles.progressTrack}>
                     <Animated.View 
                       style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} 
                       layout={Layout.springify()}
                     />
                   </View>
                   <Text style={styles.progressText}>Step {step} of {totalSteps}</Text>
                 </View>

                 {step === 1 && (
                   <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
                     <View style={styles.formGroup}>
                       <Text style={styles.sectionLabel}>WHAT'S THE ISSUE?</Text>
                       <Text style={styles.stepHint}>Select the category that best describes the problem.</Text>
                       <View style={styles.catGridBig}>
                          <Pressable 
                            style={[styles.catCardBig, category === 'Cleaning' && styles.catCardActive]}
                            onPress={() => { setCategory('Cleaning'); Haptics.selectionAsync(); setTimeout(() => setStep(2), 300); }}
                          >
                            <View style={[styles.catIconWrap, category === 'Cleaning' && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                               <Feather name="wind" size={28} color={category === 'Cleaning' ? 'white' : '#1E3A8A'} />
                            </View>
                            <Text style={[styles.catCardTextBig, category === 'Cleaning' && { color: 'white' }]}>Cleaning</Text>
                            <Text style={[styles.catCardDesc, category === 'Cleaning' && { color: 'rgba(255,255,255,0.8)' }]}>Spills, trash, mess</Text>
                          </Pressable>
                          
                          <Pressable 
                            style={[styles.catCardBig, category === 'Misbehave' && styles.catCardActive]}
                            onPress={() => { setCategory('Misbehave'); Haptics.selectionAsync(); setTimeout(() => setStep(2), 300); }}
                          >
                            <View style={[styles.catIconWrap, category === 'Misbehave' && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                               <Feather name="shield" size={28} color={category === 'Misbehave' ? 'white' : '#1E3A8A'} />
                            </View>
                            <Text style={[styles.catCardTextBig, category === 'Misbehave' && { color: 'white' }]}>Behavior</Text>
                            <Text style={[styles.catCardDesc, category === 'Misbehave' && { color: 'rgba(255,255,255,0.8)' }]}>Noise, complaints</Text>
                          </Pressable>
                       </View>
                     </View>
                     
                     <SoftButton 
                       title="Next Step" 
                       onPress={() => setStep(2)} 
                       style={styles.actionBtn}
                     />
                   </Animated.View>
                 )}

                 {step === 2 && (
                   <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
                     <View style={styles.formGroup}>
                       <Text style={styles.sectionLabel}>EXACT LOCATION</Text>
                       <Text style={styles.stepHint}>Tell us exactly where our staff should go.</Text>
                       <SoftInput placeholder="Floor (e.g. Lobby, 4)" value={floor} onChangeText={setFloor} keyboardType="default" containerStyle={{ marginBottom: 12 }} />
                       <SoftInput placeholder="Room Number or Specific Area" value={room} onChangeText={setRoom} />
                     </View>
                     
                     <View style={styles.buttonRow}>
                       <SoftButton title="Back" onPress={() => setStep(1)} variant="outline" style={{ flex: 1 }} />
                       <SoftButton title="Next Step" onPress={() => setStep(3)} style={{ flex: 2 }} />
                     </View>
                   </Animated.View>
                 )}

                 {step === 3 && (
                   <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
                     <View style={styles.formGroup}>
                       <Text style={styles.sectionLabel}>YOUR DETAILS (OPTIONAL)</Text>
                       <Text style={styles.stepHint}>Provide your name if you'd like us to address you.</Text>
                       <SoftInput placeholder="Your Name or remain anonymous" value={name} onChangeText={setName} containerStyle={{ marginBottom: 20 }} />
                       
                       <Text style={styles.sectionLabel}>DETAILS & DESCRIPTION</Text>
                       <SoftInput 
                         placeholder="Describe what needs attention..." 
                         value={description} 
                         onChangeText={setDescription}
                         multiline
                         style={styles.textArea}
                       />
                     </View>

                     <View style={styles.buttonRow}>
                       <SoftButton title="Back" onPress={() => setStep(2)} variant="outline" style={{ flex: 1 }} />
                       <SoftButton 
                         title={isSubmitting ? "Dispatching..." : "Submit Alert"} 
                         onPress={handleSubmit} 
                         loading={isSubmitting}
                         style={{ flex: 2 }}
                       />
                     </View>
                   </Animated.View>
                 )}

               </View>
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
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: isDarkMode ? Colors.dark.bg : '#F8FAFC' }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 60, paddingBottom: 40 }]}>
        <View style={styles.hero}>
          <View style={[styles.logoContainer, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
            <Feather name="box" size={36} color={isDarkMode ? Colors.dark.accent : '#1E3A8A'} />
          </View>
          <Text style={[styles.appName, isDarkMode && { color: Colors.dark.text }]}>Staff Terminal</Text>
        </View>

        <View style={[styles.mobileCard, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }]}>
          <Text style={[styles.mobileTitle, isDarkMode && { color: Colors.dark.text }]}>Authorized Access</Text>
          <SoftInput ref={emailRef} icon="mail" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <SoftInput ref={passwordRef} icon="lock" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <SoftButton title={loading ? "Authenticating..." : "Secure Login"} onPress={handleMobileLogin} loading={loading} style={{ marginTop: 8 }} />
        </View>

        <View style={styles.footer}>
           <Text style={[styles.footerText, isDarkMode && { color: Colors.dark.textMuted }]}>Company issued devices only</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  hero: { alignItems: "center", gap: 16, marginBottom: 40 },
  logoContainer: { 
    width: 80, 
    height: 80, 
    borderRadius: 20, 
    backgroundColor: 'white', 
    justifyContent: "center", 
    alignItems: "center", 
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  appName: { fontSize: 24, fontFamily: "Inter_800ExtraBold", color: '#0F172A', letterSpacing: -0.5 },
  mobileCard: { 
    gap: 16, 
    padding: 28, 
    borderRadius: 20, 
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  mobileTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: '#0F172A', marginBottom: 8 },
  errorText: { color: '#EF4444', fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },
  
  // Web Specific Styles
  webHeader: { alignItems: 'center', marginBottom: 40, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  logoCircleSmall: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  webTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#0F172A', letterSpacing: -0.5 },
  centerSection: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  statusText: { marginTop: 16, fontSize: 15, fontFamily: 'Inter_500Medium', color: '#475569' },
  errorIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#1E293B', marginBottom: 8 },
  errorSub: { fontSize: 14, color: '#64748B', fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 300, lineHeight: 22 },
  successIconLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  successTitle: { fontSize: 28, fontFamily: 'Inter_900Black', color: '#0F172A', marginBottom: 12 },
  successSub: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#475569', textAlign: 'center', lineHeight: 24, maxWidth: 350 },
  formSection: { gap: 24, width: '100%', maxWidth: 520, alignSelf: 'center' },
  siteBanner: { 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center', 
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4, 
    borderLeftColor: '#1E3A8A', 
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  atText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  siteName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  webCard: { 
    padding: 32, 
    borderRadius: 16, 
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  formGroup: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#475569', letterSpacing: 1, marginBottom: 4 },
  stepHint: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#64748B', marginBottom: 16 },
  row: { flexDirection: 'row', gap: 16 },
  catGridBig: { flexDirection: 'row', gap: 16 },
  catCardBig: { 
    flex: 1, 
    padding: 24, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#F8FAFC' 
  },
  catIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  catCardActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A', shadowColor: '#1E3A8A', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  catCardTextBig: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 4 },
  catCardDesc: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },
  textArea: { height: 120, paddingTop: 16, alignItems: 'flex-start', justifyContent: 'flex-start' },
  actionBtn: { marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  progressContainer: { marginBottom: 32 },
  progressTrack: { width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#1E3A8A', borderRadius: 3 },
  progressText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#94A3B8', textAlign: 'right' },
  stepContainer: { width: '100%' },
  webFooter: { marginTop: 60, alignItems: 'center' }
});
