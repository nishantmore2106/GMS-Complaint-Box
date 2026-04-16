import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import React, { useState, useEffect } from "react";
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
  
  // Wizard State
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState<"Cleaning" | "Misbehave">("Cleaning");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPerm(status === 'granted');
      
      if (status !== 'granted') {
        setCheckingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      if (test === 'true') {
        setTimeout(() => {
          setIsInside(true);
          setCheckingLocation(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);
        return;
      }

      if (site?.latitude && site?.longitude) {
        const distance = getDistance(latitude, longitude, site.latitude, site.longitude);
        const radius = site.radius_meters || 500;
        setTimeout(() => {
          const valid = distance <= radius;
          setIsInside(valid);
          if (valid) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setCheckingLocation(false);
        }, 1500); // Artificial delay to show animation
      } else {
        setTimeout(() => {
          setIsInside(true);
          setCheckingLocation(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1000);
      }
    } catch (err) {
      console.error("Location error:", err);
      Alert.alert("Location Error", "Could not verify your location. Please ensure GPS is on.");
      setCheckingLocation(false);
    }
  };

  const handleSubmit = async () => {
    console.log("[MobileSubmit] handleSubmit TRIGGERED");
    setIsSubmitting(true);

    if (!name || !description) {
      console.log("[MobileSubmit] Validation failed:", { name: !!name, desc: !!description });
      setIsSubmitting(false);
      Alert.alert("Missing Fields", "Please enter your name and some details about the issue.");
      return;
    }

    try {
      // 1. Safe Feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    
      console.log("[MobileSubmit] Payload:", {
        site_id: id,
        company_id: site.company_id,
        client_id: site.client_id,
        supervisor_id: site.assigned_supervisor_id,
        category: category,
        description: description
      });

      const { error } = await supabase.from('complaints').insert([{
        site_id: id,
        company_id: site.company_id,
        client_id: site.client_id,
        supervisor_id: site.assigned_supervisor_id,
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
      
      console.log("[MobileSubmit] Success!");
      
      // 2. Safe Notification
      await NotificationManager.notifyNewComplaint({
        id: site.id + '_anon_' + Date.now(), 
        company_id: site.company_id,
        site_id: id,
        priority: 'medium',
        is_anonymous: true,
        category: category
      }, site.name).catch(() => {});

      setStep(1); 
      setSubmitted(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err: any) {
      console.error("[MobileSubmit] Catch Error:", err);
      Alert.alert("Error", err.message || "Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingSite) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!site) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
        <Feather name="alert-triangle" size={56} color={Colors.danger} />
        <Text style={styles.errorText}>Invalid QR Code</Text>
        <Text style={styles.errorSub}>The location code you scanned is not recognized.</Text>
      </Animated.View>
    );
  }

  if (submitted) {
    return (
      <View style={[styles.center, { padding: 32, backgroundColor: '#FFFFFF' }]}>
        <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.successIconWrap}>
          <LinearGradient colors={['#34D399', '#10B981']} style={styles.successIconGradient}>
            <Feather name="check" size={50} color="white" />
          </LinearGradient>
        </Animated.View>
        <Animated.Text entering={FadeInUp.delay(300).springify()} style={styles.successTitle}>
          Alert Dispatched!
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(500).springify()} style={styles.successSub}>
          Thank you, {name || 'guest'}. Your report has been sent directly to the site supervisor at {site.name}. 
          Our staff will arrive shortly to resolve the issue.
        </Animated.Text>
        
        <Animated.View entering={FadeIn.delay(800)} style={styles.footerBrandSuccess}>
           <Text style={styles.footerText}>Powered by GMS Facility Management</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
            <View style={styles.headerCard}>
              <View style={styles.logoWrap}>
                {site.logo_url ? (
                  <Image source={{ uri: site.logo_url }} style={styles.siteLogo} />
                ) : (
                  <View style={styles.siteLogoFallback}>
                    <Feather name="map-pin" size={28} color="white" />
                  </View>
                )}
              </View>
              <Text style={styles.siteName}>{site.name}</Text>
              <Text style={styles.welcomeText}>Quick Response Desk</Text>
            </View>
          </Animated.View>

          {isInside === null ? (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <SoftCard style={styles.checkCard}>
                <PulsingRing isChecking={checkingLocation} />
                <Text style={styles.checkTitle}>Are you physically at {site.name}?</Text>
                <Text style={styles.checkSub}>We verify your location to ensure our staff arrive at the correct place immediately.</Text>
                
                <SoftButton 
                  title={checkingLocation ? "Verifying..." : "Confirm My Location"} 
                  onPress={verifyLocation}
                  loading={checkingLocation}
                  variant="primary"
                  style={styles.verifyBtn}
                />
              </SoftCard>
            </Animated.View>

          ) : isInside === false ? (
            <Animated.View entering={ZoomIn.duration(400).springify()}>
              <SoftCard style={[styles.checkCard, { borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1 }]}>
                <View style={[styles.pulseCenter, { backgroundColor: '#FEE2E2', marginBottom: 24 }]}>
                  <Feather name="map" size={28} color={Colors.danger} />
                </View>
                <Text style={styles.checkTitle}>Out of Range</Text>
                <Text style={styles.checkSub}>This portal only works when scanning from within the {site.name} premises.</Text>
                <SoftButton title="Try Verify Again" onPress={verifyLocation} variant="outline" style={{ marginTop: 8 }} />
                
                <Pressable onPress={() => setIsInside(true)} style={{ marginTop: 20, padding: 10 }}>
                   <Text style={{ fontSize: 13, color: '#9CA3AF', fontFamily: 'Inter_600SemiBold' }}>Use Testing Mode</Text>
                </Pressable>
              </SoftCard>
            </Animated.View>

          ) : (
            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.formWrap}>
              
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
                   <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ width: '100%' }}>
                     <View style={styles.formGroup}>
                       <Text style={styles.sectionLabel}>WHAT'S THE ISSUE?</Text>
                       <Text style={styles.stepHint}>Select the category that best describes the problem.</Text>
                       <View style={styles.catGrid}>
                          <Pressable 
                            style={[styles.catCard, category === 'Cleaning' && styles.catCardActive]}
                            onPress={() => { setCategory('Cleaning'); Haptics.selectionAsync(); setTimeout(() => setStep(2), 300); }}
                          >
                            <View style={[styles.catIconWrap, category === 'Cleaning' && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                               <Feather name="wind" size={24} color={category === 'Cleaning' ? 'white' : Colors.primary} />
                            </View>
                            <Text style={[styles.catTitle, category === 'Cleaning' && styles.catTextActive]}>Cleaning</Text>
                            <Text style={[styles.catDesc, category === 'Cleaning' && { color: 'rgba(255,255,255,0.8)' }]}>Spills, trash, mess</Text>
                          </Pressable>

                          <Pressable 
                            style={[styles.catCard, category === 'Misbehave' && styles.catCardActive]}
                            onPress={() => { setCategory('Misbehave'); Haptics.selectionAsync(); setTimeout(() => setStep(2), 300); }}
                          >
                            <View style={[styles.catIconWrap, category === 'Misbehave' && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                               <Feather name="shield" size={24} color={category === 'Misbehave' ? 'white' : Colors.primary} />
                            </View>
                            <Text style={[styles.catTitle, category === 'Misbehave' && styles.catTextActive]}>Behavior</Text>
                            <Text style={[styles.catDesc, category === 'Misbehave' && { color: 'rgba(255,255,255,0.8)' }]}>Noise, complaints</Text>
                          </Pressable>
                       </View>
                     </View>
                     
                     <SoftButton 
                       title="Next Step" 
                       onPress={() => setStep(2)} 
                       style={{ marginTop: 12 }}
                     />
                   </Animated.View>
                 )}

                 {step === 2 && (
                   <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ width: '100%' }}>
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
                   <Animated.View entering={SlideInRight} exiting={SlideOutLeft} style={{ width: '100%' }}>
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

                     <View style={styles.submitWrap}>
                       <View style={styles.buttonRow}>
                         <SoftButton title="Back" onPress={() => setStep(2)} variant="outline" style={{ flex: 1 }} />
                         <SoftButton 
                           title={isSubmitting ? "Dispatching..." : "Submit Alert"} 
                           onPress={handleSubmit} 
                           loading={isSubmitting}
                           style={{ flex: 2 }}
                         />
                       </View>
                       <Text style={styles.submitHint}>This will notify the staff on-site immediately.</Text>
                     </View>
                   </Animated.View>
                 )}

            </Animated.View>
          )}

          <Animated.View entering={FadeIn.delay(800)} style={styles.footer}>
            <Text style={styles.footerText}>Powered by GMS Facility Management</Text>
          </Animated.View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  scroll: { 
    padding: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 60 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC',
    padding: 20
  },
  header: { 
    marginBottom: 24, 
    alignItems: 'center' 
  },
  headerCard: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoWrap: {
    marginBottom: 16,
    borderRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    backgroundColor: 'white',
    padding: 2
  },
  siteLogo: { 
    width: 68, 
    height: 68, 
    borderRadius: 34 
  },
  siteLogoFallback: {
    width: 68, 
    height: 68, 
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary
  },
  siteName: { 
    fontSize: 24, 
    fontFamily: 'Inter_900Black', 
    color: '#0F172A',
    textAlign: 'center'
  },
  welcomeText: { 
    fontSize: 12, 
    fontFamily: 'Inter_800ExtraBold', 
    color: Colors.primary, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    marginTop: 6 
  },
  errorText: { 
    fontSize: 20, 
    fontFamily: 'Inter_800ExtraBold', 
    color: '#1E293B', 
    marginTop: 20 
  },
  errorSub: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center'
  },
  checkCard: { 
    padding: 32, 
    alignItems: 'center', 
    textAlign: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pulseContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseCenter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 10,
    elevation: 4
  },
  checkTitle: { 
    fontSize: 20, 
    fontFamily: 'Inter_800ExtraBold', 
    color: '#0F172A', 
    marginBottom: 10,
    textAlign: 'center'
  },
  checkSub: { 
    fontSize: 14, 
    fontFamily: 'Inter_500Medium', 
    color: '#64748B', 
    textAlign: 'center', 
    marginBottom: 32, 
    lineHeight: 22 
  },
  verifyBtn: {
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  formWrap: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formGroup: {
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 24,
    marginTop: 8
  },
  sectionLabel: { 
    fontSize: 11, 
    fontFamily: 'Inter_800ExtraBold', 
    color: '#94A3B8', 
    letterSpacing: 2, 
    marginBottom: 16,
    marginLeft: 4
  },
  inputSpacing: {
    marginBottom: 4,
  },
  textArea: { 
    height: 110,
    paddingTop: 16
  },
  catGrid: { 
    flexDirection: 'row', 
    gap: 12 
  },
  catCard: { 
    flex: 1, 
    padding: 16,
    borderRadius: 12, 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  catCardActive: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4
  },
  catIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  catTitle: { 
    fontSize: 15, 
    fontFamily: 'Inter_800ExtraBold', 
    color: '#334155',
    marginBottom: 4
  },
  catDesc: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    textAlign: 'center'
  },
  catTextActive: { 
    color: 'white' 
  },
  buttonRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 12 
  },
  progressContainer: { 
    marginBottom: 24 
  },
  progressTrack: { 
    width: '100%', 
    height: 6, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 3, 
    overflow: 'hidden', 
    marginBottom: 8 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: Colors.primary, 
    borderRadius: 3 
  },
  progressText: { 
    fontSize: 12, 
    fontFamily: 'Inter_600SemiBold', 
    color: '#94A3B8', 
    textAlign: 'right' 
  },
  stepHint: { 
    fontSize: 13, 
    fontFamily: 'Inter_500Medium', 
    color: '#64748B', 
    marginBottom: 16 
  },
  submitWrap: {
    marginTop: 12
  },
  submitHint: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    marginTop: 16
  },
  successIconWrap: { 
    marginBottom: 32,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8
  },
  successIconGradient: {
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  successTitle: { 
    fontSize: 32, 
    fontFamily: 'Inter_900Black', 
    color: '#0F172A', 
    marginBottom: 16,
    textAlign: 'center'
  },
  successSub: { 
    fontSize: 16, 
    fontFamily: 'Inter_500Medium', 
    color: '#475569', 
    textAlign: 'center', 
    lineHeight: 26,
    paddingHorizontal: 20
  },
  footerBrandSuccess: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center'
  },
  footer: { 
    marginTop: 32, 
    alignItems: 'center',
    marginBottom: 20 
  },
  footerText: { 
    fontSize: 12, 
    fontFamily: 'Inter_600SemiBold', 
    color: '#CBD5E1' 
  }
});

