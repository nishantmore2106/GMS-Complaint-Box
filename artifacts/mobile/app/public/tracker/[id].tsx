import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Image, Animated as RNAnimated, Dimensions,
} from 'react-native';
import Reanimated, { FadeIn, SlideInUp, Layout } from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { PhaseTracker } from '@/components/PhaseTracker';
import { SoftCard } from '@/components/SoftCard';
import { SoftButton } from '@/components/SoftButton';
import { Skeleton } from '@/components/Skeleton';

// ─────────────────────────────────────────────────────────────
// PUBLIC DETAILS PAGE  (Premium High-Fidelity UI)
// ─────────────────────────────────────────────────────────────

const { width } = Dimensions.get('window');

const STATUS_CONFIG: Record<string, { label: string; colors: string[]; icon: string; shadow: string }> = {
  pending:     { label: 'Pending',     colors: ['#F59E0B', '#D97706'], icon: 'clock',         shadow: 'rgba(245, 158, 11, 0.2)' },
  in_progress: { label: 'In Progress', colors: ['#3B82F6', '#2563EB'], icon: 'loader',        shadow: 'rgba(59, 130, 246, 0.2)' },
  resolved:    { label: 'Resolved',    colors: ['#10B981', '#059669'], icon: 'check-circle',   shadow: 'rgba(16, 185, 129, 0.2)' },
  cancelled:   { label: 'Cancelled',   colors: ['#EF4444', '#DC2626'], icon: 'x-circle',      shadow: 'rgba(239, 68, 68, 0.2)'  },
};

export default function PublicDetailsPage() {
  const { id: complaintId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [complaint, setComplaint] = useState<any>(null);
  const [site, setSite]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [imgLoading, setImgLoading] = useState({ before: true, after: true });
  const [imgError, setImgError] = useState({ before: false, after: false });

  // Animation Refs
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const fadeAnim  = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    const status = complaint?.status;
    if (status === 'in_progress') {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [complaint?.status]);

  const ensureFullUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    // Robust path cleanup for Supabase storage
    // Handle cases where path might still have bucket prefix or leading slashes
    const cleanPath = path.replace(/^complaints\//, '').replace(/^\/+/, '');
    
    const { data } = supabase.storage.from('complaints').getPublicUrl(cleanPath);
    return data?.publicUrl || null;
  };

  const loadData = async () => {
    if (!complaintId) return;
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        site:sites(id, name),
        supervisor:users!complaints_supervisor_id_fkey(name, role)
      `)
      .eq('id', complaintId)
      .single();

    if (error) { console.error('[Details] Load error:', error); setLoading(false); return; }
    if (data) {
      setComplaint(data);
      setSite(data.site);
      setLastUpdated(new Date());
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!complaintId) return;
    loadData();

    const channel = supabase
      .channel(`details-${complaintId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'complaints',
        filter: `id=eq.${complaintId}`,
      }, (payload) => {
        setLastUpdated(new Date());
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [complaintId]);

  const formatDuration = (start: Date, end: Date) => {
    const diff = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Syncing tracker data...</Text>
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={48} color={Colors.danger} />
        <Text style={styles.errorTitle}>Tracker Link Expired</Text>
        <Text style={styles.errorSub}>The complaint reference could not be located. It may have been archived or removed.</Text>
        <SoftButton title="Return to Home" onPress={() => router.replace('/')} style={{ marginTop: 24 }} />
      </View>
    );
  }

  const statusKey = (complaint.status || 'pending').toLowerCase();
  const sc        = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const isLive    = statusKey === 'in_progress';

  return (
    <RNAnimated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* ── STUNNING GLASS HEADER ── */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} style={styles.glassBtn}>
              <Feather name="arrow-left" size={20} color="#1E293B" />
            </Pressable>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle}>Complaint Tracker</Text>
              <Text style={styles.refID}>#{complaint.id.substring(0, 8).toUpperCase()}</Text>
            </View>
            <View style={styles.liveIndicator}>
              {isLive ? (
                <View style={styles.liveBadge}>
                  <RNAnimated.View style={[styles.livePulse, { transform: [{ scale: pulseAnim }] }]} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              ) : (
                <Pressable onPress={loadData} style={styles.refreshBtn}>
                  <Feather name="refresh-cw" size={16} color="#94A3B8" />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.statusSection}>
            <LinearGradient
              colors={sc.colors}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.mainStatusBadge, { shadowColor: sc.shadow }]}
            >
              <Feather name={sc.icon as any} size={14} color="white" />
              <Text style={styles.mainStatusText}>{sc.label.toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{complaint.category || 'General'}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
      >
        {/* ── RESOLUTION HERO ── */}
        {complaint.status === 'resolved' && (
          <Reanimated.View entering={FadeIn.duration(800)} style={styles.successCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.successGradient}
            >
              <View style={styles.successIconBox}>
                <Feather name="check" size={32} color="white" />
              </View>
              <Text style={styles.successTitle}>Resolution Complete!</Text>
              <Text style={styles.successText}>
                Our team has finalized the resolution. You can now view the detailed summary report.
              </Text>
              <View style={styles.heroActions}>
                <Pressable onPress={() => setShowSummary(true)} style={styles.heroActionBtn}>
                  <Text style={styles.heroActionText}>View Summary Report</Text>
                  <Feather name="file-text" size={16} color="#059669" />
                </Pressable>
                <Pressable onPress={() => router.replace('/')} style={[styles.heroActionBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0 }]}>
                   <Feather name="plus-circle" size={16} color="white" />
                  <Text style={[styles.heroActionText, { color: 'white' }]}>New Complaint</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Reanimated.View>
        )}

        {/* ── SUPERVISOR ASSIGNMENT ── */}
        <SoftCard style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Feather name="shield" size={16} color="#4F46E5" />
            </View>
            <Text style={styles.cardLabel}>OPERATIONS SUPERVISOR</Text>
          </View>
          <View style={styles.supervisorRow}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: `https://ui-avatars.com/api/?name=${complaint.supervisor?.name || 'GMS'}&background=F1F5F9&color=4F46E5&bold=true` }} 
                style={styles.avatar} 
              />
              {!!complaint.supervisor?.name && <View style={styles.verifiedDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.supervisorName}>{complaint.supervisor?.name || 'Awaiting Allocation'}</Text>
              <Text style={styles.supervisorSub}>{complaint.supervisor?.name ? 'Field Operations Expert' : 'Assigning nearest available team member...'}</Text>
            </View>
            {!!complaint.supervisor?.name && (
              <View style={styles.contactIcon}>
                <Feather name="message-circle" size={18} color="#4F46E5" />
              </View>
            )}
          </View>
        </SoftCard>

        {/* ── TRACKING PIPELINE ── */}
        <SoftCard style={styles.premiumCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Feather name="activity" size={16} color="#10B981" />
            </View>
            <Text style={styles.cardLabel}>RESOLUTION PIPELINE</Text>
          </View>
          <View style={{ marginTop: 20 }}>
            <PhaseTracker
              currentPhase={complaint.current_phase || 'reported'}
              isDarkMode={false}
              history={complaint.phase_history || []}
            />
          </View>
        </SoftCard>

        {/* ── LOCATION & DATA GRID ── */}
        <View style={styles.gridRow}>
          <SoftCard style={styles.gridCard}>
            <Feather name="map-pin" size={16} color="#6366F1" style={{ marginBottom: 12 }} />
            <Text style={styles.gridLabel}>FACILITY</Text>
            <Text style={styles.gridMain} numberOfLines={1}>{site?.name || 'GMS Facility'}</Text>
            <Text style={styles.gridSub}>{`Floor ${complaint.floor || '—'} · Room ${complaint.room_number || '—'}`}</Text>
          </SoftCard>
          <SoftCard style={styles.gridCard}>
            <Feather name="zap" size={16} color="#F59E0B" style={{ marginBottom: 12 }} />
            <Text style={styles.gridLabel}>PRIORITY</Text>
            <Text style={styles.gridMain}>{(complaint.priority || 'Medium').toUpperCase()}</Text>
            <Text style={styles.gridSub}>Escalation Active</Text>
          </SoftCard>
        </View>

        {/* ── EVIDENCE & NOTES ── */}
        {!!complaint.description && (
          <SoftCard style={styles.premiumCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>YOUR SUBMISSION</Text>
            </View>
            <Text style={styles.descriptionText}>{complaint.description}</Text>
          </SoftCard>
        )}

        {(!!complaint.before_media_url || !!complaint.after_media_url) && (
          <SoftCard style={styles.premiumCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>WORK EVIDENCE</Text>
            </View>
            <View style={styles.evidenceGrid}>
              {!!complaint.before_media_url && (
                <View style={styles.evidenceBox}>
                  <View style={styles.auditImgWrapper}>
                    <Image source={{ uri: ensureFullUrl(complaint.before_media_url) as string }} style={styles.evidenceImg} resizeMode="cover" />
                  </View>
                  <View style={styles.evidenceBadge}>
                    <Text style={styles.evidenceBadgeText}>BEFORE</Text>
                  </View>
                </View>
              )}
              {!!complaint.after_media_url && (
                <View style={styles.evidenceBox}>
                  <View style={styles.auditImgWrapper}>
                    <Image source={{ uri: ensureFullUrl(complaint.after_media_url) as string }} style={styles.evidenceImg} resizeMode="cover" />
                  </View>
                  <View style={[styles.evidenceBadge, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.evidenceBadgeText}>AFTER</Text>
                  </View>
                </View>
              )}
            </View>
          </SoftCard>
        )}

        <View style={styles.finalFooter}>
          <View style={styles.footerLine} />
          <View style={styles.footerContent}>
            <Feather name="shield" size={12} color="#CBD5E1" />
            <Text style={styles.footerText}>Enterprise Security · GMS Verified</Text>
          </View>
        </View>
      </ScrollView>

      {/* ── PREMIUM SUMMARY MODAL ── */}
      {showSummary && (
        <View style={styles.modalOverlay}>
           <Reanimated.View entering={SlideInUp} style={styles.modalBody}>
              <View style={styles.modalHeader}>
                 <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>RESOLUTION REPORT</Text>
                    <Text style={styles.modalRef}>{`REF-ID: #${complaint.id.substring(0, 8).toUpperCase()}`}</Text>
                 </View>
                 <View style={styles.modalBadges}>
                    <View style={[styles.miniBadge, { backgroundColor: sc.colors[0] }]}>
                       <Text style={styles.miniBadgeText}>{statusKey.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.miniBadge, { backgroundColor: '#4F46E5' }]}>
                       <Text style={styles.miniBadgeText}>{(complaint.priority || 'MED').toUpperCase()}</Text>
                    </View>
                 </View>
                 <Pressable onPress={() => setShowSummary(false)} style={styles.modalClose}>
                    <Feather name="x" size={20} color="#64748B" />
                 </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                 {/* ── LOCATION & REPORTER ── */}
                 <View style={styles.summaryStats}>
                    <View style={styles.statItem}>
                       <Text style={styles.statLabel}>LOCATION</Text>
                       <Text style={styles.statValue} numberOfLines={1}>{site?.name || 'Facility'}</Text>
                       <Text style={styles.statSub}>{`F-${complaint.floor || '—'} · R-${complaint.room_number || '—'}`}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                       <Text style={styles.statLabel}>REPORTER</Text>
                       <Text style={styles.statValue} numberOfLines={1}>{complaint.is_anonymous ? 'Anonymous' : (complaint.anonymous_name || 'Guest User')}</Text>
                       <Text style={styles.statSub}>{complaint.category || 'General'}</Text>
                    </View>
                 </View>

                 {/* ── ASSIGNMENT INFO ── */}
                 <View style={styles.assignmentStats}>
                    <View style={styles.assignBox}>
                       <Feather name="user" size={14} color="#64748B" />
                       <Text style={styles.assignLabel}>SUPERVISOR:</Text>
                       <Text style={styles.assignValue}>{complaint.supervisor?.name || 'GMS Team'}</Text>
                    </View>
                    <View style={styles.assignBox}>
                       <Feather name="tag" size={14} color="#64748B" />
                       <Text style={styles.assignLabel}>CATEGORY:</Text>
                       <Text style={styles.assignValue}>{`${complaint.category}${complaint.subcategory ? ` / ${complaint.subcategory}` : ''}`}</Text>
                    </View>
                 </View>

                 {/* ── TIMELINE ── */}
                 <View style={styles.timelineContainer}>
                    <View style={styles.timelineItem}>
                       <View style={styles.timelineDot} />
                       <View>
                          <Text style={styles.timelineLabel}>REPORTED</Text>
                          <Text style={styles.timelineValue}>{new Date(complaint.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
                       </View>
                    </View>
                    <View style={[styles.timelineLine, { backgroundColor: '#E2E8F0' }]} />
                    <View style={styles.timelineItem}>
                       <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
                       <View>
                          <Text style={styles.timelineLabel}>RESOLVED</Text>
                          <Text style={styles.timelineValue}>{complaint.resolved_at ? new Date(complaint.resolved_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}</Text>
                       </View>
                    </View>
                 </View>

                 <View style={styles.summarySection}>
                    <View style={styles.sectionHeaderRow}>
                       <Text style={styles.sectionHeading}>TECHNICAL SUMMARY</Text>
                       <View style={styles.durationBadge}>
                          <Feather name="clock" size={10} color="#64748B" />
                          <Text style={styles.durationText}>
                             {complaint.started_at && complaint.resolved_at 
                               ? formatDuration(new Date(complaint.started_at), new Date(complaint.resolved_at))
                               : '—'}
                          </Text>
                       </View>
                    </View>
                    <View style={styles.notesContainer}>
                       <Text style={styles.notesText}>
                          {complaint.work_notes || 'The reported maintenance issue was addressed and verified according to standard operational procedures.'}
                       </Text>
                    </View>
                 </View>

                 {(!!complaint.before_media_url || !!complaint.after_media_url) && (
                   <View style={styles.summarySection}>
                      <Text style={styles.sectionHeading}>VISUAL AUDIT</Text>
                      <View style={styles.auditGrid}>
                         {!!complaint.before_media_url && (
                           <View style={styles.auditBox}>
                              <View style={styles.auditImgWrapper}>
                                {imgLoading.before && (
                                  <Skeleton width="100%" height={160} borderRadius={20} style={styles.skeletonPos} />
                                )}
                                <Image 
                                  source={{ uri: ensureFullUrl(complaint.before_media_url) as string }} 
                                  style={[styles.auditImg, imgLoading.before && { opacity: 0 }]} 
                                  onLoad={() => setImgLoading(prev => ({ ...prev, before: false }))}
                                  onError={() => {
                                    setImgLoading(prev => ({ ...prev, before: false }));
                                    setImgError(prev => ({ ...prev, before: true }));
                                  }}
                                />
                                {imgError.before && (
                                  <View style={styles.imgErrorOverlay}>
                                    <Feather name="image" size={20} color="#94A3B8" />
                                    <Text style={styles.imgErrorText}>Unable to load image</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.auditLabel}>BEFORE</Text>
                           </View>
                         )}
                         {!!complaint.after_media_url && (
                           <View style={styles.auditBox}>
                              <View style={styles.auditImgWrapper}>
                                {imgLoading.after && (
                                  <Skeleton width="100%" height={160} borderRadius={20} style={styles.skeletonPos} />
                                )}
                                <Image 
                                  source={{ uri: ensureFullUrl(complaint.after_media_url) as string }} 
                                  style={[styles.auditImg, imgLoading.after && { opacity: 0 }]} 
                                  onLoad={() => setImgLoading(prev => ({ ...prev, after: false }))}
                                  onError={() => {
                                    setImgLoading(prev => ({ ...prev, after: false }));
                                    setImgError(prev => ({ ...prev, after: true }));
                                  }}
                                />
                                {imgError.after && (
                                  <View style={styles.imgErrorOverlay}>
                                    <Feather name="image" size={20} color="#94A3B8" />
                                    <Text style={styles.imgErrorText}>Unable to load image</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.auditLabel}>AFTER</Text>
                           </View>
                         )}
                      </View>
                   </View>
                 )}

                 <View style={styles.modalFooter}>
                    <LinearGradient
                       colors={['#F8FAFC', '#F1F5F9']}
                       style={styles.verifyBadge}
                    >
                       <Feather name="check-shield" size={14} color="#10B981" />
                       <Text style={styles.verifyText}>AUTHENTICATED GMS REPORT</Text>
                    </LinearGradient>
                 </View>
              </ScrollView>
              <SoftButton title="Dismiss" onPress={() => setShowSummary(false)} style={{ marginTop: 24 }} />
           </Reanimated.View>
        </View>
      )}
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: '#F8FAFC' },
  center:{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#FFFFFF' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#64748B', fontWeight: '600' },
  errorTitle:  { fontSize: 22, fontWeight: '900', color: '#1E293B', marginTop: 24 },
  errorSub:    { fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 22 },

  // Header System
  headerContainer: {
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  glassBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitleGroup: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  refID: { fontSize: 12, fontWeight: '700', color: '#4F46E5', marginTop: 2 },
  refreshBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  
  liveIndicator: { width: 42, alignItems: 'flex-end' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  liveBadgeText: { fontSize: 10, fontWeight: '900', color: '#065F46' },

  statusSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mainStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10 },
  mainStatusText: { fontSize: 11, fontWeight: '900', color: 'white', letterSpacing: 0.5 },
  categoryBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100 },
  categoryBadgeText: { fontSize: 12, fontWeight: '700', color: '#475569' },

  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  
  // Cards
  premiumCard: { marginBottom: 20, padding: 24, borderRadius: 32 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2 },

  supervisorRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 18 },
  verifiedDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: 'white' },
  supervisorName: { fontSize: 17, fontWeight: '900', color: '#1E293B' },
  supervisorSub: { fontSize: 13, color: '#64748B', marginTop: 2 },
  contactIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' },

  gridRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  gridCard: { flex: 1, padding: 20, borderRadius: 28 },
  gridLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 6 },
  gridMain: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  gridSub: { fontSize: 12, color: '#64748B', marginTop: 4 },

  descriptionText: { fontSize: 15, color: '#475569', lineHeight: 24, fontWeight: '500' },

  evidenceGrid: { flexDirection: 'row', gap: 12 },
  evidenceBox: { flex: 1, height: 160, borderRadius: 20, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  evidenceImg: { width: '100%', height: '100%' },
  evidenceBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  evidenceBadgeText: { color: 'white', fontSize: 9, fontWeight: '900' },

  // Success Hero
  successCard: { marginBottom: 24, borderRadius: 32, overflow: 'hidden' },
  successGradient: { padding: 32, alignItems: 'center' },
  successIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 8 },
  successText: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  heroActions: { flexDirection: 'row', gap: 12, width: '100%' },
  heroActionBtn: { flex: 1, height: 52, backgroundColor: 'white', borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#10B981' },
  heroActionText: { fontSize: 15, fontWeight: '800', color: '#059669' },

  // Summary Modal
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 },
  modalBody: { backgroundColor: 'white', borderRadius: 36, padding: 32, width: '100%', maxWidth: 480, maxHeight: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#1E293B', letterSpacing: 1.5 },
  modalRef: { fontSize: 12, fontWeight: '700', color: '#4F46E5', marginTop: 4 },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },

  summaryStats: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 24, padding: 24, marginBottom: 32 },
  statItem: { flex: 1, gap: 6 },
  statLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.8 },
  statValue: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  statDivider: { width: 1, height: '100%', backgroundColor: '#E2E8F0', marginHorizontal: 20 },

  summarySection: { marginBottom: 32 },
  sectionHeading: { fontSize: 11, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 16 },
  notesContainer: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  notesText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },

  auditGrid: { flexDirection: 'row', gap: 16 },
  auditBox: { flex: 1, gap: 10 },
  auditImg: { width: '100%', height: 140, borderRadius: 20, backgroundColor: '#F1F5F9' },
  auditLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', textAlign: 'center' },

  modalFooter: { alignItems: 'center', marginTop: 8 },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  verifyText: { fontSize: 10, fontWeight: '800', color: '#64748B' },

  finalFooter: { marginTop: 40, alignItems: 'center', gap: 20 },
  footerLine: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  footerContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText:{ fontSize: 11, fontFamily: 'Inter_500Medium', color: '#CBD5E1' },
  skeletonPos: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  imgErrorOverlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  imgErrorText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#94A3B8' },

  // New Report Modal Styles
  modalBadges: { flexDirection: 'row', gap: 8, marginRight: 12 },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniBadgeText: { fontSize: 9, fontWeight: '900', color: 'white' },
  statSub: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  
  timelineContainer: { marginBottom: 32, gap: 0 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' },
  timelineLine: { width: 2, height: 20, marginLeft: 3, marginVertical: 4 },
  timelineLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.5 },
  timelineValue: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginTop: 1 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durationText: { fontSize: 11, fontWeight: '800', color: '#64748B' },

  auditImgWrapper: { width: '100%', height: 140, borderRadius: 20, backgroundColor: '#F1F5F9', overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },

  assignmentStats: { flexDirection: 'row', gap: 12, marginBottom: 32, paddingHorizontal: 4 },
  assignBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  assignLabel: { fontSize: 9, fontWeight: '900', color: '#94A3B8' },
  assignValue: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
});
