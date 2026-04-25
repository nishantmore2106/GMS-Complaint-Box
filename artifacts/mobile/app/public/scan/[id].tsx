import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import { HapticsService } from "@/utils/haptics";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  ZoomIn, 
  SlideInRight,
  SlideOutLeft,
  Layout,
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from "react-native-reanimated";
import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Dimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { SoftCard } from "@/components/SoftCard";
import { SoftButton } from "@/components/SoftButton";
import { SoftInput } from "@/components/SoftInput";
import { supabase } from "@/lib/supabase";
import { NotificationManager } from "@/services/notification.manager";
import { LocationService } from "@/services/location.service";
import { PhaseTracker } from "@/components/PhaseTracker";
import { useApp } from "@/context/AppContext";
import * as Haptics from "expo-haptics";
import * as FileSystem from 'expo-file-system';
import { APP_CONFIG } from "@/constants/config";

const { width } = Dimensions.get('window');

const PulsingRing = ({ isChecking }: { isChecking: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isChecking) {
      opacity.value = 0.6;
      scale.value = withRepeat(withTiming(1.6, { duration: 1200, easing: Easing.out(Easing.ease) }), -1, false);
      opacity.value = withRepeat(withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }), -1, false);
    } else {
      scale.value = withTiming(1);
      opacity.value = withTiming(0);
    }
  }, [isChecking]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
  }));

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={animatedStyle} />
      <View style={styles.pulseCenter}>
        <Feather name={isChecking ? "loader" : "navigation"} size={28} color="white" />
      </View>
    </View>
  );
};

export default function AnonymousComplaintScreen() {
  const { id, test } = useLocalSearchParams<{ id: string, test?: string }>();
  const insets = useSafeAreaInsets();
  
  const [site, setSite] = useState<any>(null);
  const [loadingSite, setLoadingSite] = useState(true);
  const [locationPerm, setLocationPerm] = useState<boolean | null>(null);
  const [isInside, setIsInside] = useState<boolean | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState<string>("");
  const [distanceAway, setDistanceAway] = useState<number | null>(null);
  
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'founder';

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState<"Cleaning" | "Misbehave" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState<any>(null);
  const [recoveredId, setRecoveredId] = useState<string | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);
  const [correctionNote, setCorrectionNote] = useState<string | null>(null);

  const loadActiveRecord = async (activeId: string) => {
    try {
      console.log("[Portal] Loading active record:", activeId);
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('id', activeId)
        .single();
      
      if (data) {
        setActiveComplaint(data);
        return data;
      }
    } catch (err) {
      console.error("[Portal] loadActiveRecord error:", err);
    }
    return null;
  };

  // Persistence and Real-time listener
  useEffect(() => {
    async function checkActive() {
      if (!id) return;
      try {
        setCheckingActive(true);
        let activeId = await AsyncStorage.getItem(`GMS_ACTIVE_COMP_SITE_${id}`);
        
        if (!activeId) {
          console.log("[Portal] Searching for active reports at site:", id);
          
          let query = supabase
            .from('complaints')
            .select('id')
            .eq('site_id', id)
            .neq('status', 'resolved');
          
          if (currentUser?.id) {
             query = query.or(`is_anonymous.eq.true,user_id.eq.${currentUser.id}`);
          } else {
             query = query.or(`is_anonymous.eq.true,is_anonymous.is.null`);
          }

          const { data: recovered } = await query
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recovered) {
            console.log("[Portal] Recovered session from DB:", recovered.id);
            activeId = recovered.id;
          }
        }
        
        if (activeId) {
          console.log("[Portal] Active session detected:", activeId);
          setRecoveredId(activeId); 
          
          if (!submitted) {
            const hasRequestedNew = await AsyncStorage.getItem(`GMS_NEW_FLOW_FLAG_${id}`);
            if (!hasRequestedNew) {
               await loadActiveRecord(activeId);
            }
          }
        }

        // Global Session Check (from index.tsx)
        const globalActiveId = await AsyncStorage.getItem(APP_CONFIG.AUTH.SESSION_RECOVERY_KEY);
        if (globalActiveId && globalActiveId !== activeId) {
           console.log("[Portal] Global session detected, checking status...");
           const { data } = await supabase.from('complaints').select('status, site_id').eq('id', globalActiveId).single();
           if (data && data.status !== 'resolved' && data.site_id === id) {
              setRecoveredId(globalActiveId);
              const hasRequestedNew = await AsyncStorage.getItem(`GMS_NEW_FLOW_FLAG_${id}`);
              if (!hasRequestedNew) {
                 await loadActiveRecord(globalActiveId);
              }
           }
        }
      } catch (err) {
        console.error("[Portal] DB Check Error:", err);
      } finally {
        setCheckingActive(false);
      }
    }

    checkActive();
  }, [id, submitted, currentUser?.id]);

  // Handle Real-time Subscription separately
  useEffect(() => {
    let subscription: any;
    if (activeComplaint?.id) {
       console.log("[Portal] Subscribing to real-time updates for:", activeComplaint.id);
       subscription = supabase
         .channel(`complaint-tracker-${activeComplaint.id}`)
         .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'complaints', 
            filter: `id=eq.${activeComplaint.id}` 
         }, (payload) => {
            console.log("[Portal] Live Record Refresh:", payload.new.current_phase || payload.new.status);
            setActiveComplaint(prev => ({ ...prev, ...payload.new }));
         })
         .subscribe();
    }
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [activeComplaint?.id]);

  useEffect(() => {
    async function loadSite() {
      if (!id) return;
      const { data, error } = await supabase.from('sites').select('*').eq('id', id).single();
      if (data) setSite(data);
      setLoadingSite(false);
    }
    loadSite();
  }, [id]);

  const verifyLocation = async () => {
    setCheckingLocation(true);
    setCalibrationStep("Calibrating GPS...");
    setCorrectionNote(null);
    await HapticsService.impact('medium');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPerm(status === 'granted');
      
      if (status !== 'granted') {
        setCheckingLocation(false);
        return;
      }

      setCalibrationStep("Locking Coordinates...");
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      if (test === 'true' || isAdmin) {
        setCalibrationStep(isAdmin ? "Admin Override..." : "Bypassing for Dev...");
        setTimeout(() => {
          setIsInside(true);
          setCheckingLocation(false);
          HapticsService.success();
        }, 800);
        return;
      }

      setCalibrationStep("Verifying Proximity...");
      if (site?.latitude && site?.longitude) {
        const distance = LocationService.getDistance({ latitude, longitude }, { latitude: site.latitude, longitude: site.longitude });
        setDistanceAway(Math.round(distance));
        const radius = site.radius_meters || APP_CONFIG.GEOFENCE.DEFAULT_RADIUS; 

        if (distance <= radius) {
          setIsInside(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setCalibrationStep("Searching nearby...");
          const { data: allSites } = await supabase.from('sites').select('*');
          if (allSites) {
             const nearest = LocationService.findNearestSite({ latitude, longitude }, allSites, radius);
             if (nearest && nearest.id !== id) {
                setSite(nearest);
                setIsInside(true);
                setCorrectionNote(`Location adjusted to ${nearest.name} (nearest site).`);
                HapticsService.success();
             } else {
                setIsInside(false);
                HapticsService.error();
             }
          } else {
             setIsInside(false);
             HapticsService.error();
          }
        }
      } else {
        setIsInside(true);
      }
      setCheckingLocation(false);
    } catch (err) {
      console.error("[Portal/Verify] Error:", err);
      Alert.alert("GPS Error", "Ensure location is enabled.");
      setCheckingLocation(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5 });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      HapticsService.impact('light');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      console.log("[Portal] Uploading image via FileSystem...");
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const filePath = `public/${id}/pub_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { data, error } = await supabase.storage
        .from(APP_CONFIG.STORAGE.BUCKET_NAME)
        .upload(filePath, blob, { contentType: 'image/jpeg' });
        
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(APP_CONFIG.STORAGE.BUCKET_NAME).getPublicUrl(data.path);
      return publicUrl;
    } catch (err) {
      console.error("[Portal] Upload failed, falling back to fetch:", err);
      // Fallback
      const response = await fetch(uri);
      const blob = await response.blob();
      const filePath = `public/${id}/pub_${Date.now()}.jpg`;
      const { data, error } = await supabase.storage.from(APP_CONFIG.STORAGE.BUCKET_NAME).upload(filePath, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(APP_CONFIG.STORAGE.BUCKET_NAME).getPublicUrl(data.path);
      return publicUrl;
    }
  };

  const handleSubmit = async () => {
    if (!name || !description) {
      Alert.alert("Required", "Please provide a name and description.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      let uploadedUrl = null;
      if (image) uploadedUrl = await uploadImage(image);

      const { data, error } = await supabase.from('complaints').insert([{
        site_id: id,
        company_id: site.company_id,
        client_id: currentUser?.id || site.client_id,
        supervisor_id: site.assigned_supervisor_id,
        category: category || 'Cleaning',
        subcategory: category === 'Cleaning' ? 'Public Area Cleaning' : 'General Issue',
        description: `${description}\nFloor: ${floor}, Room: ${room}`,
        before_media_url: uploadedUrl,
        is_anonymous: !currentUser,
        anonymous_name: name,
        floor,
        room_number: room,
        status: 'pending',
        priority: 'medium'
      }]).select().single();

      if (error) throw error;
      await AsyncStorage.setItem(`GMS_ACTIVE_COMP_SITE_${id}`, data.id);
      await AsyncStorage.setItem(APP_CONFIG.AUTH.SESSION_RECOVERY_KEY, data.id);
      await AsyncStorage.removeItem(`GMS_NEW_FLOW_FLAG_${id}`); 
      await NotificationManager.notifyNewComplaint(data, site.name).catch(() => {});
      await HapticsService.success();
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert("Submission Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSite || checkingActive) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Live Tracker View
  if (activeComplaint && activeComplaint.status !== 'resolved') {
    return (
      <View style={[styles.root, { backgroundColor: '#FFFFFF' }]}>
        <ScrollView contentContainerStyle={styles.scroll}>
           <Animated.View entering={FadeInDown} style={styles.trackerHeader}>
              <View style={styles.liveBadgeHeader}>
                 <View style={styles.liveDot} />
                 <Text style={styles.liveText}>LIVE TRACKING ACTIVE</Text>
              </View>
              <Text style={styles.compShortId}>CASE #{activeComplaint.id.substring(0, 8).toUpperCase()}</Text>
              <Text style={styles.siteNameSmall}>{site.name}</Text>
           </Animated.View>

           <Animated.View entering={FadeInUp.delay(200)} style={styles.trackerCardWrap}>
              <SoftCard style={styles.trackerContent}>
                 <Text style={styles.trackerTitle}>Issue Status</Text>
                 <PhaseTracker currentPhase={activeComplaint.current_phase || 'reported'} isDarkMode={false} />
                 
                 <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                       <Text style={styles.metaLabel}>Category</Text>
                       <Text style={styles.metaValue}>{activeComplaint.category}</Text>
                    </View>
                    <View style={styles.metaItem}>
                       <Text style={styles.metaLabel}>Location</Text>
                       <Text style={styles.metaValue}>{activeComplaint.floor || 'G'} / {activeComplaint.room_number || 'N/A'}</Text>
                    </View>
                 </View>
              </SoftCard>
           </Animated.View>

           <View style={styles.waitMessage}>
              <Feather name="info" size={16} color="#64748B" />
              <Text style={styles.waitText}>Hold onto this page. It will update in real-time as our staff attends to your report.</Text>
           </View>
           
           <SoftButton 
             title="Submit Another Issue" 
             variant="outline" 
             onPress={async () => {
                await AsyncStorage.setItem(`GMS_NEW_FLOW_FLAG_${id}`, 'true');
                setActiveComplaint(null);
                setSubmitted(false);
                setStep(1);
             }}
             style={{ marginTop: 24 }}
           />
        </ScrollView>
      </View>
    );
  }

  // Resolved / Success Splash
  if (activeComplaint?.status === 'resolved') {
      return (
        <View style={styles.center}>
           <View style={styles.successIconCircle}>
              <Feather name="check" size={40} color="white" />
           </View>
           <Text style={styles.successTitle}>Problem Resolved</Text>
           <Text style={styles.successSub}>The onsite team has confirmed that this issue is now closed. Thank you for your alert.</Text>
           <SoftButton title="Back to Scanner" onPress={() => { AsyncStorage.removeItem(`GMS_ACTIVE_COMP_SITE_${id}`); AsyncStorage.removeItem(`GMS_NEW_FLOW_FLAG_${id}`); setActiveComplaint(null); setSubmitted(false); }} style={{ marginTop: 24, width: '100%' }} />
        </View>
      );
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <Animated.View entering={FadeInDown} style={styles.header}>
            <SoftCard style={styles.headerCard}>
              <View style={styles.logoCircle}>
                {site.logo_url ? <Image source={{ uri: site.logo_url }} style={styles.logo} /> : <Feather name="map-pin" size={24} color={Colors.primary} />}
              </View>
              <Text style={styles.siteHeaderName}>{site.name}</Text>
              <Text style={styles.deskSub}>QUICK RESPONSE DESK</Text>
            </SoftCard>
          </Animated.View>

          {/* Elevated Recovery Option - ALWAYS VISIBLE before geofence or in form */}
          {recoveredId && !activeComplaint && (
            <Animated.View entering={FadeInUp} style={{ marginBottom: 24 }}>
               <SoftCard style={{ padding: 16, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                     <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name="activity" size={16} color={Colors.primary} />
                     </View>
                     <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#1E40AF' }}>Active Report Detected</Text>
                        <Text style={{ fontSize: 11, color: '#3B82F6' }}>Review your previous submission.</Text>
                     </View>
                     <SoftButton 
                        title="View Tracker" 
                        variant="ghost" 
                        onPress={async () => {
                           await AsyncStorage.removeItem(`GMS_NEW_FLOW_FLAG_${id}`);
                           await loadActiveRecord(recoveredId);
                        }} 
                        style={{ height: 32, paddingHorizontal: 12 }}
                     />
                  </View>
               </SoftCard>
            </Animated.View>
          )}

          {isInside === null ? (
            <SoftCard style={styles.geofenceCard}>
               <PulsingRing isChecking={checkingLocation} />
               <Text style={styles.geoTitle}>Confirm Presence</Text>
               <Text style={styles.geoSub}>This portal is for onsite reporting only. Please verify you are at {site.name}.</Text>
               <SoftButton title={checkingLocation ? calibrationStep : "I am Onsite"} onPress={verifyLocation} loading={checkingLocation} />
            </SoftCard>
          ) : isInside === false ? (
            <SoftCard style={styles.geofenceCard}>
               <Feather name="map-pin" size={40} color={Colors.danger} style={{ marginBottom: 16 }} />
               <Text style={styles.geoTitle}>Location Mismatch</Text>
               <Text style={styles.geoSub}>You appear to be {distanceAway}m away. Reports must be raised from within the premises.</Text>
               <SoftButton title="Re-Verify Location" variant="outline" onPress={verifyLocation} />
            </SoftCard>
          ) : (
            <Animated.View entering={FadeIn}>
              <SoftCard style={styles.formContainer}>
                  <Text style={styles.stepTitle}>Reporting Concern ({step}/4)</Text>
                  <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(step/4)*100}%` }]} /></View>

                  {step === 1 && (
                    <View>
                       <Text style={styles.label}>Select Concern</Text>
                       <View style={styles.catGrid}>
                          <Pressable style={[styles.miniCat, category === 'Cleaning' && styles.miniCatActive]} onPress={() => setCategory('Cleaning')}>
                             <Feather name="wind" size={20} color={category === 'Cleaning' ? 'white' : '#64748B'} />
                             <Text style={[styles.miniCatLabel, category === 'Cleaning' && { color: 'white' }]}>Cleaning</Text>
                          </Pressable>
                          <Pressable style={[styles.miniCat, category === 'Misbehave' && styles.miniCatActive]} onPress={() => setCategory('Misbehave')}>
                             <Feather name="shield" size={20} color={category === 'Misbehave' ? 'white' : '#64748B'} />
                             <Text style={[styles.miniCatLabel, category === 'Misbehave' && { color: 'white' }]}>Behavior</Text>
                          </Pressable>
                       </View>

                       <View style={{ marginTop: 20 }}>
                         <Text style={styles.label}>Visual Proof (Required)</Text>
                         <Pressable onPress={pickImage} style={[styles.photoBox, image && { borderColor: Colors.primary }]}>
                            {image ? <Image source={{ uri: image }} style={styles.photoPreview} /> : <Feather name="camera" size={24} color="#CBD5E1" />}
                            <Text style={styles.photoLabel}>{image ? "Image Captured" : "Tap to Take Photo"}</Text>
                         </Pressable>
                       </View>

                       <SoftButton title="Next Step" onPress={() => setStep(2)} disabled={!category || !image} style={{ marginTop: 24 }} />
                    </View>
                  )}

                  {step === 2 && (
                     <View>
                        <Text style={styles.label}>Location Details</Text>
                        <SoftInput placeholder="Floor (e.g. 1st, Lobby)" value={floor} onChangeText={setFloor} />
                        <SoftInput placeholder="Room / Area" value={room} onChangeText={setRoom} containerStyle={{ marginTop: 12 }} />
                        <View style={styles.btnRow}>
                           <SoftButton title="Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1 }} />
                           <SoftButton title="Next" onPress={() => setStep(3)} style={{ flex: 2 }} />
                        </View>
                     </View>
                  )}

                  {step === 3 && (
                    <View>
                       <Text style={styles.label}>Final Details</Text>
                       <SoftInput placeholder="Your Name" value={name} onChangeText={setName} />
                       <SoftInput placeholder="Describe the issue..." value={description} onChangeText={setDescription} multiline style={{ height: 100, marginTop: 12 }} />
                       <View style={styles.btnRow}>
                           <SoftButton title="Back" variant="outline" onPress={() => setStep(2)} style={{ flex: 1 }} />
                           <SoftButton title="Submit Report" onPress={handleSubmit} loading={isSubmitting} style={{ flex: 2 }} />
                        </View>
                    </View>
                  )}
               </SoftCard>
            </Animated.View>
          )}

          {correctionNote && (
            <View style={{ marginTop: 20, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 12 }}>
               <Text style={{ fontSize: 12, color: '#92400E', textAlign: 'center' }}>{correctionNote}</Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { marginBottom: 24 },
  headerCard: { alignItems: 'center', padding: 20 },
  logoCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logo: { width: '100%', height: '100%', borderRadius: 25 },
  siteHeaderName: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#0F172A' },
  deskSub: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: Colors.primary, letterSpacing: 1, marginTop: 4 },
  geofenceCard: { padding: 32, alignItems: 'center' },
  pulseContainer: { height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  pulseCenter: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  geoTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#0F172A', marginBottom: 8 },
  geoSub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  formContainer: { padding: 20 },
  stepTitle: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#64748B', marginBottom: 12 },
  progressBar: { height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary },
  label: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 },
  catGrid: { flexDirection: 'row', gap: 12 },
  miniCat: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', gap: 8 },
  miniCatActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  miniCatLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#64748B' },
  photoBox: { height: 120, borderRadius: 16, backgroundColor: '#F8FAFC', borderStyle: 'dashed', borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', gap: 8 },
  photoPreview: { width: '100%', height: '100%', borderRadius: 14 },
  photoLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#94A3B8' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  trackerHeader: { alignItems: 'center', marginBottom: 24 },
  liveBadgeHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDE6E9', padding: 6, borderRadius: 6, gap: 6, marginBottom: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveText: { fontSize: 10, fontFamily: 'Inter_900Black', color: '#EF4444' },
  compShortId: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#0F172A' },
  siteNameSmall: { fontSize: 14, color: '#64748B' },
  trackerCardWrap: { marginBottom: 24 },
  trackerContent: { padding: 24 },
  trackerTitle: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#0F172A', marginBottom: 20 },
  metaRow: { flexDirection: 'row', marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#94A3B8', textTransform: 'uppercase' },
  metaValue: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#334155' },
  waitMessage: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 12, alignItems: 'center' },
  waitText: { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 18 },
  successIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#0F172A' },
  successSub: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 22 }
});
