import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, SlideInRight, SlideOutLeft, Layout } from "react-native-reanimated";
import React, { useState, useRef, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_CONFIG } from "@/constants/config";
import { LocationService } from "@/services/location.service";
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
  TextInput,
  Image
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

// Removed duplicate getDistance - using LocationService

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
  const [image, setImage] = useState<string | null>(null);
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      autoDetectSite();
      checkActiveSession();
    }
  }, []);

  const checkActiveSession = async () => {
    try {
      const savedId = await AsyncStorage.getItem(APP_CONFIG.AUTH.SESSION_RECOVERY_KEY);
      if (savedId) {
        // Verify if it's still active
        const { data } = await supabase.from('complaints').select('status').eq('id', savedId).single();
        if (data && data.status !== 'resolved') {
          setActiveComplaintId(savedId);
        } else {
          await AsyncStorage.removeItem(APP_CONFIG.AUTH.SESSION_RECOVERY_KEY);
        }
      }
    } catch (e) {}
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

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
          const dist = LocationService.getDistance(
            { latitude, longitude }, 
            { latitude: s.latitude, longitude: s.longitude }
          );
          const radius = s.radius_meters || APP_CONFIG.GEOFENCE.DEFAULT_RADIUS;
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
    if (!description) {
      console.log("[WebSubmit] Validation failed:", { desc: !!description });
      setIsSubmitting(false); // Revert since we aren't proceeding
      Alert.alert("Missing Fields", "Please enter the issue details.");
      return;
    }

    try {
      // 3. Optional Safeties for Haptics on Web
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (hapticErr) {
        console.warn("[WebSubmit] Haptics not supported or blocked:", hapticErr);
      }
      
      let imageUrl = null;
      if (image) {
        console.log("[WebSubmit] Uploading image...");
        try {
          const fileName = `public/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const response = await fetch(image);
          const blob = await response.blob();
          
          const { data, error: uploadErr } = await supabase.storage
            .from(APP_CONFIG.STORAGE.BUCKET_NAME)
            .upload(fileName, blob);
            
          if (uploadErr) throw uploadErr;
          
          const { data: { publicUrl } } = supabase.storage
            .from(APP_CONFIG.STORAGE.BUCKET_NAME)
            .getPublicUrl(data.path);
          imageUrl = publicUrl;
        } catch (imgErr) {
          console.warn("[WebSubmit] Image upload failed, proceeding without image:", imgErr);
        }
      }

      console.log("[WebSubmit] Inserting record into complaints table...");
      const { data: newComplaint, error } = await supabase.from('complaints').insert([{
        site_id: detectedSite.id,
        company_id: detectedSite.company_id,
        client_id: detectedSite.client_id,
        supervisor_id: detectedSite.assigned_supervisor_id,
        category: category,
        subcategory: category === 'Cleaning' ? 'Public Area Cleaning' : 'Improper Behavior',
        description: `${description}\nFloor: ${floor}, Room: ${room}`,
        is_anonymous: true,
        anonymous_name: name || "Anonymous",
        floor: floor,
        room_number: room,
        status: 'pending',
        priority: 'medium',
        before_media_url: imageUrl
      }]).select().single();

      if (error) {
        console.error("[WebSubmit] Insert Error Details:", error);
        throw error;
      }
      
      if (newComplaint) {
        await AsyncStorage.setItem(APP_CONFIG.AUTH.SESSION_RECOVERY_KEY, newComplaint.id);
        setActiveComplaintId(newComplaint.id);
      }

      console.log("[WebSubmit] Success!");
      
      try {
        await NotificationManager.notifyNewComplaint({
          id: newComplaint?.id || (detectedSite.id + '_web_' + Date.now()),
          company_id: detectedSite.company_id,
          site_id: detectedSite.id,
          priority: 'medium',
          is_anonymous: true,
          category: category
        }, detectedSite.name);
      } catch (e) {}

      setSubmitted(true);
      setStep(1); 
      setImage(null);
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

    if (submitted) {
      return (
        <View style={[styles.root, { backgroundColor: activeBg, justifyContent: 'center', alignItems: 'center' }]}>
          <Animated.View entering={FadeIn.duration(800)} style={{ alignItems: 'center', gap: 24, padding: 40 }}>
            <View style={styles.successIconLarge}>
               <Feather name="check" size={40} color="white" />
            </View>
            <Text style={styles.successTitle}>Alert Sent!</Text>
            <Text style={styles.successSub}>
              Your report has been dispatched to {detectedSite?.name}. A supervisor will assist shortly.
            </Text>
            <View style={{ gap: 12, marginTop: 24, width: '100%', alignItems: 'center' }}>
              <SoftButton 
                title="Track Live Progress" 
                onPress={() => activeComplaintId && router.push(`/public/tracker/${activeComplaintId}`)} 
                style={{ width: 260, height: 56 }} 
              />
              <SoftButton 
                title="Raise Another Alert" 
                onPress={() => setSubmitted(false)} 
                variant="outline" 
                style={{ width: 260, height: 56 }} 
              />
            </View>
          </Animated.View>
        </View>
      );
    }

    return (
      <View style={[styles.root, { backgroundColor: activeBg }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={[styles.webHeader, { paddingTop: insets.top + 40 }]}>
            <View style={styles.logoCircleSmall}>
               <Feather name="box" size={24} color="#1E3A8A" />
            </View>
            <Text style={styles.webTitle}>GMS Public Portal</Text>
          </View>

          <View style={styles.formSection}>
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
                 <Text style={styles.errorTitle}>Facility Not Found</Text>
                 <Text style={styles.errorSub}>{locationError}</Text>
                 <SoftButton title="Try Again" onPress={() => autoDetectSite(false)} variant="outline" style={{ marginTop: 24, width: 220 }} />
                 <Pressable onPress={() => autoDetectSite(true)} style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#64748B', textDecorationLine: 'underline' }}>Testing? Use Mock Facility</Text>
                 </Pressable>
              </View>
            ) : detectedSite ? (
              <Animated.View entering={FadeIn.duration(600)} style={{ gap: 24 }}>
                <View style={styles.siteBanner}>
                  <Text style={styles.atText}>Current Location</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Feather name="map-pin" size={16} color="#1E3A8A" />
                    <Text style={styles.siteName}>{detectedSite.name}</Text>
                  </View>
                </View>

                <SoftCard style={{ gap: 20, padding: 24 }}>
                  <Text style={styles.sectionLabel}>WHAT'S THE ISSUE?</Text>
                  <View style={styles.catGrid}>
                    <Pressable 
                      style={[styles.catChip, category === 'Cleaning' && styles.catChipActive]}
                      onPress={() => setCategory('Cleaning')}
                    >
                      <Feather name="wind" size={16} color={category === 'Cleaning' ? 'white' : '#64748B'} />
                      <Text style={[styles.catChipText, category === 'Cleaning' && { color: 'white' }]}>Cleaning</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.catChip, category === 'Misbehave' && styles.catChipActive]}
                      onPress={() => setCategory('Misbehave')}
                    >
                      <Feather name="shield" size={16} color={category === 'Misbehave' ? 'white' : '#64748B'} />
                      <Text style={[styles.catChipText, category === 'Misbehave' && { color: 'white' }]}>Behavior</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.sectionLabel}>DETAILS</Text>
                  <SoftInput 
                    placeholder="Describe the problem (e.g. water spill, noise...)" 
                    value={description} 
                    onChangeText={setDescription}
                    multiline
                    style={{ height: 100, paddingTop: 12 }}
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionLabel}>FLOOR</Text>
                      <SoftInput placeholder="Lobby, 4, etc." value={floor} onChangeText={setFloor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionLabel}>ROOM/AREA</Text>
                      <SoftInput placeholder="Washroom, 402..." value={room} onChangeText={setRoom} />
                    </View>
                  </View>

                  <Text style={styles.sectionLabel}>ATTACH PHOTO (OPTIONAL)</Text>
                  <Pressable onPress={pickImage} style={styles.imagePickerBtnSmall}>
                    {image ? (
                      <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Feather name="camera" size={20} color="#1E3A8A" />
                        <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#1E3A8A' }}>Take/Upload Photo</Text>
                      </View>
                    )}
                  </Pressable>

                  <SoftButton 
                    title={isSubmitting ? "Dispatching Alert..." : "Submit Complaint"} 
                    onPress={handleSubmit} 
                    loading={isSubmitting}
                    style={{ marginTop: 12, height: 56 }}
                  />
                  
                  {activeComplaintId && (
                    <Pressable 
                      onPress={() => router.push(`/public/tracker/${activeComplaintId}`)}
                      style={{ alignSelf: 'center', marginTop: 12 }}
                    >
                      <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1E3A8A', textDecorationLine: 'underline' }}>
                        You have an active tracker. View Status 
                      </Text>
                    </Pressable>
                  )}
                </SoftCard>
              </Animated.View>
            ) : null}
          </View>
        </ScrollView>
        
        <View style={{ position: 'absolute', bottom: 20, width: '100%', alignItems: 'center' }}>
          <Text style={styles.footerText}> 2026 GMS Facility Management Service</Text>
        </View>
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
  siteName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E3A8A' },
  sectionLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 1, marginBottom: 8 },
  catGrid: { flexDirection: 'row', gap: 12 },
  catChip: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8, 
    paddingVertical: 12, 
    borderRadius: 12, 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  catChipActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  catChipText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#64748B' },
  imagePickerBtnSmall: { 
    height: 60, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    borderStyle: 'dashed', 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  pickerText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  trackerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  trackerBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: 'white',
  },
});


