import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
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
  Pressable
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { SoftCard } from "@/components/SoftCard";
import { SoftButton } from "@/components/SoftButton";
import { SoftInput } from "@/components/SoftInput";
import { supabase } from "@/lib/supabase";
import { NotificationManager } from "@/services/notification.manager";

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

export default function AnonymousComplaintScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  
  const [site, setSite] = useState<any>(null);
  const [loadingSite, setLoadingSite] = useState(true);
  const [locationPerm, setLocationPerm] = useState<boolean | null>(null);
  const [isInside, setIsInside] = useState<boolean | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  
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
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPerm(status === 'granted');
      
      if (status !== 'granted') {
        setCheckingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;

      if (site?.latitude && site?.longitude) {
        const distance = getDistance(latitude, longitude, site.latitude, site.longitude);
        const radius = site.radius_meters || 500;
        setIsInside(distance <= radius);
      } else {
        // If site has no coordinates, allow but warn
        setIsInside(true);
      }
    } catch (err) {
      console.error("Location error:", err);
      Alert.alert("Location Error", "Could not verify your location. Please ensure GPS is on.");
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !description) {
      Alert.alert("Missing Fields", "Please enter your name and some details about the issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('complaints').insert([{
        site_id: id,
        company_id: site.company_id,
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
      
      // Notify staff
      try {
        await NotificationManager.notifyNewComplaint({
          id: site.id + '_anon_' + Date.now(), // Minimal placeholder for notify logic
          company_id: site.company_id,
          site_id: id,
          priority: 'medium',
          is_anonymous: true,
          category: category
        }, site.name);
      } catch (notifErr) { console.warn("Notification failed:", notifErr); }

      setSubmitted(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
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
      <View style={styles.center}>
        <Feather name="alert-triangle" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>Invalid Site QR Code</Text>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={[styles.center, { padding: 40 }]}>
        <View style={styles.successIcon}>
          <Feather name="check" size={40} color="white" />
        </View>
        <Text style={styles.successTitle}>Alert Dispatched!</Text>
        <Text style={styles.successSub}>
          Thank you. Your report has been sent **directly to the site supervisor** at {site.name}. 
          Our staff will arrive at your location shortly to resolve the issue.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            {site.logo_url ? (
              <Image source={{ uri: site.logo_url }} style={styles.siteLogo} />
            ) : (
              <Feather name="map-pin" size={24} color={Colors.primary} />
            )}
          </View>
          <Text style={styles.siteName}>{site.name}</Text>
          <Text style={styles.welcomeText}>Quick Response Desk</Text>
        </View>

        {isInside === null ? (
          <SoftCard style={styles.checkCard}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <Feather name="navigation" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.checkTitle}>Are you at {site.name}?</Text>
            <Text style={styles.checkSub}> To ensure a supervisor is dispatched to the correct location, we need to verify your proximity to this site.</Text>
            <SoftButton 
              title={checkingLocation ? "Verifying..." : "Confirm My Location"} 
              onPress={verifyLocation}
              loading={checkingLocation}
              variant="primary"
              style={{ width: '100%' }}
            />
          </SoftCard>
        ) : isInside === false ? (
          <SoftCard style={[styles.checkCard, { borderColor: Colors.danger }]}>
            <Feather name="map" size={32} color={Colors.danger} style={{ marginBottom: 12 }} />
            <Text style={styles.checkTitle}>Out of Range</Text>
            <Text style={styles.checkSub}>This QR portal only works when you are physically within the {site.name} premises.</Text>
            <SoftButton title="Try Again" onPress={verifyLocation} variant="outline" />
          </SoftCard>
        ) : (
          <View style={styles.form}>
            <Text style={styles.sectionLabel}>YOUR DETAILS</Text>
            <SoftInput
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.sectionLabel}>LOCATION DETAILS</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <SoftInput
                  placeholder="Floor (e.g. 4)"
                  value={floor}
                  onChangeText={setFloor}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <SoftInput
                  placeholder="Room / Area"
                  value={room}
                  onChangeText={setRoom}
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>ISSUE CATEGORY</Text>
            <View style={styles.catGrid}>
              <Pressable 
                style={[styles.catItem, category === 'Cleaning' && styles.catActive]}
                onPress={() => setCategory('Cleaning')}
              >
                <Feather name="wind" size={20} color={category === 'Cleaning' ? 'white' : Colors.textMuted} />
                <Text style={[styles.catText, category === 'Cleaning' && styles.catTextActive]}>Cleaning</Text>
              </Pressable>
              <Pressable 
                style={[styles.catItem, category === 'Misbehave' && styles.catActive]}
                onPress={() => setCategory('Misbehave')}
              >
                <Feather name="user-x" size={20} color={category === 'Misbehave' ? 'white' : Colors.textMuted} />
                <Text style={[styles.catText, category === 'Misbehave' && styles.catTextActive]}>Behavior</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <SoftInput
              placeholder={category === 'Cleaning' ? "Describe what needs cleaning..." : "Details of the incident..."}
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ height: 100 }}
            />

            <SoftButton 
              title={isSubmitting ? "Submitting..." : "Submit Complaint"} 
              onPress={handleSubmit}
              loading={isSubmitting}
              variant="primary"
              style={{ marginTop: 20 }}
            />
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by GMS Facility Management</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFB' },
  scroll: { padding: 24, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFB' },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 16 },
  siteLogo: { width: 48, height: 48, borderRadius: 24 },
  siteName: { fontSize: 22, fontFamily: 'Inter_900Black', color: '#111827' },
  welcomeText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  errorText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#EF4444', marginTop: 12 },
  checkCard: { padding: 32, alignItems: 'center', textAlign: 'center' },
  checkTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#111827', marginBottom: 8 },
  checkSub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  form: { gap: 16 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 1.5, marginTop: 8 },
  catGrid: { flexDirection: 'row', gap: 12 },
  catItem: { flex: 1, height: 50, borderRadius: 16, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  catActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#4B5563' },
  catTextActive: { color: 'white' },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827', marginBottom: 12 },
  successSub: { fontSize: 15, fontFamily: 'Inter_500Medium', color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#9CA3AF' }
});
