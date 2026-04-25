import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, RefreshControl, ActivityIndicator, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();

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
        <View style={{ gap: 28, paddingTop: 12 }}>
          
          {/* 1. Tactical Intelligence Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusBarContent}>
             {[
               { label: 'Pending', count: supervisorStats.pendingCount, icon: 'clock', color: '#D97706', bg: '#FEF3C7' },
               { label: 'Active', count: supervisorStats.inProgressCount, icon: 'activity', color: '#2563EB', bg: '#DBEAFE' },
               { label: 'Today', count: supervisorStats.completedTodayCount, icon: 'check-circle', color: '#10B981', bg: '#D1FAE5' },
             ].map((item, idx) => (
               <View key={idx} style={[styles.glassCard, isDarkMode && styles.darkGlassCard]}>
                  <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                     <Feather name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <View>
                     <Text style={[styles.cardValue, isDarkMode && styles.darkText]}>{item.count}</Text>
                     <Text style={styles.cardLabel}>{t(item.label.toLowerCase(), item.label)}</Text>
                  </View>
               </View>
             ))}
          </ScrollView>

          {/* 2. Deployment Hub (Glassmorphic Hero) */}
          <View style={styles.heroContainer}>
            {supervisorStats.urgentTasks.length > 0 ? (
              <LinearGradient
                colors={['#1E293B', '#0F172A'] as any}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.heroContent}>
                  <View style={styles.badgeRow}>
                    <View style={styles.pulseIndicator} />
                    <Text style={styles.heroBadgeText}>{supervisorStats.urgentTasks.length} {t('urgent_missions', 'URGENT MISSIONS')}</Text>
                  </View>
                  <Text style={styles.heroTitle}>{supervisorStats.urgentTasks[0].category}</Text>
                  <Text style={styles.heroSite}>{supervisorStats.urgentTasks[0].siteName}</Text>
                  
                  <Pressable 
                    style={styles.heroCTA} 
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push(`/complaint/${supervisorStats.urgentTasks[0].id}`);
                    }}
                  >
                    <Text style={styles.heroCTAText}>{t('commence_work', 'Commence Work')}</Text>
                    <Feather name="zap" size={16} color="#0F172A" />
                  </Pressable>
                </View>
                <View style={styles.heroDecor}>
                   <Feather name="target" size={100} color="rgba(96,165,250,0.1)" />
                </View>
              </LinearGradient>
            ) : (
              <View style={[styles.emptyHero, isDarkMode && styles.darkCard]}>
                 <View style={styles.emptyIconBox}>
                    <Feather name="shield" size={32} color="#10B981" />
                 </View>
                 <Text style={[styles.emptyTitle, isDarkMode && styles.darkText]}>{t('ops_stable', 'Operations Stable')}</Text>
                 <Text style={styles.emptySub}>{t('all_clear_msg', 'No urgent missions require immediate deployment.')}</Text>
              </View>
            )}
          </View>

          {/* 3. Next Best Action (Tactile Suggestion) */}
          {supervisorStats.nextBest && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('next_best_action', 'Next Best Action')}</Text>
              <Pressable 
                style={[styles.suggestionCard, isDarkMode && styles.darkCard]} 
                onPress={() => router.push(`/complaint/${supervisorStats.nextBest!.id}`)}
              >
                <View style={styles.suggestionIconBox}>
                  <Feather name="navigation" size={20} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionHint}>{t('optimized_route', 'Optimized Route')}</Text>
                  <Text style={[styles.suggestionValue, isDarkMode && styles.darkText]}>{supervisorStats.nextBest.siteName}</Text>
                  <Text style={styles.suggestionSub}>{t('oldest_pending', 'Oldest')} {supervisorStats.nextBest.category}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#94A3B8" />
              </Pressable>
            </View>
          )}

          {/* 4. Workflow Precision (Tactile Progress) */}
          <View style={styles.sectionContainer}>
             <View style={styles.headerRow}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('workflow_efficiency', 'Workflow Efficiency')}</Text>
                <Text style={styles.progressVal}>{Math.round(supervisorStats.progress * 100)}%</Text>
             </View>
             <View style={[styles.progressWrapper, isDarkMode && styles.darkCard]}>
                <View style={styles.progressBarBg}>
                   <LinearGradient
                      colors={['#3B82F6', '#60A5FA'] as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressBarFill, { width: `${supervisorStats.progress * 100}%` }]}
                   />
                </View>
                <Text style={styles.progressSub}>{t('completed_today_summary', `Mission success rate: ${supervisorStats.completedTodayCount} tasks finalized today`)}</Text>
             </View>
          </View>

          {/* 5. Managed Logistics (Site Status) */}
          <View style={styles.sectionContainer}>
             <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('managed_logistics', 'Managed Logistics')}</Text>
             <View style={styles.sitesGrid}>
                {supervisorStats.mySites.map((s: any) => (
                  <Pressable 
                    key={s.id} 
                    style={[styles.sitePill, isDarkMode && styles.darkCard]}
                    onPress={() => router.push({ pathname: "/(tabs)/sites", params: { search: s.name } })}
                  >
                    <View style={[styles.healthIndicator, { backgroundColor: s.health === 'critical' ? '#EF4444' : (s.health === 'warning' ? '#F59E0B' : '#10B981') }]} />
                    <View style={{ flex: 1 }}>
                       <Text style={[styles.siteName, isDarkMode && styles.darkText]} numberOfLines={1}>{s.name}</Text>
                       <Text style={styles.siteTasks}>{s.taskCount} {t('active_tasks_lower', 'active')}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#94A3B8" />
                  </Pressable>
                ))}
             </View>
          </View>

          {/* 6. Tactical Worklist */}
          <View style={[styles.sectionContainer, { marginBottom: 40 }]}>
             <View style={styles.headerRow}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('tactical_worklist', 'Tactical Worklist')}</Text>
                <View style={styles.countBadge}>
                   <Text style={styles.countText}>{supervisorStats.activeTasks?.length || 0}</Text>
                </View>
             </View>
             <View style={styles.worklist}>
                {supervisorStats.activeTasks && supervisorStats.activeTasks.length > 0 ? (
                  supervisorStats.activeTasks.map((c: any) => (
                    <ComplaintCard key={c.id} complaint={c} />
                  ))
                ) : (
                  <View style={[styles.emptyTasks, isDarkMode && styles.darkCard]}>
                    <Feather name="sun" size={24} color="#10B981" />
                    <Text style={styles.emptyTasksText}>{t('no_active_tasks', 'Tactical board clear. All missions completed.')}</Text>
                  </View>
                )}
             </View>
          </View>

          {/* 7. Company Identity */}
          <GMSCompanyCard isDarkMode={isDarkMode} />

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  statusBarContent: { paddingHorizontal: 24, gap: 12, paddingTop: 12 },
  glassCard: {
    width: 130,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  darkGlassCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.borderStrong },
  iconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardValue: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827' },
  cardLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  heroContainer: { paddingHorizontal: 24 },
  heroGradient: { borderRadius: 36, overflow: 'hidden', padding: 28 },
  heroContent: { zIndex: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pulseIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  heroBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 1 },
  heroTitle: { color: 'white', fontSize: 26, fontFamily: 'Inter_900Black', marginBottom: 4 },
  heroSite: { color: '#60A5FA', fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 24 },
  heroCTA: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 100, alignSelf: 'flex-start' },
  heroCTAText: { color: '#0F172A', fontSize: 14, fontFamily: 'Inter_800ExtraBold' },
  heroDecor: { position: 'absolute', right: -10, bottom: -10, zIndex: 1 },
  emptyHero: { padding: 40, backgroundColor: 'white', borderRadius: 36, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#111827' },
  emptySub: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  sectionContainer: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827', marginBottom: 16 },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 28, gap: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  suggestionIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  suggestionHint: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#94A3B8' },
  suggestionValue: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827', marginVertical: 2 },
  suggestionSub: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressVal: { fontSize: 16, fontFamily: 'Inter_900Black', color: '#3B82F6' },
  progressWrapper: { backgroundColor: 'white', padding: 20, borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9' },
  progressBarBg: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressSub: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#94A3B8', marginTop: 12 },
  sitesGrid: { gap: 12 },
  sitePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  healthIndicator: { width: 4, height: 24, borderRadius: 2 },
  siteName: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  siteTasks: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#94A3B8' },
  countBadge: { backgroundColor: '#3B82F615', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  countText: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#3B82F6' },
  worklist: { gap: 16 },
  emptyTasks: { padding: 40, borderRadius: 28, backgroundColor: '#F8FAFC', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  emptyTasksText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#94A3B8', textAlign: 'center' },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.borderStrong },
  darkText: { color: Colors.dark.text },
});
