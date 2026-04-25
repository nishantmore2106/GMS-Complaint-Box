import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Rect, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { DashboardHeader } from '../DashboardHeader';
import { GMSCompanyCard } from './GMSCompanyCard';
import { useApp } from '@/context/AppContext';

interface FounderDashboardProps {
  founderStats: any;
  activeSites: any[];
  siteMetrics: any[];
  isDarkMode: boolean;
  t: (key: string, defaultValue: string) => string;
  setIsAddSiteVisible: (visible: boolean) => void;
  setIsAddSupVisible: (visible: boolean) => void;
  setIsAllocationVisible: (visible: boolean) => void;
}

export function FounderDashboard({
  founderStats,
  activeSites,
  siteMetrics,
  isDarkMode,
  t,
  setIsAddSiteVisible,
  setIsAddSupVisible,
  setIsAllocationVisible
}: FounderDashboardProps) {
  const { width } = useWindowDimensions();
  const { supervisorRequests, users, resolveSupervisorRequest, sites } = useApp();
  
  const pendingRequests = supervisorRequests.filter(r => r.status === 'pending');
  const assignedSupervisorIds = new Set(sites.map(s => s.assignedSupervisorId).filter(Boolean));
  const availableSupervisors = users.filter(u => 
    u.role === 'supervisor' && 
    u.status === 'active' && 
    !assignedSupervisorIds.has(u.id)
  );

  if (!founderStats) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={{ gap: 28, paddingBottom: 40 }}>
          
          {/* 1. Tactical Intelligence Bar (Glassmorphic Cards) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusBarContent}>
            <Pressable 
              style={[styles.glassCard, isDarkMode && styles.darkGlassCard, styles.activeGlow]}
              onPress={() => router.push("/(tabs)/complaints")}
            >
              <LinearGradient
                colors={isDarkMode ? ['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)'] : ['#FFF1F1', '#FFFFFF']}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: '#EF4444' }]}>
                    <Feather name="alert-triangle" size={14} color="white" />
                  </View>
                  <Text style={[styles.cardValue, { color: '#EF4444' }]}>{founderStats.activeIssueCount}</Text>
                </View>
                <Text style={[styles.cardLabel, isDarkMode && styles.darkTextSub]}>{t('active_issues', 'Active Issues')}</Text>
              </LinearGradient>
            </Pressable>

            <View style={[styles.glassCard, isDarkMode && styles.darkGlassCard]}>
              <LinearGradient
                colors={isDarkMode ? ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)'] : ['#FFFBEB', '#FFFFFF']}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: '#F59E0B' }]}>
                    <Feather name="shield" size={14} color="white" />
                  </View>
                  <Text style={[styles.cardValue, { color: '#F59E0B' }]}>{founderStats.criticalSiteCount}</Text>
                </View>
                <Text style={[styles.cardLabel, isDarkMode && styles.darkTextSub]}>{t('critical_sites', 'Critical Sites')}</Text>
              </LinearGradient>
            </View>

            <View style={[styles.glassCard, isDarkMode && styles.darkGlassCard]}>
              <LinearGradient
                colors={isDarkMode ? ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)'] : ['#F0FDF4', '#FFFFFF']}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: '#10B981' }]}>
                    <Feather name="check-circle" size={14} color="white" />
                  </View>
                  <Text style={[styles.cardValue, { color: '#10B981' }]}>{founderStats.resolvedTodayCount}</Text>
                </View>
                <Text style={[styles.cardLabel, isDarkMode && styles.darkTextSub]}>{t('resolved_today', 'Resolved Today')}</Text>
              </LinearGradient>
            </View>
          </ScrollView>

          {/* 2. Urgent Deployment Hero (Deep Inset Design) */}
          {founderStats.criticalSiteCount > 0 && (
            <View style={styles.heroContainer}>
              <LinearGradient
                colors={['#1E293B', '#0F172A'] as any}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroContent}>
                  <View style={styles.badgeRow}>
                    <View style={styles.pulseIndicator} />
                    <Text style={styles.heroBadgeText}>{t('immediate_action', 'IMMEDIATE ACTION REQUIRED')}</Text>
                  </View>
                  <Text style={styles.heroTitle}>{founderStats.criticalSites[0]?.name}</Text>
                  <Text style={styles.heroSub}>{t('site_alert_msg', 'Critical workload detected. Supervisor coordination advised.')}</Text>
                  
                  <Pressable style={styles.heroCTA} onPress={() => router.push("/(tabs)/sites")}>
                    <Text style={styles.heroCTAText}>{t('deploy_intel', 'Deploy Intel')}</Text>
                    <Feather name="zap" size={16} color="#0F172A" />
                  </Pressable>
                </View>
                <View style={styles.heroDecor}>
                   <Feather name="activity" size={120} color="rgba(255,255,255,0.05)" />
                </View>
              </LinearGradient>
            </View>
          )}

          {/* 2.5 Allocation Requests (New Feature) */}
          {pendingRequests.length > 0 && (
            <View style={styles.sectionContainer}>
               <View style={styles.sectionHeaderNoPad}>
                  <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
                    {t('allocation_requests', 'Allocation Requests')}
                  </Text>
                  <View style={styles.requestCount}>
                    <Text style={styles.requestCountText}>{pendingRequests.length}</Text>
                  </View>
               </View>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.requestsScroll}>
                  {pendingRequests.map(req => {
                    const site = sites.find(s => s.id === req.siteId);
                    return (
                      <View key={req.id} style={[styles.requestCard, isDarkMode && styles.darkCard]}>
                        <View style={styles.requestHeader}>
                           <Feather name="user" size={16} color="#6366F1" />
                           <Text style={[styles.requestSite, isDarkMode && styles.darkText]} numberOfLines={1}>
                             {site?.name || 'Unknown Site'}
                           </Text>
                        </View>
                        <Text style={styles.requestNotes} numberOfLines={2}>
                          {req.notes || 'No additional notes provided.'}
                        </Text>
                        <View style={styles.requestActions}>
                           <Pressable 
                             style={styles.approveBtn}
                             onPress={() => {
                               if (availableSupervisors.length === 0) {
                                 Alert.alert("No Supervisors", "Please add a supervisor first.");
                                 return;
                               }
                               Alert.alert(
                                 "Select Supervisor",
                                 "Choose a supervisor to assign:",
                                 availableSupervisors.map(s => ({
                                   text: s.name,
                                   onPress: () => resolveSupervisorRequest(req.id, 'approved', s.id)
                                 })).concat([{ text: "Cancel", style: "cancel" }])
                               );
                             }}
                           >
                             <Text style={styles.approveText}>Approve</Text>
                           </Pressable>
                           <Pressable 
                             style={styles.declineBtn}
                             onPress={() => resolveSupervisorRequest(req.id, 'rejected')}
                           >
                             <Feather name="x" size={16} color="#EF4444" />
                           </Pressable>
                        </View>
                      </View>
                    );
                  })}
               </ScrollView>
            </View>
          )}
          <View style={styles.shortcutContainer}>
             <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('operations', 'Operations')}</Text>
             <View style={styles.actionGrid}>
                {[
                  { label: 'Add Site', icon: 'plus-square', color: '#3B82F6', action: () => setIsAddSiteVisible(true) },
                  { label: 'All Sites', icon: 'map', color: '#F59E0B', action: () => router.push("/(tabs)/sites") },
                  { label: 'Staffing', icon: 'user-plus', color: '#10B981', action: () => setIsAddSupVisible(true) },
                  { label: 'All Staff', icon: 'users', color: '#EC4899', action: () => router.push("/admin/supervisors") },
                  { label: 'Analytics', icon: 'bar-chart-2', color: '#A855F7', action: () => router.push("/(tabs)/analytics") },
                  { label: 'Allocation', icon: 'layers', color: '#6366F1', action: () => setIsAllocationVisible(true) },
                ].map((item, idx) => (
                  <Pressable key={idx} style={[styles.tactileBtn, isDarkMode && styles.darkTactileBtn]} onPress={item.action}>
                     <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                        <Feather name={item.icon as any} size={22} color={item.color} />
                     </View>
                     <Text style={[styles.btnLabel, isDarkMode && styles.darkText]}>{t(item.label.toLowerCase().replace(' ', '_'), item.label)}</Text>
                  </Pressable>
                ))}
             </View>
          </View>

          {/* 4. Daily Performance Velocity (Tactile Chart) */}
          <View style={styles.chartSection}>
             <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('performance_velocity', 'Performance Velocity')}</Text>
             </View>
             <View style={[styles.chartWrapper, isDarkMode && styles.darkCard]}>
                <View style={styles.chartMeta}>
                   <Text style={styles.chartSub}>{t('weekly_trend', 'Daily Resolution Trend')}</Text>
                   <View style={styles.legend}>
                      <View style={[styles.legendDot, { backgroundColor: '#6366F1' }]} />
                      <Text style={styles.legendText}>{t('completed_tasks', 'Completed Tasks')}</Text>
                   </View>
                </View>
                
                <View style={styles.chartBox}>
                  <Svg width={width - 80} height={140}>
                    <Defs>
                       <SvgGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#6366F1" stopOpacity="1" />
                          <Stop offset="1" stopColor="#818CF8" stopOpacity="0.6" />
                       </SvgGradient>
                    </Defs>
                    {founderStats.chartData.map((d: any, i: number) => {
                      const maxV = Math.max(...(founderStats.chartData.map((cd: any) => cd.value) || [1]), 1);
                      const barW = 28;
                      const gap = ((width - 80) - (barW * 7)) / 6;
                      const h = (d.value / maxV) * 90;
                      const x = i * (barW + gap);
                      const y = 110 - h;
                      
                      return (
                        <G key={i}>
                          <Rect
                            x={x}
                            y={y}
                            width={barW}
                            height={h}
                            fill={d.isToday ? "url(#barGrad)" : (isDarkMode ? '#334155' : '#F1F5F9')}
                            rx={barW / 2}
                          />
                          {d.value > 0 && (
                            <SvgText
                              x={x + barW / 2}
                              y={y - 8}
                              fontSize="10"
                              fontFamily="Inter_800ExtraBold"
                              fill={isDarkMode ? '#94A3B8' : '#64748B'}
                              textAnchor="middle"
                            >
                              {d.value}
                            </SvgText>
                          )}
                          <SvgText
                            x={x + barW / 2}
                            y={132}
                            fontSize="9"
                            fontFamily="Inter_700Bold"
                            fill={d.isToday ? '#6366F1' : (isDarkMode ? '#475569' : '#94A3B8')}
                            textAnchor="middle"
                          >
                            {d.label.toUpperCase()}
                          </SvgText>
                        </G>
                      );
                    })}
                  </Svg>
                </View>
             </View>
          </View>

          {/* 5. Managed Logistics (Health Pulse) */}
          <View>
             <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('managed_logistics', 'Managed Logistics')}</Text>
                <Pressable onPress={() => router.push("/(tabs)/sites")}>
                   <Text style={styles.viewAll}>{t('view_all', 'View All')}</Text>
                </Pressable>
             </View>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sitesList}>
                {activeSites.map((site: any) => (
                  <Pressable 
                    key={site.id} 
                    style={[styles.siteTile, isDarkMode && styles.darkCard]}
                    onPress={() => router.push({ pathname: "/(tabs)/sites", params: { search: site.name } })}
                  >
                    <View style={styles.siteInfo}>
                       <Text style={[styles.siteName, isDarkMode && styles.darkText]} numberOfLines={1}>{site.name}</Text>
                       <Text style={styles.siteAddr} numberOfLines={1}>{site.address}</Text>
                    </View>
                    <View style={styles.siteStatus}>
                       <View style={[styles.healthDot, { backgroundColor: site.health === 'critical' ? '#EF4444' : (site.health === 'warning' ? '#F59E0B' : '#10B981') }]} />
                       <Text style={[styles.taskCount, isDarkMode && styles.darkText]}>{site.taskCount} {t('tasks_lower', 'tasks')}</Text>
                    </View>
                  </Pressable>
                ))}
             </ScrollView>
          </View>

          {/* 6. Company Identity */}
          <GMSCompanyCard isDarkMode={isDarkMode} />

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  statusBarContent: { paddingHorizontal: 24, gap: 16, paddingTop: 12 },
  glassCard: {
    width: 140,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'white',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 4 }
    }),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  darkGlassCard: {
    backgroundColor: Colors.dark.surface,
    borderColor: Colors.dark.borderStrong,
  },
  activeGlow: {
    borderColor: Colors.dark.accentGlow,
    shadowColor: Colors.dark.accent,
    shadowOpacity: 0.15,
  },
  cardGradient: { flex: 1, padding: 16, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardValue: { fontSize: 24, fontFamily: 'Inter_900Black' },
  cardLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#64748B' },
  heroContainer: { paddingHorizontal: 24 },
  heroGradient: { borderRadius: 36, overflow: 'hidden', padding: 28 },
  heroContent: { zIndex: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pulseIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  heroBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1 },
  heroTitle: { color: 'white', fontSize: 26, fontFamily: 'Inter_900Black', marginBottom: 8 },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 22, marginBottom: 20 },
  heroCTA: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, alignSelf: 'flex-start' },
  heroCTAText: { color: '#0F172A', fontSize: 14, fontFamily: 'Inter_800ExtraBold' },
  heroDecor: { position: 'absolute', right: -20, bottom: -20, zIndex: 1 },
  shortcutContainer: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#111827', marginBottom: 16 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tactileBtn: { 
    flex: 1, 
    minWidth: '48%', 
    height: 72, 
    backgroundColor: 'white', 
    borderRadius: 24, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  darkTactileBtn: { 
    backgroundColor: Colors.dark.surface, 
    borderColor: Colors.dark.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  btnLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  chartSection: { paddingHorizontal: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 },
  chartWrapper: { backgroundColor: 'white', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  chartMeta: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartSub: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#94A3B8' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#64748B' },
  chartBox: { alignItems: 'center' },
  sitesList: { paddingHorizontal: 24, gap: 16, paddingBottom: 8 },
  siteTile: { width: 200, padding: 24, backgroundColor: 'white', borderRadius: 32, borderWidth: 1, borderColor: '#F1F5F9', gap: 16 },
  siteInfo: { gap: 4 },
  siteName: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  siteAddr: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#94A3B8' },
  siteStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  taskCount: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#475569' },
  viewAll: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.inProgress },
  darkText: { color: Colors.dark.text },
  darkTextSub: { color: Colors.dark.textSub },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.borderStrong },
  sectionContainer: { paddingHorizontal: 24 },
  sectionHeaderNoPad: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  requestCount: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  requestCountText: { color: 'white', fontSize: 10, fontFamily: 'Inter_900Black' },
  requestsScroll: { gap: 12, paddingBottom: 10 },
  requestCard: { width: 240, backgroundColor: 'white', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  requestSite: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  requestNotes: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#94A3B8', marginBottom: 16, height: 32 },
  requestActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { flex: 1, backgroundColor: Colors.inProgress, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  approveText: { color: 'white', fontSize: 12, fontFamily: 'Inter_800ExtraBold' },
  declineBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
});
