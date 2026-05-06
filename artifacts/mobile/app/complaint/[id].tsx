import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Animated,
  Modal,
  Share,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Reanimated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftCard } from "@/components/SoftCard";
import { SoftButton } from "@/components/SoftButton";
import { PhaseTracker, ComplaintPhase } from "@/components/PhaseTracker";
import { supabase } from "@/lib/supabase";
import { LocationService } from "@/services/location.service";
import { HapticsService } from "@/utils/haptics";
import { ReportService } from "@/services/report.service";
import * as Location from "expo-location";
import { APP_CONFIG } from "@/constants/config";

const { width } = Dimensions.get('window');

const WORK_TAGS = [
  { id: 'electrical', label: 'Electrical', icon: 'zap' as const },
  { id: 'plumbing', label: 'Plumbing', icon: 'droplet' as const },
  { id: 'carpentry', label: 'Carpentry', icon: 'home' as const },
  { id: 'technical', label: 'Technical', icon: 'settings' as const },
  { id: 'hvac', label: 'HVAC', icon: 'wind' as const },
];

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { isDarkMode, complaints, updateComplaint, updateComplaintPhase, users, sites, isLoading: loading, uploadImage, deleteComplaint, checkProximity, currentUser, fetchData } = useApp();

  const [localSiteData, setLocalSiteData] = useState<any>(null);
  const [localRaisedByData, setLocalRaisedByData] = useState<any>(null);
  const [localAssignedSup, setLocalAssignedSup] = useState<any>(null);

  const complaint = useMemo(() => complaints.find(c => c.id === id), [complaints, id]);
  const siteData = useMemo(() => sites.find(s => s.id === complaint?.siteId) || localSiteData, [sites, complaint?.siteId, localSiteData]);
  const raisedByData = useMemo(() => users.find(u => u.id === complaint?.clientId) || localRaisedByData, [users, complaint?.clientId, localRaisedByData]);
  const assignedSupervisor = useMemo(() => users.find(u => u.id === complaint?.supervisorId) || localAssignedSup, [users, complaint?.supervisorId, localAssignedSup]);

  const [workNotes, setWorkNotes] = useState(complaint?.work_notes || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideUp = useRef(new Animated.Value(50)).current;
  const [activeFullImage, setActiveFullImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<'before' | 'after' | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationVerified, setLocationVerified] = useState<boolean | null>(null);

  useEffect(() => {
    Animated.spring(slideUp, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
  }, []);

  const currentPhaseNormalized = (complaint?.currentPhase || complaint?.current_phase || 'reported').toLowerCase();

  const isActiveSession = useMemo(() => {
    if (!complaint) return false;
    const status = complaint.status;
    const isStarted = !!complaint.startedAt || !!complaint.started_at;
    const isNotResolved = !complaint.resolvedAt && !complaint.resolved_at && status !== 'resolved';
    return isStarted && isNotResolved && (status === 'in_progress' || ['arrived', 'checking_issue', 'solving'].includes(currentPhaseNormalized));
  }, [complaint, currentPhaseNormalized]);

  useEffect(() => {
    let interval: any;
    const updateElapsed = () => {
      const startTime = complaint?.startedAt || complaint?.started_at;
      const endTime = complaint?.resolvedAt || complaint?.resolved_at;
      if (!startTime) { setElapsedSeconds(0); return; }
      const start = new Date(startTime).getTime();
      const end = endTime ? new Date(endTime).getTime() : Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((end - start) / 1000)));
    };
    updateElapsed();
    if (isActiveSession) {
      interval = setInterval(updateElapsed, 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActiveSession, complaint?.startedAt, complaint?.started_at, complaint?.resolvedAt, complaint?.resolved_at]);

  const [showExitWarning, setShowExitWarning] = useState(false);
  useEffect(() => {
    let watchId: any;
    if (isActiveSession && siteData?.latitude && siteData?.longitude) {
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (loc) => {
          const dist = LocationService.getDistance(
            { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            { latitude: siteData.latitude, longitude: siteData.longitude }
          );
          if (dist > 250) {
             if (!showExitWarning) { setShowExitWarning(true); HapticsService.warning(); }
          } else { setShowExitWarning(false); }
        }
      ).then(sub => watchId = sub);
    }
    return () => watchId?.remove();
  }, [isActiveSession, siteData]);

  if (!complaint) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={48} color={Colors.textMuted} />
        <Text style={styles.notFoundText}>Complaint not found</Text>
        <SoftButton title="Go Back" onPress={() => router.back()} style={{ marginTop: 24 }} />
      </View>
    );
  }

  const currentPhase = complaint.currentPhase || 'reported';
  const role = currentUser?.role;
  const isSupervisor = role === 'supervisor';

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePickImage = async (type: 'before' | 'after') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert("Permission Needed", "Please enable camera access."); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      try {
        setIsUploading(type);
        const localUri = result.assets[0].uri;
        const uploadPath = `${id}_${type}_${Date.now()}.jpg`;
        const publicUrl = await uploadImage(localUri, uploadPath);
        await updateComplaint(complaint.id, type === 'before' ? { beforeMediaUrl: publicUrl } : { afterMediaUrl: publicUrl });
      } catch (err) { Alert.alert("Upload Error", "Failed to save image."); } finally { setIsUploading(null); }
    }
  };

  const handlePhaseTransition = async () => {
    if (!complaint.siteId) return;
    setIsLocating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { isInside, distance } = await checkProximity(complaint.siteId);
    setLocationVerified(isInside);
    setIsLocating(false);
    const isFounder = currentUser?.role === 'founder';
    if (!isInside && !isFounder) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Out of Range", `You are ${Math.round(distance || 0)}m away. Move closer to update task.`);
      return;
    }
    if (!isInside && isFounder) {
      const proceed = await new Promise(resolve => {
        Alert.alert("Admin Override", "Out of range. Bypass?", [
          { text: "Cancel", onPress: () => resolve(false), style: 'cancel' },
          { text: "Override", onPress: () => resolve(true) }
        ]);
      });
      if (!proceed) return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    let next: ComplaintPhase;
    switch(currentPhase) {
      case 'reported': next = 'arrived'; break;
      case 'arrived': next = 'checking_issue'; break;
      case 'checking_issue': next = 'solving'; break;
      case 'solving': next = 'resolved'; break;
      default: return;
    }
    if (currentPhase === 'solving') {
      if (!complaint.afterMediaUrl) { Alert.alert("Missing Photo", "Upload an 'After' photo first."); return; }
      if (!workNotes.trim()) { Alert.alert("Missing Notes", "Describe the solution briefly."); return; }
    }
    await updateComplaintPhase(complaint.id, next);
    if (!complaint.supervisorId && currentUser?.role === 'supervisor') {
      await updateComplaint(complaint.id, { supervisorId: currentUser.id } as any);
    }
    await fetchData({ forceSync: true });
    if (next === 'resolved') { router.back(); }
  };

  const triggerExternalShare = async () => {
    try {
      const duration = elapsedSeconds > 0 ? formatTime(elapsedSeconds) : 'Not started';
      const message = `📋 GMS REPORT\nID: ${complaint.id.substring(0, 8).toUpperCase()}\nSITE: ${complaint.siteName}\nCAT: ${complaint.category}\nSTATUS: ${complaint.status.replace('_', ' ').toUpperCase()}\n⏱️ DURATION: ${duration}\n\nShared via GMS Complaint Box`;
      await Share.share({ message, title: "Complaint Report" });
    } catch (error: any) { Alert.alert("Share Error", "Could not share report."); }
  };

  return (
    <View style={[styles.root, isDarkMode && { backgroundColor: Colors.dark.bg }]}>
      {/* ── PREMIUM HERO ── */}
      <View style={styles.heroContainer}>
        <LinearGradient
          colors={isDarkMode ? ['#0F172A', '#1E293B'] : ['#060D1F', '#1A3A6B']}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.glassBtn}>
              <Feather name="arrow-left" size={20} color="white" />
            </Pressable>
            <Text style={styles.heroTitle}>Complaint Insight</Text>
            <Pressable onPress={() => fetchData({ forceSync: true })} style={styles.glassBtn}>
              <Feather name="refresh-cw" size={18} color="white" />
            </Pressable>
          </View>

          {(isActiveSession || complaint.status === 'resolved') ? (
            <View style={styles.timerBlock}>
              <View style={styles.timerBadge}>
                <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.timerLabel}>{complaint.status === 'resolved' ? 'RESOLUTION TIME' : 'ACTIVE SESSION'}</Text>
              </View>
              <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
              {isActiveSession && (
                <View style={styles.gpsVerify}>
                  <Feather name={locationVerified ? "shield" : "crosshair"} size={10} color={locationVerified ? "#4ADE80" : "rgba(255,255,255,0.4)"} />
                  <Text style={[styles.gpsText, locationVerified && { color: '#4ADE80' }]}>
                    {isLocating ? "Locating..." : (locationVerified ? "Presence Verified" : "Location Untrusted")}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.staticHero}>
              <View style={styles.statusGlass}>
                <Text style={styles.statusGlassText}>{complaint.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.heroMainText}>{complaint.category}</Text>
              <Text style={styles.heroSubText}>{siteData?.name || complaint.siteName} • #{complaint.id.substring(0,6).toUpperCase()}</Text>
            </View>
          )}

          <BlurView intensity={20} style={styles.infoBar}>
            <View style={styles.infoBarItem}>
              <Feather name="map-pin" size={12} color="#93C5FD" />
              <Text style={styles.infoBarText} numberOfLines={1}>{siteData?.name || complaint.siteName}</Text>
            </View>
            <View style={styles.infoBarDivider} />
            <View style={styles.infoBarItem}>
              <Feather name="alert-triangle" size={12} color="#93C5FD" />
              <Text style={styles.infoBarText}>{complaint.priority.toUpperCase()}</Text>
            </View>
          </BlurView>
        </LinearGradient>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 140 }]}
      >
        <Reanimated.View entering={FadeIn.duration(600)}>
          {/* ── RESOLUTION WIZARD ── */}
          {isSupervisor && complaint.status !== 'resolved' && (
            <SoftCard variant="glass" style={styles.premiumCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>RESOLUTION PIPELINE</Text>
                <Text style={styles.stepCount}>Step {(['arrived', 'checking_issue', 'solving'].indexOf(currentPhase as any) + 1) || 0} of 3</Text>
              </View>
              <View style={styles.wizardSteps}>
                {['arrived', 'checking_issue', 'solving'].map((p, idx) => {
                  const flow = ['arrived', 'checking_issue', 'solving'];
                  const currentIndex = flow.indexOf(currentPhase as any);
                  const isDone = currentIndex > idx;
                  const isCurrent = currentPhase === p;
                  return (
                    <React.Fragment key={p}>
                      <View style={styles.wizStep}>
                        <View style={[styles.wizDot, isCurrent && styles.wizCurrent, isDone && styles.wizDone]}>
                          {isDone ? <Feather name="check" size={12} color="white" /> : <Text style={[styles.wizNum, isCurrent && {color: 'white'}]}>{idx+1}</Text>}
                        </View>
                        <Text style={[styles.wizLabel, isCurrent && styles.wizLabelActive]}>{p === 'arrived' ? 'Arrive' : p === 'checking_issue' ? 'Inspect' : 'Solve'}</Text>
                      </View>
                      {idx < 2 && <View style={[styles.wizLine, isDone && styles.wizLineDone]} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </SoftCard>
          )}

          {/* ── WORK NOTES ── */}
          {isSupervisor && currentPhase !== 'reported' && (
            <SoftCard style={styles.premiumCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}><Feather name="edit-3" size={15} color="#7C3AED" /></View>
                <Text style={styles.cardTitle}>Technical Field Report</Text>
              </View>
              <TextInput
                style={[styles.premiumInput, isDarkMode && styles.darkInput]}
                placeholder="Describe issue findings and fix..."
                placeholderTextColor={isDarkMode ? '#475569' : '#9CA3AF'}
                multiline
                value={workNotes}
                onChangeText={setWorkNotes}
                onBlur={() => updateComplaint(complaint.id, { work_notes: workNotes } as any)}
                editable={complaint.status !== 'resolved'}
              />
              <Text style={styles.subLabel}>WORK CATEGORIES</Text>
              <View style={styles.tagGrid}>
                {WORK_TAGS.map(tag => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <Pressable key={tag.id} style={[styles.tag, active && styles.tagActive, isDarkMode && !active && styles.tagDark]} onPress={() => toggleTag(tag.id)}>
                      <Feather name={tag.icon} size={12} color={active ? 'white' : '#64748B'} />
                      <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </SoftCard>
          )}

          <SoftCard style={styles.premiumCard}>
            <Text style={styles.cardLabel}>VISUAL PROGRESSION</Text>
            <View style={{ marginTop: 20 }}>
              <PhaseTracker 
                currentPhase={complaint.currentPhase || 'reported'} 
                isDarkMode={isDarkMode} 
                history={complaint.phaseHistory || []} 
              />
            </View>
          </SoftCard>

          {/* ── PHOTO EVIDENCE ── */}
          <Text style={styles.sectionLabel}>WORK EVIDENCE</Text>
          <View style={styles.photoGrid}>
            <SoftCard style={styles.photoHalf}>
              <Text style={styles.photoLabel}>BEFORE</Text>
              <Pressable onPress={() => complaint.beforeMediaUrl ? setActiveFullImage(complaint.beforeMediaUrl) : handlePickImage('before')} style={styles.photoBox}>
                {complaint.beforeMediaUrl ? <Image source={{ uri: complaint.beforeMediaUrl }} style={styles.fullImg} /> : (isUploading === 'before' ? <ActivityIndicator color="#4F46E5" /> : <Feather name="plus-circle" size={24} color="#E2E8F0" />)}
              </Pressable>
            </SoftCard>
            <SoftCard style={styles.photoHalf}>
              <Text style={styles.photoLabel}>AFTER</Text>
              <Pressable onPress={() => complaint.afterMediaUrl ? setActiveFullImage(complaint.afterMediaUrl) : handlePickImage('after')} style={styles.photoBox}>
                {complaint.afterMediaUrl ? <Image source={{ uri: complaint.afterMediaUrl }} style={styles.fullImg} /> : (isUploading === 'after' ? <ActivityIndicator color="#4F46E5" /> : <Feather name="plus-circle" size={24} color="#E2E8F0" />)}
              </Pressable>
            </SoftCard>
          </View>

          {/* ── LOCATION & SITE ── */}
          <SoftCard style={styles.premiumCard}>
            <Text style={styles.cardLabel}>FACILITY DETAILS</Text>
            <View style={styles.dataGrid}>
              <View style={styles.dataCol}>
                <View style={styles.dataItem}>
                  <Feather name="map-pin" size={14} color="#10B981" />
                  <View><Text style={styles.dataLabel}>SITE NAME</Text><Text style={styles.dataValue}>{siteData?.name || complaint.siteName}</Text></View>
                </View>
                <View style={styles.dataItem}>
                  <Feather name="phone" size={14} color="#F59E0B" />
                  <View><Text style={styles.dataLabel}>CONTACT</Text><Text style={styles.dataValue}>{siteData?.clientPhone || "—"}</Text></View>
                </View>
              </View>
              <View style={styles.dataCol}>
                <View style={styles.dataItem}>
                  <Feather name="user" size={14} color="#4F46E5" />
                  <View><Text style={styles.dataLabel}>REPORTER</Text><Text style={styles.dataValue}>{raisedByData?.name || complaint.clientName}</Text></View>
                </View>
                <View style={styles.dataItem}>
                  <Feather name="tool" size={14} color="#EF4444" />
                  <View><Text style={styles.dataLabel}>ASSIGNED</Text><Text style={styles.dataValue}>{assignedSupervisor?.name || "Unassigned"}</Text></View>
                </View>
              </View>
            </View>
          </SoftCard>
        </Reanimated.View>
      </ScrollView>

      {/* ── FLOATING ACTION ── */}
      {isSupervisor && complaint.status !== 'resolved' && (
        <BlurView intensity={80} tint={isDarkMode ? 'dark' : 'light'} style={[styles.floatingAction, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={styles.actionBtn} onPress={handlePhaseTransition}>
            <LinearGradient colors={['#4F46E5', '#3730A3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionGradient}>
              <Text style={styles.actionText}>{currentPhase === 'reported' ? 'Start Work Session' : currentPhase === 'arrived' ? 'Next: Inspect Issue' : currentPhase === 'checking_issue' ? 'Next: Solve Issue' : 'Resolve Now'}</Text>
              <Feather name="arrow-right" size={20} color="white" />
            </LinearGradient>
          </Pressable>
        </BlurView>
      )}

      {/* ── FULL IMAGE MODAL ── */}
      <Modal visible={!!activeFullImage} transparent animationType="fade">
        <BlurView intensity={90} tint="dark" style={styles.overlay}>
          <Pressable style={styles.closeBtn} onPress={() => setActiveFullImage(null)}><Feather name="x" size={24} color="white" /></Pressable>
          <Image source={{ uri: activeFullImage! }} style={styles.fullPreview} resizeMode="contain" />
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  notFoundText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  
  heroContainer: { zIndex: 10, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  hero: { paddingHorizontal: 24, paddingBottom: 60 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  
  timerBlock: { alignItems: 'center', marginTop: 24 },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  timerLabel: { color: '#FECACA', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timerText: { fontSize: 64, color: 'white', fontWeight: '900', letterSpacing: -2 },
  gpsVerify: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  gpsText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' },

  staticHero: { alignItems: 'center', marginTop: 24 },
  statusGlass: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  statusGlassText: { color: 'white', fontSize: 10, fontWeight: '900' },
  heroMainText: { color: 'white', fontSize: 36, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  heroSubText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600', marginTop: 8 },

  infoBar: { flexDirection: 'row', height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', position: 'absolute', bottom: 20, left: 24, right: 24, overflow: 'hidden' },
  infoBarItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  infoBarText: { color: 'white', fontSize: 12, fontWeight: '700' },
  infoBarDivider: { width: 1, height: '40%', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  premiumCard: { marginBottom: 20, padding: 24, borderRadius: 32 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2 },
  stepCount: { fontSize: 12, color: '#4F46E5', fontWeight: '800' },

  wizardSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wizStep: { alignItems: 'center', gap: 8, flex: 1 },
  wizDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  wizDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  wizCurrent: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  wizNum: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
  wizLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  wizLabelActive: { color: '#4F46E5' },
  wizLine: { height: 2, flex: 1, backgroundColor: '#F1F5F9', marginTop: -18 },
  wizLineDone: { backgroundColor: '#10B981' },

  iconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', flex: 1 },
  premiumInput: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 20, minHeight: 120, textAlignVertical: 'top', fontSize: 15, fontWeight: '500', color: '#1E293B', borderWidth: 1, borderColor: '#F1F5F9' },
  darkInput: { backgroundColor: '#0F172A', borderColor: '#1E293B', color: 'white' },
  subLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginTop: 24, marginBottom: 12 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9' },
  tagActive: { backgroundColor: '#4F46E5' },
  tagDark: { backgroundColor: '#1E293B' },
  tagText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tagTextActive: { color: 'white' },

  sectionLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 16 },
  photoGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  photoHalf: { flex: 1, padding: 16, borderRadius: 24 },
  photoLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', textAlign: 'center', marginBottom: 12 },
  photoBox: { height: 140, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  fullImg: { width: '100%', height: '100%' },

  dataGrid: { flexDirection: 'row', gap: 20 },
  dataCol: { flex: 1, gap: 20 },
  dataItem: { flexDirection: 'row', gap: 12 },
  dataLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', marginBottom: 2 },
  dataValue: { fontSize: 13, fontWeight: '800', color: '#1E293B' },

  floatingAction: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24 },
  actionBtn: { height: 64, borderRadius: 32, overflow: 'hidden', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  actionGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  actionText: { color: 'white', fontSize: 16, fontWeight: '900' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 60, right: 24, zIndex: 10, padding: 12, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  fullPreview: { width: '100%', height: '80%' },
});
