import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { DashboardHeader } from "@/components/DashboardHeader";
import React, { useState, useMemo, useEffect } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftCard } from "@/components/SoftCard";
import { PhaseTracker, ComplaintPhase } from "@/components/PhaseTracker";
import { supabase } from "@/lib/supabase";
import { NotificationManager } from "@/services/notification.manager";
import { LocationService } from "@/services/location.service";
import { HapticsService } from "@/utils/haptics";
import { ReportService } from "@/services/report.service";
import * as Location from "expo-location";
import { APP_CONFIG } from "@/constants/config";

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
  const { isDarkMode, complaints, updateComplaint, updateComplaintPhase, users, sites, isLoading: loading, getSiteById, getUserById, uploadImage, deleteComplaint, checkProximity, currentUser } = useApp();

  const [localSiteData, setLocalSiteData] = useState<any>(null);
  const [localRaisedByData, setLocalRaisedByData] = useState<any>(null);
  const [localAssignedSup, setLocalAssignedSup] = useState<any>(null);

  const complaint = useMemo(() => complaints.find(c => c.id === id), [complaints, id]);
  
  const siteData = localSiteData || sites.find(s => s.id === complaint?.siteId);
  const raisedByData = localRaisedByData || users.find(u => u.id === complaint?.clientId);
  const assignedSupervisor = localAssignedSup || users.find(u => u.id === complaint?.supervisorId);

  useEffect(() => {
    async function resolveMissingData() {
      if (!complaint) return;
      
      // Auto-resolve Site if missing from global state
      if (complaint.siteId && !sites.find(s => s.id === complaint.siteId) && !localSiteData) {
        const { data } = await supabase.from('sites').select('*').eq('id', complaint.siteId).single();
        if (data) setLocalSiteData({
          ...data,
          logoUrl: data.logo_url,
          phone: data.phone,
          latitude: data.latitude,
          longitude: data.longitude,
          radiusMeters: data.radius_meters
        });
      }

      // Auto-resolve Client if missing from global state
      if (complaint.clientId && !users.find(u => u.id === complaint.clientId) && !localRaisedByData) {
        const { data } = await supabase.from('users').select('*').eq('id', complaint.clientId).single();
        if (data) setLocalRaisedByData({
          ...data,
          companyId: data.company_id,
          hasOnboarded: data.has_onboarded,
          notificationsEnabled: data.notifications_enabled
        });
      }

      // Auto-resolve Supervisor if missing from global state
      if (complaint.supervisorId && !users.find(u => u.id === complaint.supervisorId) && !localAssignedSup) {
        const { data } = await supabase.from('users').select('*').eq('id', complaint.supervisorId).single();
        if (data) setLocalAssignedSup({
          ...data,
          companyId: data.company_id,
          hasOnboarded: data.has_onboarded,
          notificationsEnabled: data.notifications_enabled
        });
      }
    }
    resolveMissingData();
  }, [complaint, sites, users]);
  const role = useApp().currentUser?.role;
  const isSupervisor = role === 'supervisor';

  const [workNotes, setWorkNotes] = useState(complaint?.work_notes || "");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showSharePreview, setShowSharePreview] = useState(false);

  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  const slideUp = useMemo(() => new Animated.Value(50), []);
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
  }, [complaint?.startedAt, complaint?.started_at, complaint?.resolvedAt, complaint?.resolved_at, complaint?.status, currentPhaseNormalized]);

  // GSD Decision: Server-Side Persistent Stopwatch
  useEffect(() => {
    let interval: any;
    const updateElapsed = () => {
      const startTime = complaint?.startedAt || complaint?.started_at;
      const endTime = complaint?.resolvedAt || complaint?.resolved_at;
      
      if (!startTime) {
        setElapsedSeconds(0);
        return;
      }
      
      const start = new Date(startTime).getTime();
      const end = endTime ? new Date(endTime).getTime() : Date.now();
      const diff = Math.max(0, Math.floor((end - start) / 1000));
      setElapsedSeconds(diff);
    };

    updateElapsed(); // Initial run

    if (isActiveSession) {
      console.log("[Timer] Active session detected, starting interval...");
      interval = setInterval(updateElapsed, 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      console.log("[Timer] Session inactive or resolved.");
      pulseAnim.setValue(1);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActiveSession, complaint?.startedAt, complaint?.started_at, complaint?.resolvedAt, complaint?.resolved_at]);

  // GSD Decision: Geofence Exit Alert (Foreground)
  const [showExitWarning, setShowExitWarning] = useState(false);
  useEffect(() => {
    let watchId: any;
    if (isActiveSession && siteData?.latitude && siteData?.longitude) {
      console.log("[Geofence/Monitor] Starting proximity watch...");
      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (loc) => {
          const dist = LocationService.getDistance(
            { latitude: loc.coords.latitude, longitude: loc.coords.longitude },
            { latitude: siteData.latitude, longitude: siteData.longitude }
          );
          
          if (dist > 250) {
             if (!showExitWarning) {
                console.warn("[Geofence/Monitor] Supervisor has left the 250m geofence!");
                setShowExitWarning(true);
                HapticsService.warning();
             }
          } else {
             setShowExitWarning(false);
          }
        }
      ).then(sub => watchId = sub);
    }
    return () => watchId?.remove();
  }, [isActiveSession, siteData]);

  if (!complaint) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={48} color={Colors.textMuted} />
        <Text style={styles.notFoundText}>Complaint not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: 'white' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const currentPhase = complaint.currentPhase || 'reported';

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePickImage = async (type: 'before' | 'after') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Needed", "Please enable camera access to take a photo of the completed work.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      try {
        setIsUploading(type);
        const localUri = result.assets[0].uri;
        const uploadPath = `complaints/${id}_${type}_${Date.now()}.jpg`;
        
        // Use uploadImage from context to get a public URL
        const publicUrl = await uploadImage(localUri, uploadPath);
        
        await updateComplaint(complaint.id, type === 'before' ? { beforeMediaUrl: publicUrl } : { afterMediaUrl: publicUrl });
      } catch (err) {
        console.error("Upload failed:", err);
        Alert.alert("Upload Error", "Failed to save the image to the cloud. Please try again.");
      } finally {
        setIsUploading(null);
      }
    }
  };
  const handleGenerateReport = async () => {
    if (!complaint || !siteData) return;
    try {
      await HapticsService.impact('medium');
      await ReportService.generateResolutionReport({
        id: complaint.id,
        siteName: siteData.name,
        siteLogo: siteData.logoUrl,
        clientName: raisedByData?.name || "Client",
        floor: complaint.floor,
        room: complaint.roomNumber,
        category: complaint.category,
        description: complaint.description,
        beforeImage: complaint.beforeMediaUrl,
        afterImage: complaint.afterMediaUrl,
        duration: formatTime(elapsedSeconds),
        startedAt: complaint.startedAt || new Date().toISOString(),
        resolvedAt: complaint.resolvedAt || new Date().toISOString(),
        supervisorName: assignedSupervisor?.name || "GMS Supervisor",
        workNotes: workNotes || complaint.work_notes
      });
    } catch (err) {
      Alert.alert("Report Error", "Failed to generate PDF. Please ensure all permissions are granted.");
    }
  };

  const handlePhaseTransition = async () => {
    if (!complaint.siteId) return;
    
    setIsLocating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 1. Check Proximity (Geofence)
    const { isInside, distance } = await checkProximity(complaint.siteId);
    setLocationVerified(isInside);
    setIsLocating(false);

    // 2. Founder Bypass or Strict Check
    const isFounder = currentUser?.role === 'founder';
    
    if (!isInside && !isFounder) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Out of Range", 
        `You are currently ${Math.round(distance || 0)}m away. You must be within the site premises to update this task.`
      );
      return;
    }

    if (!isInside && isFounder) {
      const proceed = await new Promise(resolve => {
        Alert.alert(
          "Admin Override",
          "You are out of range, but as a Founder you can bypass this. Proceed?",
          [
            { text: "Cancel", onPress: () => resolve(false), style: 'cancel' },
            { text: "Override", onPress: () => resolve(true) }
          ]
        );
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
      if (!complaint.afterMediaUrl) {
        Alert.alert("Action Required", "Please upload an 'After' photo as proof of resolution before completing.");
        return;
      }
      if (!workNotes.trim()) {
        Alert.alert("Action Required", "Please write a brief report about how the issue was solved.");
        return;
      }
    }

    await updateComplaintPhase(complaint.id, next);
    
    // Force a fresh sync so the timer sees complaint.startedAt immediately
    await refreshData({ forceSync: true });
    
    if (next === 'resolved') {
      // Logic for resolution note already handled by PhaseTracker calling resolution logic
      router.back();
    }
  };

  const toggleTag = (id: string) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSharePreview(true);
  };

  const triggerExternalShare = async () => {
    if (!complaint) return;
    
    try {
      const duration = elapsedSeconds > 0 ? formatTime(elapsedSeconds) : 'Not started';
      const supervisorName = assignedSupervisor?.name || 'Unassigned';
      
      const message = `📋 GMS COMPLAINT REPORT
──────────────────────
🆔 ID: ${complaint.id.substring(0, 8).toUpperCase()}
🏢 SITE: ${complaint.siteName}
📂 CAT: ${complaint.category}
🔥 PRIORITY: ${complaint.priority.toUpperCase()}
⏳ STATUS: ${complaint.status.replace('_', ' ').toUpperCase()}
⏱️ DURATION: ${duration}
👷 SUP: ${supervisorName}
──────────────────────
📝 NOTES:
${workNotes || complaint.work_notes || 'No notes provided yet.'}
──────────────────────
Shared via GMS Complaint Box`;

      await Share.share({
        message,
        title: `Complaint Report: ${complaint.id.substring(0, 8).toUpperCase()}`
      });
    } catch (error: any) {
      Alert.alert("Share Error", error.message || "Could not share the report.");
    }
  };

  const handleDeleteComplaint = () => {
    Alert.alert(
      "Take Down Complaint",
      "Are you sure you want to permanently delete this complaint?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              await deleteComplaint(complaint.id);
              router.back();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete complaint");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: Colors.dark.bg }]}>
      {/* DashboardHeader removed as per user request */}
      
      {/* Premium Hero Section */}
      <View style={{ height: 320, overflow: 'hidden' }}>
        <LinearGradient 
          colors={isDarkMode ? ['#0F172A', '#1E293B', '#334155'] : ['#060D1F', '#1A3A6B', '#4F46E5']} 
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroNav}>
              <Pressable onPress={() => router.back()} style={styles.navBack}>
                <Feather name="arrow-left" size={20} color="white" />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.heroTitle}>Complaint Insight</Text>
              </View>
              <Pressable style={styles.navBack} onPress={() => refreshData({ forceSync: true })}>
                <View style={{ alignItems: 'flex-end' }}>
                   <Feather name="refresh-cw" size={18} color="white" />
                   <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                     PHASE: {currentPhaseNormalized.toUpperCase()}
                   </Text>
                </View>
              </Pressable>
            </View>

            {(isActiveSession || complaint.status === 'resolved') ? (
              <View style={styles.stopwatchContainer}>
                <View style={styles.liveBadge}>
                  <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                  <Text style={styles.liveLabel}>{complaint.status === 'resolved' ? 'RESOLUTION TIME' : 'LIVE WORK SESSION'}</Text>
                </View>
                <Text style={styles.stopwatch}>{formatTime(elapsedSeconds)}</Text>
                {isActiveSession && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Feather name={locationVerified ? "shield" : "crosshair"} size={10} color={locationVerified ? "#4ADE80" : "#94A3B8"} />
                    <Text style={[styles.stopwatchSub, locationVerified && { color: '#4ADE80' }]}>
                      {isLocating ? "Verifying GPS..." : (locationVerified ? "Presence Verified" : "Location Untrusted")}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.staticHeroInfo}>
                <View style={[styles.statusGlass, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={styles.statusGlassText}>{complaint.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.heroMainCat}>{complaint.category}</Text>
                <Text style={styles.heroSubLabel}>{siteData?.name || complaint.siteName} • ID: {complaint.id.substring(0,6).toUpperCase()}</Text>
              </View>
            )}

            <BlurView intensity={20} style={styles.glassBar}>
              <View style={styles.glassBarItem}>
                <Feather name="map-pin" size={12} color="#93C5FD" />
                <Text style={styles.glassBarText} numberOfLines={1}>{siteData?.name || complaint.siteName}</Text>
              </View>
              <View style={styles.glassBarDivider} />
              <View style={styles.glassBarItem}>
                <Feather name="alert-triangle" size={12} color="#93C5FD" />
                <Text style={styles.glassBarText}>{complaint.priority.toUpperCase()}</Text>
              </View>
            </BlurView>
          </View>
        </LinearGradient>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 140, marginTop: -40 }]}
      >
        <Animated.View style={{ transform: [{ translateY: slideUp }] }}>
          
          {isSupervisor && complaint.status !== 'resolved' && (
            <SoftCard variant="glass" style={styles.wizardCard}>
              <View style={styles.wizardHeader}>
                <Text style={styles.sectionLabel}>Active Resolution Wizard</Text>
                <Text style={styles.stepIndicator}>Step {(['arrived', 'checking_issue', 'solving'].indexOf(currentPhase as any) + 1) || 0} of 3</Text>
              </View>
              
              <View style={styles.wizardHorizontalSteps}>
                {['arrived', 'checking_issue', 'solving'].map((p, idx) => {
                  const flow = ['arrived', 'checking_issue', 'solving'];
                  const currentIndex = flow.indexOf(currentPhase as any);
                  const isDone = currentIndex > idx;
                  const isCurrent = currentPhase === p;

                  return (
                    <React.Fragment key={p}>
                      <View style={styles.wizStepBox}>
                        <View style={[
                          styles.wizDot, 
                          isCurrent && styles.wizDotCurrent,
                          isDone && styles.wizDotDone
                        ]}>
                          {isDone ? (
                            <Feather name="check" size={10} color="white" />
                          ) : (
                            <Text style={[styles.wizNum, isCurrent && {color: 'white'}]}>{idx+1}</Text>
                          )}
                        </View>
                        <Text style={[styles.wizLabel, isCurrent && styles.wizLabelActive]}>
                          {p === 'arrived' ? 'Start' : p === 'checking_issue' ? 'Inspect' : 'Solve'}
                        </Text>
                      </View>
                      {idx < 2 && <View style={[styles.wizLine, isDone && styles.wizLineDone]} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </SoftCard>
          )}

          {isSupervisor && currentPhase !== 'reported' && (
            <SoftCard style={styles.reportCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: '#F5F3FF' }]}>
                  <Feather name="edit-3" size={15} color="#7C3AED" />
                </View>
                <Text style={[styles.cardTitle, isDarkMode && { color: 'white' }]}>Technical Field Report</Text>
              </View>
              <TextInput
                style={[styles.reportInput, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated, color: 'white', borderColor: Colors.dark.border }]}
                placeholder={isSupervisor ? "Describe the issue found and steps taken to resolve it..." : "No supervisor notes provided yet."}
                placeholderTextColor={isDarkMode ? '#475569' : '#9CA3AF'}
                multiline
                value={workNotes}
                onChangeText={setWorkNotes}
                onBlur={() => isSupervisor && updateComplaint(complaint.id, { work_notes: workNotes } as any)}
                editable={isSupervisor && complaint.status !== 'resolved'}
              />
              
              <Text style={styles.subLabelInd}>SELECT WORK CATEGORIES</Text>
              <View style={styles.tagGrid}>
                {WORK_TAGS.map(tag => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <Pressable
                      key={tag.id}
                      style={[styles.tag, active && styles.tagActive, isDarkMode && !active && styles.tagDark]}
                      onPress={() => isSupervisor && toggleTag(tag.id)}
                      disabled={!isSupervisor || complaint.status === 'resolved'}
                    >
                      <Feather name={tag.icon} size={13} color={active ? 'white' : (isDarkMode ? '#94A3B8' : '#6B7280')} />
                      <Text style={[styles.tagLabel, active && styles.tagLabelActive, isDarkMode && !active && { color: '#94A3B8' }]}>
                        {tag.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </SoftCard>
          )}


          <SoftCard style={{ marginBottom: 24, padding: 24 }}>
            <Text style={[styles.sectionLabel, { marginBottom: 16 }, isDarkMode && { color: Colors.dark.textMuted }]}>RESOLUTION PIPELINE</Text>
            <PhaseTracker 
              currentPhase={complaint.currentPhase || 'reported'} 
              isDarkMode={isDarkMode} 
              history={complaint.phaseHistory || []} 
            />
          </SoftCard>

          {complaint.rating ? (
            <SoftCard style={styles.ratingCard}>
              <Text style={styles.sectionLabel}>CLIENT SATISFACTION</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Feather 
                    key={s} 
                    name="star" 
                    size={18} 
                    color={s <= (complaint.rating || 0) ? "#F59E0B" : (isDarkMode ? Colors.dark.border : Colors.surfaceBorder)} 
                    fill={s <= (complaint.rating || 0) ? "#F59E0B" : "transparent"}
                  />
                ))}
                <Text style={[styles.ratingScore, isDarkMode && { color: Colors.dark.text }]}>{complaint.rating}/5</Text>
              </View>
              {complaint.ratingFeedback ? (
                <Text style={[styles.ratingFeedback, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated, color: Colors.dark.textSub }]}>"{complaint.ratingFeedback}"</Text>
              ) : null}
            </SoftCard>
          ) : null}

          <Text style={styles.sectionLabel}>WORK EVIDENCE</Text>
          <View style={styles.photoContainer}>
            <SoftCard style={styles.halfCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: '#F0F9FF' }]}>
                  <Feather name="camera" size={12} color="#0EA5E9" />
                </View>
                <Text style={[styles.cardTitle, { fontSize: 13 }, isDarkMode && { color: 'white' }]}>Before</Text>
              </View>
              <Pressable 
                onPress={() => complaint.beforeMediaUrl ? setActiveFullImage(complaint.beforeMediaUrl) : (isSupervisor && complaint.status !== 'resolved' && handlePickImage('before'))}
                disabled={!complaint.beforeMediaUrl && (!isSupervisor || complaint.status === 'resolved')}
                style={styles.photoBox}
              >
                {complaint.beforeMediaUrl ? (
                  <Image 
                    key={`before_${complaint.beforeMediaUrl}`}
                    source={{ uri: complaint.beforeMediaUrl }} 
                    style={styles.fullImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.emptyImg}>
                    {isUploading === 'before' ? (
                      <ActivityIndicator color={Colors.primary} />
                    ) : (
                      <>
                        <Feather name="plus-circle" size={24} color={Colors.surfaceBorder} />
                        <Text style={styles.emptyImgText}>Add Photo</Text>
                      </>
                    )}
                  </View>
                )}
              </Pressable>
            </SoftCard>

            <SoftCard style={styles.halfCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Feather name="check-circle" size={12} color="#10B981" />
                </View>
                <Text style={[styles.cardTitle, { fontSize: 13 }, isDarkMode && { color: 'white' }]}>After</Text>
              </View>
              <Pressable 
                onPress={() => complaint.afterMediaUrl ? setActiveFullImage(complaint.afterMediaUrl) : (isSupervisor && complaint.status !== 'resolved' && ['solving', 'resolved'].includes(currentPhase as any) && handlePickImage('after'))}
                disabled={!complaint.afterMediaUrl && (!isSupervisor || complaint.status === 'resolved' || !['solving', 'resolved'].includes(currentPhase as any))}
                style={[styles.photoBox, (!complaint.afterMediaUrl && (!isSupervisor || !['solving', 'resolved'].includes(currentPhase as any))) && { opacity: 0.5 }]}
              >
                {complaint.afterMediaUrl ? (
                  <Image 
                    key={`after_${complaint.afterMediaUrl}`}
                    source={{ uri: complaint.afterMediaUrl }} 
                    style={styles.fullImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.emptyImg}>
                    {isUploading === 'after' ? (
                      <ActivityIndicator color={Colors.primary} />
                    ) : (
                      <>
                        <Feather name="plus-circle" size={24} color={Colors.surfaceBorder} />
                        <Text style={styles.emptyImgText}>Add Photo</Text>
                      </>
                    )}
                  </View>
                )}
              </Pressable>
            </SoftCard>
          </View>

          <SoftCard style={styles.detailsCard}>
            <Text style={styles.sectionLabel}>LOCATION & SITE DETAILS</Text>
            <View style={styles.infoGridRow}>
              <View style={styles.infoGridCol}>
                <View style={[styles.infoItem, { marginBottom: 8 }]}>
                  <View style={[styles.infoIcon, isDarkMode && { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                    <Feather name="map-pin" size={13} color={isDarkMode ? "#4ADE80" : "#10B981"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>SITE NAME</Text>
                    <Text style={[styles.infoValue, isDarkMode && { color: Colors.dark.text }]} numberOfLines={1}>
                      {siteData?.name || complaint.siteName || "Unnamed Site"}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <View style={[styles.infoIcon, isDarkMode && { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                    <Feather name="navigation" size={13} color={isDarkMode ? "#60A5FA" : Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>ADDRESS</Text>
                    <Text style={[styles.infoValue, { fontSize: 11 }, isDarkMode && { color: Colors.dark.text }]} numberOfLines={2}>
                      {siteData?.address || "No address provided"}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.infoGridCol}>
                <View style={[styles.infoItem, { marginBottom: 8 }]}>
                  <View style={[styles.infoIcon, isDarkMode && { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                    <Feather name="phone" size={13} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>SITE CONTACT</Text>
                    <Text style={[styles.infoValue, isDarkMode && { color: Colors.dark.text }]}>
                      {siteData?.clientPhone || "No contact"}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <View style={[styles.infoIcon, isDarkMode && { backgroundColor: 'rgba(124,58,237,0.1)' }]}>
                    <Feather name="shield" size={13} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>AUTHORITY</Text>
                    <Text style={[styles.infoValue, isDarkMode && { color: Colors.dark.text }]}>
                      {siteData?.authorityName || "Not assigned"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </SoftCard>

          <SoftCard style={styles.detailsCard}>
            <Text style={styles.sectionLabel}>REQUISITION & REPORTER</Text>
            <View style={styles.infoGridRow}>
              <View style={styles.infoGridCol}>
                <View style={styles.infoItem}>
                  <View style={[styles.infoIcon, isDarkMode && { backgroundColor: 'rgba(71,85,105,0.1)' }]}>
                    <Feather name="hash" size={13} color={isDarkMode ? "#94A3B8" : "#475569"} />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>REF ID</Text>
                    <Text style={[styles.infoValue, isDarkMode && { color: Colors.dark.text }]}>#{complaint.id.substring(0, 8).toUpperCase()}</Text>
                  </View>
                </View>
                <View style={[styles.infoItem, { marginTop: 12 }]}>
                  <View style={[styles.infoIcon, isDarkMode && { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                    <Feather name="user" size={13} color={isDarkMode ? "#60A5FA" : Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>RAISED BY</Text>
                    <Text style={[styles.infoValue, isDarkMode && { color: Colors.dark.text }]} numberOfLines={1}>{complaint.clientName}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoGridCol}>
                <View style={styles.infoItem}>
                  <View style={[styles.infoIcon, isDarkMode && { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <Feather name="phone-call" size={13} color="#10B981" />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>CLIENT PHONE</Text>
                    <Text style={[styles.infoValue, isDarkMode && { color: Colors.dark.text }]}>
                      {raisedByData?.phone || "No phone"}
                    </Text>
                  </View>
                </View>
                <View style={[styles.infoItem, { marginTop: 12 }]}>
                  <View style={[styles.infoIcon, isDarkMode && { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                    <Feather name="tool" size={13} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>SUPERVISOR</Text>
                    <Text style={[styles.infoValue, isDarkMode && { color: Colors.dark.text }]} numberOfLines={1}>{assignedSupervisor?.name || "Unassigned"}</Text>
                  </View>
                </View>
              </View>
            </View>
          </SoftCard>

          {role === 'client' && (
            <Pressable 
              style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 20, marginTop: 16, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }, isDarkMode && { backgroundColor: '#7F1D1D30', borderColor: '#450a0a' }]} 
              onPress={handleDeleteComplaint}
            >
              <Feather name="trash-2" size={18} color="#EF4444" />
              <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#EF4444' }}>Take Down Complaint</Text>
            </Pressable>
          )}

        </Animated.View>
      </ScrollView>

      {/* Success Animation & State Overlay */}
      {complaint.status === 'resolved' && (
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={90} tint={isDarkMode ? "dark" : "light"} style={StyleSheet.absoluteFill}>
            <View style={styles.successContainer}>
              <Animated.View style={styles.successCard}>
                <View style={styles.successBadge}>
                  <Feather name="check" size={40} color="white" />
                </View>
                <Text style={[styles.successTitle, isDarkMode && { color: 'white' }]}>RESOLUTION COMPLETED</Text>
                <Text style={styles.successSub}>Thank you, {assignedSupervisor?.name}. The site has been electronically notified.</Text>
                
                <View style={[styles.successSummary, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }]}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>RESOLVED AT</Text>
                    <Text style={[styles.summaryValue, isDarkMode && { color: 'white' }]}>{new Date(complaint.resolvedAt!).toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>REPORT SUMMARY</Text>
                    <Text style={[styles.summaryValue, isDarkMode && { color: 'white' }]} numberOfLines={3}>{workNotes || complaint.work_notes}</Text>
                  </View>
                </View>

                <Pressable 
                  style={({ pressed }) => [styles.successAction, pressed && { opacity: 0.8 }, { marginBottom: 12 }]}
                  onPress={handleGenerateReport}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.successBtn}
                  >
                    <Text style={styles.successBtnText}>Generate Pro PDF Report</Text>
                    <Feather name="file-text" size={18} color="white" />
                  </LinearGradient>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [styles.successAction, pressed && { opacity: 0.8 }, { marginBottom: 12 }]}
                  onPress={() => setShowReport(true)}
                >
                  <View
                    style={[styles.successBtn, { backgroundColor: isDarkMode ? Colors.dark.surfaceElevated : '#FFFFFF', borderWidth: 1, borderColor: isDarkMode ? Colors.dark.border : '#E2E8F0' }]}
                  >
                    <Text style={[styles.successBtnText, { color: isDarkMode ? 'white' : '#1E293B' }]}>View Work Summary</Text>
                    <Feather name="eye" size={18} color={isDarkMode ? 'white' : '#1E293B'} />
                  </View>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [styles.successAction, pressed && { opacity: 0.8 }]}
                  onPress={() => router.replace('/(tabs)')}
                >
                  <View
                    style={[styles.successBtn, { backgroundColor: isDarkMode ? Colors.dark.surfaceElevated : '#F1F5F9', borderWidth: 1, borderColor: isDarkMode ? Colors.dark.border : '#E2E8F0' }]}
                  >
                    <Text style={[styles.successBtnText, { color: isDarkMode ? 'white' : '#1E293B' }]}>Back to Dashboard</Text>
                    <Feather name="home" size={18} color={isDarkMode ? 'white' : '#1E293B'} />
                  </View>
                </Pressable>
              </Animated.View>
            </View>
          </BlurView>
        </View>
      )}

      {/* Geofence Exit Warning Modal */}
      <Modal transparent visible={showExitWarning} animationType="fade">
         <View style={styles.modalOverlay}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint={isDarkMode ? 'dark' : 'light'} />
            <SoftCard style={styles.warningModal}>
               <View style={styles.warningIcon}>
                  <Feather name="alert-triangle" size={32} color="#EF4444" />
               </View>
               <Text style={styles.warningTitle}>Away from Premises</Text>
                <Text style={styles.warningText}>
                  You are currently more than {APP_CONFIG.GEOFENCE.DEFAULT_RADIUS}m away from {siteData?.name}. Did you forget to stop the timer?
                </Text>
               <View style={styles.warningActions}>
                  <Pressable style={styles.warningBtnIgnore} onPress={() => setShowExitWarning(false)}>
                     <Text style={styles.warningBtnTextIgnore}>Close</Text>
                  </Pressable>
                  <Pressable style={styles.warningBtnAction} onPress={() => { setShowExitWarning(false); handlePhaseTransition(); }}>
                     <Text style={styles.warningBtnTextAction}>Resolve Now</Text>
                  </Pressable>
               </View>
            </SoftCard>
         </View>
      </Modal>

      {isSupervisor && complaint.status !== 'resolved' && (
        <BlurView 
          intensity={80} 
          tint={isDarkMode ? 'dark' : 'light'} 
          style={[styles.floatingAction, { paddingBottom: insets.bottom + 16 }]}
        >
          <Pressable 
            style={[styles.mainStepBtn, loading && { opacity: 0.7 }]} 
            onPress={handlePhaseTransition}
            disabled={loading}
          >
            <LinearGradient
              colors={['#4F46E5', '#3730A3']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.mainStepBtnText}>
                    {currentPhase === 'reported' ? 'I Have Arrived / Start Work' :
                     currentPhase === 'arrived' ? 'Step 2: Inspect Issue' :
                     currentPhase === 'checking_issue' ? 'Step 3: Solve & Fix' :
                     'Finalize & Resolve'}
                  </Text>
                  <Feather name="arrow-right" size={20} color="white" />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </BlurView>
      )}

      {/* Full-Screen Image Modal */}
      <Modal visible={!!activeFullImage} transparent animationType="fade">
        <BlurView intensity={90} tint="dark" style={styles.modalOverlay}>
          <Pressable style={styles.modalClose} onPress={() => setActiveFullImage(null)}>
            <Feather name="x" size={24} color="white" />
          </Pressable>
          <View style={styles.modalContent}>
            {activeFullImage && <Image source={{ uri: activeFullImage }} style={styles.fullScreenImage} resizeMode="contain" />}
          </View>
        </BlurView>
      </Modal>

      {/* Full Resolution Report Modal */}
      <Modal visible={showReport} transparent animationType="slide">
        <View style={[styles.reportModal, isDarkMode && { backgroundColor: Colors.dark.bg }]}>
          <View style={[styles.reportHeader, isDarkMode && { borderBottomColor: Colors.dark.border }]}>
            <View>
              <Text style={styles.reportTitle}>RESOLUTION REPORT</Text>
              <Text style={styles.reportID}>#{complaint.id.substring(0,8).toUpperCase()}</Text>
            </View>
            <Pressable onPress={() => setShowReport(false)} style={styles.reportClose}>
              <Feather name="x" size={20} color={isDarkMode ? 'white' : '#1E293B'} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reportScroll}>
            <View style={styles.reportSection}>
              <Text style={styles.reportSectionLabel}>CASE SUMMARY</Text>
              <View style={[styles.reportInfoCard, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }]}>
                <View style={styles.reportInfoRow}>
                  <Text style={styles.reportLabel}>SITE</Text>
                  <Text style={[styles.reportValue, isDarkMode && { color: 'white' }]}>{complaint.siteName}</Text>
                </View>
                <View style={styles.reportInfoRow}>
                  <Text style={styles.reportLabel}>CATEGORY</Text>
                  <Text style={[styles.reportValue, isDarkMode && { color: 'white' }]}>{complaint.category}</Text>
                </View>
                <View style={styles.reportInfoRow}>
                  <Text style={styles.reportLabel}>SUPERVISOR</Text>
                  <Text style={[styles.reportValue, isDarkMode && { color: 'white' }]}>{assignedSupervisor?.name}</Text>
                </View>
                <View style={styles.reportInfoRow}>
                  <Text style={styles.reportLabel}>TOTAL DURATION</Text>
                  <Text style={[styles.reportValue, { color: Colors.primary }]}>{formatTime(elapsedSeconds)}</Text>
                </View>
              </View>

              <View style={[styles.reportSection, { marginTop: 24 }]}>
                <Text style={styles.reportSectionLabel}>WORK EVIDENCE</Text>
                <View style={styles.reportPhotoGrid}>
                  <View style={styles.reportPhotoBox}>
                    <Text style={styles.photoBoxLabel}>BEFORE</Text>
                    <Image source={{ uri: complaint.beforeMediaUrl || undefined }} style={styles.reportImage} resizeMode="cover" />
                  </View>
                  <View style={styles.reportPhotoBox}>
                    <Text style={styles.photoBoxLabel}>AFTER</Text>
                    <Image source={{ uri: complaint.afterMediaUrl || undefined }} style={styles.reportImage} resizeMode="cover" />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={[styles.reportFooter, isDarkMode && { borderTopColor: Colors.dark.border }]}>
            <Pressable style={styles.reportAction} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.reportActionText}>Return to Dashboard</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Share Preview Modal */}
      <Modal visible={showSharePreview} transparent animationType="fade">
        <BlurView intensity={90} tint={isDarkMode ? 'dark' : 'light'} style={styles.modalOverlay}>
          <Pressable style={styles.modalClose} onPress={() => setShowSharePreview(false)}>
            <Feather name="x" size={24} color={isDarkMode ? 'white' : 'black'} />
          </Pressable>
          
          <View style={styles.shareCardContainer}>
            <View style={[styles.shareCard, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
              <View style={styles.shareHeader}>
                <View style={styles.shareBrand}>
                  <View style={styles.shareLogo}>
                    <Feather name="shield" size={20} color="white" />
                  </View>
                  <View>
                    <Text style={[styles.shareBrandTitle, isDarkMode && { color: 'white' }]}>GMS REPORT</Text>
                    <Text style={styles.shareBrandID}>ID: #{complaint.id.substring(0,8).toUpperCase()}</Text>
                  </View>
                </View>
                <View style={[styles.shareStatus, { backgroundColor: complaint.status === 'resolved' ? '#10B98120' : '#3B82F620' }]}>
                  <Text style={[styles.shareStatusText, { color: complaint.status === 'resolved' ? '#10B981' : '#3B82F6' }]}>{complaint.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.shareDetails}>
                <View style={styles.shareDetailRow}>
                  <Text style={styles.shareLabel}>SITE LOCATION</Text>
                  <Text style={[styles.shareValue, isDarkMode && { color: 'white' }]}>{complaint.siteName}</Text>
                </View>
                <View style={styles.shareDetailRow}>
                  <Text style={styles.shareLabel}>WORK CATEGORY</Text>
                  <Text style={[styles.shareValue, isDarkMode && { color: 'white' }]}>{complaint.category}</Text>
                </View>
                <View style={styles.shareDetailRow}>
                  <Text style={styles.shareLabel}>SESSION TIME</Text>
                  <Text style={[styles.shareValue, { color: Colors.primary }]}>{formatTime(elapsedSeconds)}</Text>
                </View>
              </View>

              <View style={styles.shareNotesSection}>
                <Text style={styles.shareLabel}>TECHNICAL REPORT</Text>
                <Text style={[styles.shareNotes, isDarkMode && { color: Colors.dark.textSub }]} numberOfLines={4}>
                  {workNotes || complaint.work_notes || 'No technical notes recorded for this phase.'}
                </Text>
              </View>

              {(complaint.beforeMediaUrl || complaint.afterMediaUrl) && (
                <View style={styles.sharePhotos}>
                  {complaint.beforeMediaUrl && (
                    <View style={styles.sharePhotoBox}>
                      <Image source={{ uri: complaint.beforeMediaUrl }} style={styles.shareImage} />
                      <Text style={styles.sharePhotoLabel}>BEFORE</Text>
                    </View>
                  )}
                  {complaint.afterMediaUrl && (
                    <View style={styles.sharePhotoBox}>
                      <Image source={{ uri: complaint.afterMediaUrl }} style={styles.shareImage} />
                      <Text style={styles.sharePhotoLabel}>AFTER</Text>
                    </View>
                  )}
                </View>
              )}


              <View style={styles.shareWatermark}>
                <Text style={styles.watermarkText}>Verified via GMS Complaint Box</Text>
              </View>
            </View>

            <Pressable 
              style={({ pressed }) => [styles.shareExternBtn, pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={triggerExternalShare}
            >
              <LinearGradient
                colors={['#4F46E5', '#3730A3']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.shareGradient}
              >
                <Text style={styles.shareExternText}>Share Outside App</Text>
                <Feather name="external-link" size={18} color="white" />
              </LinearGradient>
            </Pressable>
          </View>
        </BlurView>
      </Modal>




    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  notFoundText: { fontSize: 16, color: Colors.textMuted, fontFamily: 'Inter_500Medium' },
  backBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  
  hero: { height: '100%', width: '100%' },
  heroOverlay: { paddingHorizontal: 24, flex: 1, justifyContent: 'space-between', paddingBottom: 60 },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60 },
  navBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { color: 'white', fontSize: 18, fontFamily: 'Inter_700Bold' },
  
  stopwatchContainer: { alignItems: 'center', marginTop: 20 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 8, marginBottom: 16 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  liveLabel: { color: '#FECACA', fontSize: 10, fontFamily: 'Inter_900Black', letterSpacing: 1 },
  stopwatch: { fontSize: 56, color: 'white', fontFamily: 'Inter_900Black', letterSpacing: -2 },
  stopwatchSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  
  staticHeroInfo: { alignItems: 'center', marginTop: 20 },
  statusGlass: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 30, marginBottom: 12 },
  statusGlassText: { color: 'white', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1 },
  heroMainCat: { color: 'white', fontSize: 32, fontFamily: 'Inter_900Black', textAlign: 'center' },
  heroSubLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 8 },
  
  glassBar: { flexDirection: 'row', height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 20, overflow: 'hidden' },
  glassBarItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12 },
  glassBarText: { color: 'white', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  glassBarDivider: { width: 1, height: '40%', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' },
  
  scroll: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 1, marginBottom: 12 },
  
  wizardCard: { padding: 20, marginBottom: 20 },
  wizardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  stepIndicator: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_700Bold' },
  wizardHorizontalSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wizStepBox: { alignItems: 'center', gap: 8, flex: 1 },
  wizDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0' },
  wizDotDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  wizDotCurrent: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  wizNum: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  wizLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#94A3B8' },
  wizLabelActive: { color: Colors.primary },
  wizLine: { height: 2, flex: 1, backgroundColor: '#F1F5F9', marginTop: -18 },
  wizLineDone: { backgroundColor: '#10B981' },
  
  reportCard: { padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  cardIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  reportInput: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, minHeight: 100, textAlignVertical: 'top', fontFamily: 'Inter_500Medium', fontSize: 14, borderWidth: 1, borderColor: '#F1F5F9' },
  subLabelInd: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#94A3B8', marginTop: 20, marginBottom: 12 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F1F5F9' },
  tagActive: { backgroundColor: Colors.primary },
  tagDark: { backgroundColor: '#1E293B' },
  tagLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  tagLabelActive: { color: 'white' },
  
  photoContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  halfCard: { flex: 1, padding: 16 },
  photoBox: { height: 120, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F1F5F9', borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyImg: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyImgText: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Inter_600SemiBold' },
  fullImage: { width: '100%', height: '100%' },
  
  detailsCard: { padding: 20, marginBottom: 20 },
  infoGridRow: { flexDirection: 'row', gap: 16 },
  infoGridCol: { flex: 1, gap: 16 },
  infoItem: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  infoIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#334155' },
  
  ratingCard: { padding: 20, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  ratingScore: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#1E293B', marginLeft: 8 },
  ratingFeedback: { fontSize: 14, fontFamily: 'Inter_500Medium', fontStyle: 'italic', color: '#64748B', backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12 },
  
  floatingAction: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16 },
  mainStepBtn: { height: 56, borderRadius: 28, overflow: 'hidden' },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  mainStepBtnText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
  
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: 'white', borderRadius: 32, padding: 32, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
  successBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#64748B', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  successSummary: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, width: '100%', gap: 16, marginBottom: 32 },
  summaryItem: { gap: 4 },
  summaryLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#94A3B8', letterSpacing: 1 },
  summaryValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#334155' },
  successAction: { width: '100%', borderRadius: 20, overflow: 'hidden' },
  successBtn: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  successBtnText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 60, right: 24, zIndex: 10, padding: 12, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)' },
  modalContent: { width: '100%', height: '80%', padding: 20 },
  fullScreenImage: { width: '100%', height: '100%', borderRadius: 12 },

  reportModal: { flex: 1, backgroundColor: 'white' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingTop: 60 },
  reportTitle: { fontSize: 16, fontFamily: 'Inter_900Black', color: '#1E293B', letterSpacing: 1 },
  reportID: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  reportClose: { padding: 8, borderRadius: 12, backgroundColor: '#F1F5F9' },
  reportScroll: { padding: 24 },
  reportSection: { marginBottom: 32 },
  reportSectionLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#94A3B8', letterSpacing: 1, marginBottom: 16 },
  reportInfoCard: { padding: 20, borderRadius: 20, backgroundColor: '#F8FAFC', gap: 12 },
  reportInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  reportLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#64748B' },
  reportValue: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  reportPhotoGrid: { flexDirection: 'row', gap: 12 },
  reportPhotoBox: { flex: 1, gap: 8 },
  photoBoxLabel: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#94A3B8', textAlign: 'center' },
  reportImage: { width: '100%', height: 140, borderRadius: 12, backgroundColor: '#F1F5F9' },
  reportTimeline: { gap: 0 },
  timelineItem: { flexDirection: 'row', gap: 16, minHeight: 60 },
  timelinePoint: { alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#F1F5F9' },
  timelineContent: { paddingBottom: 24 },
  timelinePhase: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  timelineTime: { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#94A3B8', marginTop: 2 },
  reportNotes: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#475569', lineHeight: 20 },
  reportFooter: { padding: 24, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingBottom: 40 },
  reportAction: { height: 56, borderRadius: 16, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  reportActionText: { color: 'white', fontSize: 15, fontFamily: 'Inter_700Bold' },

  // Share Card Styles
  shareCardContainer: { width: '100%', paddingHorizontal: 20, alignItems: 'center' },
  shareCard: { 
    backgroundColor: 'white', 
    borderRadius: 32, 
    width: '100%', 
    padding: 24, 
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 10,
  },
  shareHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  shareBrand: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  shareLogo: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center' },
  shareBrandTitle: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#1E293B' },
  shareBrandID: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#64748B' },
  shareStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  shareStatusText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  shareDetails: { gap: 12, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 24 },
  shareDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shareLabel: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 4 },
  shareValue: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#334155' },
  shareNotesSection: { gap: 6 },
  shareNotes: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#475569', lineHeight: 20 },
  sharePhotos: { flexDirection: 'row', gap: 12 },
  sharePhotoBox: { flex: 1, gap: 8 },
  shareImage: { width: '100%', height: 120, borderRadius: 16, backgroundColor: '#F1F5F9' },
  sharePhotoLabel: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#94A3B8', textAlign: 'center' },
  shareWatermark: { alignItems: 'center', marginTop: 10 },
  watermarkText: { fontSize: 10, color: '#CBD5E1', fontFamily: 'Inter_600SemiBold' },
  shareExternBtn: { height: 64, width: '100%', borderRadius: 32, overflow: 'hidden', marginTop: 24 },
  shareGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  shareExternText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  warningModal: {
    width: '100%',
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'white'
  },
  warningIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20
  },
  warningTitle: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#111827', marginBottom: 10 },
  warningText: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  warningActions: { flexDirection: 'row', gap: 12, width: '100%' },
  warningBtnIgnore: { flex: 1, height: 54, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  warningBtnTextIgnore: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#64748B' },
  warningBtnAction: { flex: 1, height: 54, borderRadius: 12, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  warningBtnTextAction: { fontSize: 14, fontFamily: 'Inter_700Bold', color: 'white' },

  successModal: { width: '100%', padding: 30, alignItems: 'center' },
  successCheck: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#146A65', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  successStats: { width: '100%', backgroundColor: '#F8FAFA', padding: 20, borderRadius: 16, marginBottom: 24 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#146A65' },
  successActions: { width: '100%', gap: 12 },
  reportBtn: { height: 54, backgroundColor: '#146A65', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  reportBtnText: { color: 'white', fontSize: 14, fontFamily: 'Inter_700Bold' },
  doneBtn: { height: 54, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  doneBtnText: { color: '#64748B', fontSize: 14, fontFamily: 'Inter_700Bold' }
});
