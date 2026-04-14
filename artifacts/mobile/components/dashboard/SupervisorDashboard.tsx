import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { DashboardHeader } from '../DashboardHeader';
import { ComplaintCard } from '../ComplaintCard';
import { GMSCompanyCard } from './GMSCompanyCard';

interface SupervisorDashboardProps {
  supervisorStats: any;
  isDarkMode: boolean;
  t: (key: string, defaultValue: string) => string;
  refreshData: () => Promise<void>;
}

export function SupervisorDashboard({
  supervisorStats,
  isDarkMode,
  t,
  refreshData
}: SupervisorDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  if (!supervisorStats) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh} 
            tintColor={isDarkMode ? '#ffffff' : Colors.primary}
          />
        }
      >
        <View style={{ gap: 24, paddingTop: 10 }}>
          {/* 1. Live Status Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sStatusScroll}>
            <View style={[styles.sStatusPill, isDarkMode && styles.darkCard]}>
              <View style={[styles.sStatusIconBox, { backgroundColor: isDarkMode ? 'rgba(217,119,6,0.1)' : '#FEF3C7' }]}>
                <Feather name="clock" size={16} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.sStatusVal, isDarkMode && { color: 'white' }]}>{supervisorStats.pendingCount}</Text>
                <Text style={[styles.sStatusLabel, isDarkMode && { color: '#94A3B8' }]}>{t('pending', 'Pending')}</Text>
              </View>
            </View>
            <View style={[styles.sStatusPill, isDarkMode && styles.darkCard]}>
              <View style={[styles.sStatusIconBox, { backgroundColor: isDarkMode ? 'rgba(37,99,235,0.1)' : '#DBEAFE' }]}>
                <Feather name="activity" size={16} color="#2563EB" />
              </View>
              <View>
                <Text style={[styles.sStatusVal, isDarkMode && { color: 'white' }]}>{supervisorStats.inProgressCount}</Text>
                <Text style={[styles.sStatusLabel, isDarkMode && { color: '#94A3B8' }]}>{t('active', 'Active')}</Text>
              </View>
            </View>
            <View style={[styles.sStatusPill, isDarkMode && styles.darkCard]}>
              <View style={[styles.sStatusIconBox, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : '#D1FAE5' }]}>
                <Feather name="check-circle" size={16} color="#10B981" />
              </View>
              <View>
                <Text style={[styles.sStatusVal, isDarkMode && { color: 'white' }]}>{supervisorStats.completedTodayCount}</Text>
                <Text style={[styles.sStatusLabel, isDarkMode && { color: '#94A3B8' }]}>{t('today', 'Today')}</Text>
              </View>
            </View>
          </ScrollView>

          {/* 2. Urgent Task Hero */}
          {supervisorStats.urgentTasks.length > 0 ? (
            <LinearGradient
              colors={['#0F172A', '#1E293B'] as any}
              style={styles.sUrgentHero}
            >
              <View style={styles.sUrgentGlass}>
                <View style={styles.sUrgentHeader}>
                  <View style={styles.sAlertBadge}>
                    <View style={styles.sPulseDot} />
                    <Text style={styles.sAlertText}>{supervisorStats.urgentTasks.length} {t('urgent', 'URGENT')}</Text>
                  </View>
                  <Text style={styles.sTimeText}>{t('immediate_action', 'Immediate Action')}</Text>
                </View>

                <View style={styles.sUrgentMain}>
                  <Text style={styles.sUrgentTitle}>{supervisorStats.urgentTasks[0].category}</Text>
                  <Text style={styles.sUrgentSite}>{supervisorStats.urgentTasks[0].siteName}</Text>
                  <Text style={styles.sUrgentDesc} numberOfLines={2}>{supervisorStats.urgentTasks[0].description}</Text>
                </View>

                <Pressable
                  style={styles.sStartBtn}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/complaint/${supervisorStats.urgentTasks[0].id}`);
                  }}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB'] as any}
                    style={styles.sStartBtnGradient}
                  >
                    <Text style={styles.sStartBtnText}>{t('resolve_now', 'Commence Work')}</Text>
                    <Feather name="zap" size={16} color="white" />
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={isDarkMode ? ['#1E293B', '#0F172A'] : ['#ECFDF5', '#D1FAE5']}
              style={[styles.sUrgentHero, { borderWidth: isDarkMode ? 1 : 0, borderColor: '#334155' }]}
            >
              <View style={[styles.sUrgentGlass, { alignItems: 'center', paddingVertical: 40 }]}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : 'white', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}>
                  <Feather name="shield" size={32} color="#10B981" />
                </View>
                <Text style={[styles.sEmptyHeroTitle, isDarkMode && { color: 'white' }, { textAlign: 'center', fontSize: 20 }]}>{t('operations_stable', 'Operations Stable')}</Text>
                <Text style={[styles.sEmptyHeroSub, isDarkMode && { color: '#94A3B8' }, { textAlign: 'center', lineHeight: 22, marginTop: 8 }]}>{t('operations_managed_long', 'No critical or urgent tasks require your immediate attention.')}</Text>
              </View>
            </LinearGradient>
          )}

          {/* 3. Next Best Action */}
          {supervisorStats.nextBest && (
            <View style={{ paddingHorizontal: 24 }}>
              <Text style={[styles.sSectionLabel, isDarkMode && styles.darkTextSub]}>{t('next_best_action', 'NEXT BEST ACTION')}</Text>
              <Pressable style={[styles.sSmartCard, isDarkMode && styles.darkCard]} onPress={() => router.push(`/complaint/${supervisorStats.nextBest!.id}`)}>
                <View style={[styles.sSmartIconBox, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }]}>
                  <Feather name="zap" size={20} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sSmartHint, isDarkMode && styles.darkText]}>{t('go_to', 'Go to')} {supervisorStats.nextBest.siteName}</Text>
                  <Text style={[styles.sSmartValue, isDarkMode && styles.darkTextSub]}>{t('oldest_pending', 'Oldest pending')} {supervisorStats.nextBest.category}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={isDarkMode ? Colors.dark.textMuted : Colors.textMuted} />
              </Pressable>
            </View>
          )}

          {/* 4. Quick Actions */}
          <View style={styles.sQuickGrid}>
            <Pressable style={[styles.sQuickBtn, isDarkMode && styles.darkCard]} onPress={handleRefresh} disabled={refreshing}>
              <View style={[styles.sQuickIcon, { backgroundColor: isDarkMode ? Colors.dark.surfaceElevated : '#F3F4F6' }]}>
                {refreshing ? (
                  <ActivityIndicator color={isDarkMode ? Colors.dark.text : "#111827"} size="small" />
                ) : (
                  <Feather name="refresh-cw" size={20} color={isDarkMode ? Colors.dark.text : "#111827"} />
                )}
              </View>
              <Text style={[styles.sQuickLabel, isDarkMode && styles.darkText]}>{refreshing ? t('refreshing', 'Refreshing...') : t('refresh', 'Refresh')}</Text>
            </Pressable>
            <Pressable style={[styles.sQuickBtn, isDarkMode && styles.darkCard]} onPress={() => router.push("/(tabs)/sites")}>
              <View style={[styles.sQuickIcon, { backgroundColor: isDarkMode ? Colors.dark.surfaceElevated : '#F3F4F6' }]}>
                <Feather name="map" size={20} color={isDarkMode ? Colors.dark.text : "#111827"} />
              </View>
              <Text style={[styles.sQuickLabel, isDarkMode && styles.darkText]}>{t('view_sites', 'View Sites')}</Text>
            </Pressable>
            <Pressable style={[styles.sQuickBtn, isDarkMode && styles.darkCard]} onPress={() => router.push("/(tabs)/complaints")}>
              <View style={[styles.sQuickIcon, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : '#146A6515' }]}>
                <Feather name="clipboard" size={20} color={isDarkMode ? '#60A5FA' : Colors.primary} />
              </View>
              <Text style={[styles.sQuickLabel, isDarkMode && styles.darkText]}>{t('tasks', 'Tasks')}</Text>
            </Pressable>
          </View>

          {/* 5. Workload Indicator */}
          <View style={{ paddingHorizontal: 24 }}>
            <View style={styles.sWorkloadHeader}>
              <Text style={[styles.sSectionLabel, isDarkMode && { color: '#64748B' }]}>{t('todays_workload', "TODAY'S WORKLOAD")}</Text>
              <Text style={[styles.sWorkloadVal, isDarkMode && { color: Colors.primary }]}>{Math.round(supervisorStats.progress * 100)}%</Text>
            </View>
            <View style={[styles.sProgressBg, isDarkMode && { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
              <View style={[styles.sProgressFill, { width: `${supervisorStats.progress * 100}%` }]} />
            </View>
            <Text style={[styles.sProgressSub, isDarkMode && { color: Colors.dark.textMuted }]}>{t('completed_tasks_count', `You completed ${supervisorStats.completedTodayCount} tasks today`)}</Text>
          </View>

          {/* 6. Managed Sites Overview */}
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={[styles.sSectionLabel, isDarkMode && { color: '#64748B' }]}>{t('managed_sites', 'MY MANAGED SITES')}</Text>
            {supervisorStats.mySites.map((s: any) => {
              const healthColor = s.health === 'critical' ? '#EF4444' : (s.health === 'warning' ? '#F59E0B' : '#10B981');
              const healthBg = isDarkMode ? `${healthColor}20` : `${healthColor}15`;

              return (
                <Pressable 
                  key={s.id} 
                  style={[styles.sSiteCard, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]} 
                  onPress={() => router.push({ pathname: "/(tabs)/sites", params: { search: s.name } })}
                >
                  <View style={[styles.sSiteStatusDot, { backgroundColor: healthColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sSiteName, isDarkMode && { color: 'white' }]}>{s.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.sSiteTaskCount, isDarkMode && { color: '#94A3B8' }]}>
                        {s.taskCount} {t('active_tasks_lower', 'active')}
                      </Text>
                      {s.highPriorityCount > 0 && (
                        <>
                          <Text style={{ color: '#94A3B8', fontSize: 10 }}>•</Text>
                          <Text style={{ color: '#EF4444', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                            {s.highPriorityCount} {t('urgent', 'urgent')}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View style={[styles.sHealthBadge, { backgroundColor: healthBg }]}>
                    <Text style={[styles.sHealthText, { color: healthColor }]}>
                      {s.health.toUpperCase()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* 7. Active Worklist */}
          <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
            <View style={styles.sWorkloadHeader}>
               <Text style={[styles.sSectionLabel, isDarkMode && { color: '#64748B' }]}>{t('active_worklist', 'ACTIVE WORKLIST')}</Text>
               <View style={styles.sCountBadge}>
                 <Text style={styles.sCountText}>{supervisorStats.activeTasks?.length || 0}</Text>
               </View>
            </View>
            <View style={{ gap: 16 }}>
              {supervisorStats.activeTasks && supervisorStats.activeTasks.length > 0 ? (
                supervisorStats.activeTasks.map((c: any) => (
                  <ComplaintCard key={c.id} complaint={c} />
                ))
              ) : (
                <View style={[styles.sEmptyTasks, isDarkMode && styles.darkCard]}>
                  <Feather name="check-circle" size={24} color="#10B981" />
                  <Text style={[styles.sEmptyTasksText, isDarkMode && { color: '#94A3B8' }]}>{t('no_active_tasks', 'All caught up! No active tasks.')}</Text>
                </View>
              )}
            </View>
          </View>

          {/* 8. GMS Company Card */}
          <GMSCompanyCard isDarkMode={isDarkMode} />

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  sStatusScroll: { paddingHorizontal: 24, gap: 12 },
  sStatusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 20, minWidth: 120, gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border },
  sStatusIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sStatusVal: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827' },
  sStatusLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#64748B' },
  sUrgentHero: { marginHorizontal: 24, borderRadius: 32, padding: 4, overflow: 'hidden' },
  sUrgentGlass: { padding: 20, backgroundColor: 'rgba(255,255,255,0.02)' },
  sUrgentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sAlertBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  sPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  sAlertText: { color: '#EF4444', fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  sTimeText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  sUrgentMain: { marginBottom: 24 },
  sUrgentTitle: { color: 'white', fontSize: 24, fontFamily: 'Inter_900Black', marginBottom: 4 },
  sUrgentSite: { color: '#60A5FA', fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  sUrgentDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 20 },
  sStartBtn: { borderRadius: 16, overflow: 'hidden' },
  sStartBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  sStartBtnText: { color: 'white', fontSize: 14, fontFamily: 'Inter_800ExtraBold' },
  sEmptyHeroTitle: { color: Colors.text, fontSize: 18, fontFamily: 'Inter_800ExtraBold' },
  sEmptyHeroSub: { color: Colors.textMuted, fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 4 },
  sSectionLabel: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 1, marginBottom: 12 },
  darkTextSub: { color: Colors.dark.textSub },
  darkText: { color: 'white' },
  sSmartCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 24, gap: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  sSmartIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  sSmartHint: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#64748B' },
  sSmartValue: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  sQuickGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 12 },
  sQuickBtn: { flex: 1, backgroundColor: 'white', borderRadius: 24, padding: 16, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#F1F5F9' },
  sQuickIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  sQuickLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#111827' },
  sWorkloadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sWorkloadVal: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: Colors.primary },
  sProgressBg: { width: '100%', height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  sProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  sProgressSub: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginTop: 8 },
  sSiteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 24, gap: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  sSiteStatusDot: { width: 8, height: 8, borderRadius: 4 },
  sSiteName: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  sSiteTaskCount: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  sHealthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  sHealthText: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },
  sCountBadge: { backgroundColor: Colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  sCountText: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: Colors.primary },
  sEmptyTasks: { padding: 32, borderRadius: 24, backgroundColor: '#F8FAFC', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  sEmptyTasksText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#64748B', textAlign: 'center' },
});
