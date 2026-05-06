import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

export default function PortalPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [siteError, setSiteError] = useState<string | boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitLeft, setRateLimitLeft] = useState<number | null>(null);
  const [portalSession, setPortalSession] = useState(Math.random().toString(36).substring(7));
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    fetchSiteDetails();
    checkRateLimit();
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();
  }, [id]);

  const fetchSiteDetails = async () => {
    try {
      const { data, error } = await supabase.from('sites').select('*').eq('id', id).single();
      if (error) throw error;
      setSite(data);
    } catch (err) {
      setSiteError(true);
    } finally {
      setLoading(false);
    }
  };

  const checkRateLimit = async () => {
    try {
      const lastSub = await AsyncStorage.getItem(`GMS_LAST_SUB_${id}`);
      const activeId = await AsyncStorage.getItem(`GMS_ACTIVE_COMP_SITE_${id}`);
      if (activeId) setActiveComplaintId(activeId);

      if (lastSub) {
        const diff = Date.now() - parseInt(lastSub);
        const minsLeft = 15 - Math.floor(diff / 60000);
        if (minsLeft > 0) setRateLimitLeft(minsLeft);
      }
    } catch (e) {}
  };

  const [category, setCategory] = useState<"Cleaning" | "Misbehave">("Cleaning");
  const [description, setDescription] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [image, setImage] = useState<string | null>(null);

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

  const handleRaiseComplaint = async () => {
    if (rateLimitLeft) {
      Alert.alert('Limit Active', `Please wait ${rateLimitLeft} more minute${rateLimitLeft > 1 ? 's' : ''} before raising another complaint.`);
      return;
    }
    if (!site) { Alert.alert('Error', 'Site not loaded yet. Please wait.'); return; }
    if (!description) { Alert.alert("Missing Fields", "Please enter the issue details."); return; }

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (image) {
        const fileName = `public/${id}_${Date.now()}.jpg`;
        const response = await fetch(image);
        const blob = await response.blob();
        const { data, error: uploadErr } = await supabase.storage.from('complaints').upload(fileName, blob);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('complaints').getPublicUrl(data.path);
        imageUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          site_id:       id,
          company_id:    site.company_id,
          category:      category,
          description:   `${description}\nFloor: ${floor}, Room: ${room}`,
          status:        'pending',
          is_anonymous:  true,
          anonymous_name: 'Portal Visitor',
          priority:      'medium',
          current_phase: 'reported',
          session_id:    portalSession,
          before_media_url: imageUrl,
          phase_history: [{ phase: 'reported', timestamp: new Date().toISOString() }],
        }])
        .select()
        .single();

      if (error) throw error;

      await AsyncStorage.setItem(`GMS_ACTIVE_COMP_SITE_${id}`, data.id);
      await AsyncStorage.setItem(`GMS_LAST_SUB_${id}`, Date.now().toString());
      router.replace(`/public/waiting/${data.id}`);
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Could not submit. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────── LOADING ───────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading facility...</Text>
      </View>
    );
  }

  // ─────────────────── ERROR SCREEN ───────────────────
  if (siteError) {
    const isNetworkErr = siteError === 'network';
    return (
      <View style={styles.center}>
        <Feather
          name={isNetworkErr ? 'wifi-off' : 'alert-triangle'}
          size={48}
          color={isNetworkErr ? '#F59E0B' : Colors.danger}
        />
        <Text style={styles.errorTitle}>
          {isNetworkErr ? 'Connection Problem' : 'Invalid QR Code'}
        </Text>
        <Text style={styles.errorSub}>
          {isNetworkErr
            ? 'Could not connect to the server. Check your internet connection and try again.'
            : "This QR code doesn't link to a valid facility. Please ask staff for the correct QR code."}
        </Text>
        {isNetworkErr && (
          <Pressable
            style={styles.retryBtn}
            onPress={() => { setSiteError(false); setLoading(true); }}
          >
            <Text style={styles.retryBtnText}>RETRY</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // ─────────────────── RATE LIMITED ───────────────────
  if (rateLimitLeft) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: '#FFFBEB' }]}>
            <Feather name="clock" size={34} color="#F59E0B" />
          </View>
          <Text style={styles.cardTitle}>Complaint Already Submitted</Text>
          <Text style={styles.cardSub}>
            You can raise another complaint in{'\n'}
            <Text style={{ color: Colors.primary, fontFamily: 'Inter_800ExtraBold', fontSize: 20 }}>
              {rateLimitLeft} min
            </Text>
          </Text>
          <Pressable
            style={styles.secondaryAction}
            onPress={async () => {
              const activeId = await AsyncStorage.getItem(`GMS_ACTIVE_COMP_SITE_${id}`);
              if (activeId) router.replace(`/public/tracker/${activeId}`);
            }}
          >
            <Text style={styles.secondaryActionText}>CHECK STATUS</Text>
            <Feather name="arrow-right" size={14} color={Colors.primary} />
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ─────────────────── MAIN PORTAL PAGE ───────────────────
  return (
    <View style={[styles.root, { backgroundColor: '#F8FAFC' }]}>
       <ScrollView contentContainerStyle={{ paddingBottom: 60, width: '100%' }} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.logoBox}>
               <Feather name="box" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>GMS Public Portal</Text>
          </View>

          <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.siteBadge}>
              <Feather name="map-pin" size={12} color={Colors.primary} />
              <Text style={styles.siteBadgeText} numberOfLines={1}>{site?.name}</Text>
            </View>

            <Text style={styles.cardTitle}>Report a Complaint</Text>
            <Text style={styles.cardSub}>Please provide details about the issue for quick resolution.</Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>CATEGORY</Text>
              <View style={styles.catGrid}>
                <Pressable 
                  style={[styles.catChip, category === 'Cleaning' && styles.catChipActive]}
                  onPress={() => setCategory('Cleaning')}
                >
                  <Feather name="wind" size={14} color={category === 'Cleaning' ? 'white' : '#64748B'} />
                  <Text style={[styles.catChipText, category === 'Cleaning' && { color: 'white' }]}>Cleaning</Text>
                </Pressable>
                <Pressable 
                  style={[styles.catChip, category === 'Misbehave' && styles.catChipActive]}
                  onPress={() => setCategory('Misbehave')}
                >
                  <Feather name="shield" size={14} color={category === 'Misbehave' ? 'white' : '#64748B'} />
                  <Text style={[styles.catChipText, category === 'Misbehave' && { color: 'white' }]}>Behavior</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>DETAILS</Text>
              <TextInput 
                placeholder="Describe the issue..." 
                value={description} 
                onChangeText={setDescription}
                multiline
                style={styles.textArea}
                placeholderTextColor="#94A3B8"
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>FLOOR</Text>
                  <TextInput 
                    placeholder="e.g. 4" 
                    value={floor} 
                    onChangeText={setFloor}
                    style={styles.input}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>ROOM/AREA</Text>
                  <TextInput 
                    placeholder="e.g. 402" 
                    value={room} 
                    onChangeText={setRoom}
                    style={styles.input}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>PHOTO (OPTIONAL)</Text>
              <Pressable onPress={pickImage} style={styles.imagePicker}>
                {image ? (
                  <Animated.Image entering={FadeIn} source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Feather name="camera" size={20} color={Colors.primary} />
                    <Text style={styles.imagePickerText}>Take/Upload Photo</Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={handleRaiseComplaint}
                disabled={submitting}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}
              >
                {submitting
                  ? <ActivityIndicator color="white" />
                  : <>
                      <Text style={styles.ctaText}>SUBMIT COMPLAINT</Text>
                      <Feather name="send" size={18} color="white" />
                    </>
                }
              </Pressable>
              
              {activeComplaintId && (
                <Pressable onPress={() => router.replace(`/public/waiting/${activeComplaintId}`)} style={styles.activePill}>
                  <Text style={styles.activePillText}>View Active Tracker →</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.footerNote}>
              <Feather name="lock" size={10} color="#CBD5E1" /> Secured · Session ID: {portalSession.split('-')[1]}
            </Text>
          </Animated.View>
       </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F8FAFC' },

  header: { alignItems: 'center', marginBottom: 20, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  logoBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#0F172A' },

  loadingText: { marginTop: 14, fontSize: 14, color: '#64748B', fontFamily: 'Inter_500Medium' },
  errorTitle:  { fontSize: 20, fontFamily: 'Inter_900Black', color: '#0F172A', marginTop: 20, textAlign: 'center' },
  errorSub:    { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 22 },

  formContainer: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24,
    width: '90%',
    maxWidth: 450,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 6,
  },

  siteBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 16, alignSelf: 'center'
  },
  siteBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.primary },

  cardTitle: { fontSize: 22, fontFamily: 'Inter_900Black', color: '#0F172A', textAlign: 'center', marginBottom: 6 },
  cardSub:   { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 24 },

  formGroup: { gap: 16 },
  inputLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 1 },
  catGrid: { flexDirection: 'row', gap: 10 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderHeight: 1, borderColor: '#E2E8F0', borderWidth: 1, backgroundColor: '#F8FAFC' },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#64748B' },

  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, fontSize: 14, fontFamily: 'Inter_500Medium', color: '#0F172A', borderHeight: 1, borderColor: '#E2E8F0', borderWidth: 1 },
  textArea: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, fontSize: 14, fontFamily: 'Inter_500Medium', color: '#0F172A', borderHeight: 1, borderColor: '#E2E8F0', borderWidth: 1, height: 80, textAlignVertical: 'top' },

  imagePicker: { height: 50, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  imagePickerText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary },
  previewImage: { width: '100%', height: '100%', borderRadius: 12 },

  cta: {
    backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    paddingVertical: 16, borderRadius: 16, marginTop: 8,
  },
  ctaText: { color: 'white', fontSize: 14, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },

  activePill: { alignSelf: 'center', marginTop: 8 },
  activePillText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary, textDecorationLine: 'underline' },

  iconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  secondaryAction: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, marginTop: 8 },
  secondaryActionText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary },
  retryBtn: { marginTop: 24, backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 },
  retryBtnText: { color: 'white', fontSize: 14, fontFamily: 'Inter_800ExtraBold' },
  footerNote: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#CBD5E1', textAlign: 'center', marginTop: 10 },
});
