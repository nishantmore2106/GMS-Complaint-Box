import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Pressable,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Reanimated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { SoftButton } from '@/components/SoftButton';
import { SoftCard } from '@/components/SoftCard';

const { width } = Dimensions.get('window');

export default function PublicWaitingPage() {
  const { id: complaintId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [complaint, setComplaint] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [dotCount, setDotCount] = useState(1);

  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotCount(d => (d >= 3 ? 1 : d + 1));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const checkAndRedirect = (data: any) => {
    if (!data) return;
    const phase = (data.current_phase || 'reported').toLowerCase();
    const status = (data.status || 'pending').toLowerCase();
    const supervisorStarted = status !== 'pending' || !['reported', 'pending'].includes(phase);

    if (supervisorStarted) {
      router.replace(`/public/tracker/${data.id}`);
    }
  };

  useEffect(() => {
    if (!complaintId) return;

    async function loadComplaint() {
      const { data, error } = await supabase
        .from('complaints')
        .select('id, status, current_phase, session_id, category')
        .eq('id', complaintId)
        .single();

      if (data) {
        setComplaint(data);
        setSessionId(data.session_id || '');
        checkAndRedirect(data);
      }
    }

    loadComplaint();

    const channel = supabase
      .channel(`waiting-${complaintId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'complaints', filter: `id=eq.${complaintId}` },
        (payload) => {
          setComplaint(payload.new);
          checkAndRedirect(payload.new);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [complaintId]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.root, { backgroundColor: '#060D1F' }]}>
      <LinearGradient colors={['#060D1F', '#1A3A6B']} style={StyleSheet.absoluteFill} />
      
      <Reanimated.View entering={FadeIn.duration(800)} style={styles.container}>
        <View style={styles.loaderBox}>
          <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]}>
            <LinearGradient colors={['#4F46E5', 'transparent']} style={styles.gradientRing} />
          </Animated.View>
          <BlurView intensity={20} style={styles.innerCircle}>
            <Feather name="shield" size={40} color="white" />
          </BlurView>
        </View>

        <Text style={styles.title}>Securely Logged</Text>
        <Text style={styles.subtitle}>Connecting with on-site supervisor{'.'.repeat(dotCount)}</Text>

        <SoftCard variant="glass" style={styles.statusCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Feather name="check-circle" size={16} color="#10B981" /></View>
            <Text style={styles.infoText}>Your requisition has been dispatched to the facility team.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.iconBox}><Feather name="zap" size={16} color="#4F46E5" /></View>
            <Text style={styles.infoText}>Real-time tracking will activate as soon as inspection begins.</Text>
          </View>
        </SoftCard>

        {sessionId ? (
          <Reanimated.View entering={SlideInDown.delay(400)} style={styles.sessionArea}>
            <Text style={styles.sessionLabel}>TRANSACTION TOKEN</Text>
            <Text style={styles.sessionId}>{sessionId}</Text>
          </Reanimated.View>
        ) : null}

        <Reanimated.View entering={SlideInDown.delay(600)} style={styles.actionArea}>
          <SoftButton 
            title="View Active Tracker" 
            variant="glass"
            onPress={() => router.push(`/public/tracker/${complaintId}`)}
            style={styles.detailsBtn}
          />
          <Text style={styles.hint}>You can monitor details even while waiting</Text>
        </Reanimated.View>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { width: '100%', padding: 32, alignItems: 'center' },
  
  loaderBox: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  ring: { position: 'absolute', width: 140, height: 140, borderRadius: 70, overflow: 'hidden' },
  gradientRing: { flex: 1, borderRadius: 70, borderWidth: 4, borderColor: 'transparent', borderTopColor: '#4F46E5', borderRightColor: '#4F46E5' },
  innerCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  title: { fontSize: 32, fontWeight: '900', color: 'white', textAlign: 'center', marginBottom: 12, letterSpacing: -1 },
  subtitle: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 40 },

  statusCard: { width: '100%', padding: 24, gap: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  infoText: { flex: 1, fontSize: 14, fontWeight: '500', color: 'white', lineHeight: 22 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 },

  sessionArea: { marginTop: 32, alignItems: 'center' },
  sessionLabel: { fontSize: 10, fontWeight: '900', color: '#93C5FD', letterSpacing: 2, marginBottom: 8 },
  sessionId: { fontSize: 24, fontWeight: '900', color: 'white', letterSpacing: 4 },

  actionArea: { marginTop: 48, width: '100%', alignItems: 'center' },
  detailsBtn: { width: '100%', height: 64, borderRadius: 32 },
  hint: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginTop: 16 },
});
