import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert,
  ActivityIndicator, Animated, Easing,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────
// PUBLIC PORTAL MAIN PAGE
// The user scans a QR code and lands here.
// One tap raises the complaint and redirects to the Waiting page.
// 15-minute rate limit is enforced between submissions.
// ─────────────────────────────────────────────────────────────

const RATE_LIMIT_MINUTES = 15;

export default function PublicPortalMainPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [site, setSite]                           = useState<any>(null);
  const [siteError, setSiteError]                 = useState<string | false>(false);
  const [loading, setLoading]                     = useState(true);
  const [submitting, setSubmitting]               = useState(false);
  const [portalSession, setPortalSession]         = useState('');
  const [rateLimitLeft, setRateLimitLeft]         = useState<number | null>(null); // minutes remaining
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number | null>(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!id || !loading) return;
    (async () => {
      // Load site
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        // Network / RLS / server error — let user retry, don't blame QR code
        console.error('[Portal] Site load error:', error.message);
        setSiteError('network');
        setLoading(false);
        return;
      }
      if (!data) {
        // Query succeeded but no row matched → genuinely invalid QR
        setSiteError('invalid');
        setLoading(false);
        return;
      }
      setSite(data);

      // Check for active complaint
      const activeId = await AsyncStorage.getItem(`GMS_ACTIVE_COMP_SITE_${id}`);
      if (activeId) {
        setActiveComplaintId(activeId);
      }

      // Session ID
      let sess = await AsyncStorage.getItem('GMS_PORTAL_SESSION_ID');
      if (!sess) {
        sess = `GMS-${Math.random().toString(36).substr(2, 5).toUpperCase()}-${Date.now().toString().slice(-4)}`;
        await AsyncStorage.setItem('GMS_PORTAL_SESSION_ID', sess);
      }
      setPortalSession(sess);

      // Rate limit
      const lastTs = await AsyncStorage.getItem(`GMS_LAST_SUB_${id}`);
      if (lastTs) {
        const ts      = parseInt(lastTs);
        const elapsed = (Date.now() - ts) / 1000 / 60;
        setLastSubmissionTime(ts);
        if (elapsed < RATE_LIMIT_MINUTES) {
          setRateLimitLeft(Math.ceil(RATE_LIMIT_MINUTES - elapsed));
        }
      }

      setLoading(false);
    })();
  }, [id, loading]);

  // Countdown tick for rate limit
  useEffect(() => {
    if (!rateLimitLeft || rateLimitLeft <= 0) return;
    const t = setTimeout(() => setRateLimitLeft(r => (r && r > 1 ? r - 1 : null)), 60000);
    return () => clearTimeout(t);
  }, [rateLimitLeft]);

  const handleRaiseComplaint = async () => {
    if (rateLimitLeft) {
      Alert.alert('Limit Active', `Please wait ${rateLimitLeft} more minute${rateLimitLeft > 1 ? 's' : ''} before raising another complaint.`);
      return;
    }
    if (!site) { Alert.alert('Error', 'Site not loaded yet. Please wait.'); return; }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .insert([{
          site_id:       id,
          company_id:    site.company_id,
          category:      'General',
          description:   'Complaint raised via public portal',
          status:        'pending',
          is_anonymous:  true,
          anonymous_name:'Portal Visitor',
          priority:      'medium',
          current_phase: 'reported',
          session_id:    portalSession,
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
              if (activeId) router.replace(`/public/waiting/${activeId}`);
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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

        {/* Site badge */}
        <View style={styles.siteBadge}>
          <Feather name="map-pin" size={12} color={Colors.primary} />
          <Text style={styles.siteBadgeText} numberOfLines={1}>{site?.name}</Text>
        </View>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <Feather name="alert-circle" size={38} color={Colors.primary} />
        </View>

        <Text style={styles.cardTitle}>Report a Complaint</Text>
        <Text style={styles.cardSub}>
          Tap below to register your complaint at this facility. A supervisor will be assigned shortly.
        </Text>

        {/* Session pill */}
        <View style={styles.sessionRow}>
          <Feather name="shield" size={12} color="#94A3B8" />
          <Text style={styles.sessionText}>Session: {portalSession || '—'}</Text>
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleRaiseComplaint}
          disabled={submitting}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.8 }]}
        >
          {submitting
            ? <ActivityIndicator color="white" />
            : <>
                <Text style={styles.ctaText}>RAISE COMPLAINT</Text>
                <Feather name="send" size={18} color="white" />
              </>
          }
        </Pressable>


        <Text style={styles.footerNote}>
          <Feather name="lock" size={10} color="#CBD5E1" /> Secured · 15-min limit per submission
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F8FAFC' },

  loadingText: { marginTop: 14, fontSize: 14, color: '#64748B', fontFamily: 'Inter_500Medium' },
  errorTitle:  { fontSize: 20, fontFamily: 'Inter_900Black', color: '#0F172A', marginTop: 20, textAlign: 'center' },
  errorSub:    { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 22 },

  card: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 6,
  },

  siteBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, marginBottom: 24,
  },
  siteBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Colors.primary },

  iconWrap: {
    width: 84, height: 84, borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },

  cardTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#0F172A', textAlign: 'center', marginBottom: 10 },
  cardSub:   { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },

  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 28 },
  sessionText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#94A3B8', letterSpacing: 0.3 },

  cta: {
    backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    paddingVertical: 18, paddingHorizontal: 36,
    borderRadius: 20, width: '100%', marginBottom: 20,
  },
  ctaText: { color: 'white', fontSize: 16, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },

  secondaryAction: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary,
    marginTop: 8,
  },
  secondaryActionText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary },

  retryBtn: { marginTop: 24, backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 16 },
  retryBtnText: { color: 'white', fontSize: 14, fontFamily: 'Inter_800ExtraBold' },

  footerNote: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#CBD5E1', textAlign: 'center' },
});
