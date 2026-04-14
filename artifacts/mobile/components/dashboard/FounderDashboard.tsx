import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { DashboardHeader } from '../DashboardHeader';
import { GMSCompanyCard } from './GMSCompanyCard';

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

  if (!founderStats) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={{ gap: 24, paddingBottom: 40 }}>
          {/* 1. Business Status Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 10, marginTop: 10 }}>
            <Pressable 
              style={[styles.statusCard, isDarkMode && styles.darkCard, isDarkMode && styles.darkCardGlow]}
              onPress={() => router.push("/(tabs)/complaints")}
            >
              <View style={[styles.sStatusIconCircle, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : '#FEE2E2' }]}>
                <Feather name="alert-circle" size={14} color="#EF4444" />
              </View>
              <Text style={[styles.sStatusNum, { color: '#EF4444' }]}>{founderStats.activeIssueCount}</Text>
              <Text style={[styles.sStatusLabel, isDarkMode && styles.darkTextSub]}>{t('active_issues', 'Active Issues')}</Text>
            </Pressable>
            <View style={[styles.statusCard, isDarkMode && styles.darkCard]}>
              <View style={[styles.sStatusIconCircle, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.1)' : '#FEF3C7' }]}>
                <Feather name="map-pin" size={14} color="#F59E0B" />
              </View>
              <Text style={[styles.sStatusNum, { color: '#F59E0B' }]}>{founderStats.criticalSiteCount}</Text>
              <Text style={[styles.sStatusLabel, isDarkMode && styles.darkTextSub]}>{t('sites_attention', 'Sites Needing Attention')}</Text>
            </View>
            <View style={[styles.statusCard, isDarkMode && styles.darkCard]}>
              <View style={[styles.sStatusIconCircle, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : '#DCFCE7' }]}>
                <Feather name="check-circle" size={14} color="#10B981" />
              </View>
              <Text style={[styles.sStatusNum, { color: '#10B981' }]}>{founderStats.resolvedTodayCount}</Text>
              <Text style={[styles.sStatusLabel, isDarkMode && styles.darkTextSub]}>{t('resolved_today', 'Resolved Today')}</Text>
            </View>
          </ScrollView>

          {/* 2. Critical Alerts Card */}
          {founderStats.criticalSiteCount > 0 && (
            <LinearGradient
              colors={['#EF4444', '#DC2626'] as any}
              style={styles.fCriticalHero}
            >
              <View style={styles.fHeroContent}>
                <View style={styles.fAlertBadge}>
                  <View style={styles.fPulseRing} />
                  <Text style={styles.fAlertBadgeText}>{founderStats.criticalSiteCount} {t('sites_critical', 'SITES CRITICAL')}</Text>
                </View>
                <Text style={styles.fHeroTitle}>{founderStats.criticalSites[0]?.name} {t('immediate_attention', 'Needs Immediate Attention')}</Text>
                <Text style={styles.fHeroSub}>{t('site_report_hint', 'Check current issues and supervisor status for this location.')}</Text>
                <Pressable style={styles.fHeroCTA} onPress={() => router.push("/(tabs)/sites")}>
                  <Text style={styles.fHeroCTAText}>{t('view_sites', 'View Sites')}</Text>
                  <Feather name="arrow-right" size={16} color="white" />
                </Pressable>
              </View>
            </LinearGradient>
          )}

          {/* 3. Decision Shortcuts */}
          <View style={styles.fActionGrid}>
            <Pressable style={[styles.fActionBtn, isDarkMode && styles.darkCard]} onPress={() => setIsAddSiteVisible(true)}>
              <View style={[styles.fActionIcon, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : '#EFF6FF' }]}>
                <Feather name="plus-square" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.fActionLabel, isDarkMode && styles.darkTextSub]}>{t('add_site', 'Add Site')}</Text>
            </Pressable>
            <Pressable style={[styles.fActionBtn, isDarkMode && styles.darkCard]} onPress={() => setIsAddSupVisible(true)}>
              <View style={[styles.fActionIcon, { backgroundColor: isDarkMode ? 'rgba(34,197,94,0.1)' : '#F0FDF4' }]}>
                <Feather name="user-plus" size={24} color="#22C55E" />
              </View>
              <Text style={[styles.fActionLabel, isDarkMode && styles.darkTextSub]}>{t('add_supervisor', 'Add Supervisor')}</Text>
            </Pressable>
            <Pressable style={[styles.fActionBtn, isDarkMode && styles.darkCard]} onPress={() => router.push("/admin/supervisors")}>
              <View style={[styles.fActionIcon, { backgroundColor: isDarkMode ? 'rgba(71,85,105,0.1)' : '#F8FAFC' }]}>
                <Feather name="users" size={24} color="#64748B" />
              </View>
              <Text style={[styles.fActionLabel, isDarkMode && styles.darkTextSub]}>{t('all_staff', 'All Staff')}</Text>
            </Pressable>
            <Pressable style={[styles.fActionBtn, isDarkMode && styles.darkCard]} onPress={() => router.push("/(tabs)/analytics")}>
              <View style={[styles.fActionIcon, { backgroundColor: isDarkMode ? 'rgba(168,85,247,0.1)' : '#FAF5FF' }]}>
                <Feather name="pie-chart" size={24} color="#A855F7" />
              </View>
              <Text style={[styles.fActionLabel, isDarkMode && styles.darkTextSub]}>{t('analytics', 'Analytics')}</Text>
            </Pressable>
            <Pressable style={[styles.fActionBtn, isDarkMode && styles.darkCard]} onPress={() => router.push("/admin/audit-logs")}>
              <View style={[styles.fActionIcon, { backgroundColor: isDarkMode ? 'rgba(249,115,22,0.1)' : '#FFF7ED' }]}>
                <Feather name="file-text" size={24} color="#F97316" />
              </View>
              <Text style={[styles.fActionLabel, isDarkMode && styles.darkTextSub]}>{t('audit_trail', 'Audit Trail')}</Text>
            </Pressable>
            <Pressable style={[styles.fActionBtn, isDarkMode && styles.darkCard]} onPress={() => setIsAllocationVisible(true)}>
              <View style={[styles.fActionIcon, { backgroundColor: isDarkMode ? 'rgba(99,102,241,0.1)' : '#EEF2FF' }]}>
                <Feather name="layers" size={24} color="#6366F1" />
              </View>
              <Text style={[styles.fActionLabel, isDarkMode && styles.darkTextSub]}>{t('site_allocation', 'Site Allocation')}</Text>
            </Pressable>
          </View>

          {/* 4. Active Locations */}
          <View>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionHeading, { paddingHorizontal: 24, marginBottom: 0 }, isDarkMode && { color: 'white' }]}>{t('active_locations', 'Active Locations')}</Text>
              <Pressable onPress={() => router.push("/(tabs)/sites")} style={{ paddingRight: 24 }}>
                <Text style={styles.viewAllText}>{t('view_all', 'View all')}</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12, gap: 16 }}
            >
              {activeSites.map((site: any) => {
                const healthColor = site.health === 'critical' ? '#EF4444' : (site.health === 'warning' ? '#F59E0B' : '#10B981');
                const healthBg = isDarkMode ? `${healthColor}20` : (site.health === 'critical' ? '#FEE2E2' : '#DCFCE7');

                return (
                  <Pressable 
                    key={site.id} 
                    style={[styles.fSiteCard, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]} 
                    onPress={() => router.push({ pathname: "/(tabs)/sites", params: { search: site.name } })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fSiteName, isDarkMode && { color: 'white' }]} numberOfLines={1}>{site.name}</Text>
                      <View style={styles.fSiteMetaRow}>
                        <Feather name="map-pin" size={12} color={Colors.textMuted} />
                        <Text style={styles.fSiteMetaText} numberOfLines={1}>{site.address}</Text>
                      </View>
                      <View style={[styles.fSiteMetaRow, { marginTop: 4 }]}>
                        <Feather name="tool" size={12} color={site.health === 'critical' ? '#EF4444' : Colors.textMuted} />
                        <Text style={[styles.fSiteMetaText, site.health === 'critical' && { color: '#EF4444', fontFamily: 'Inter_700Bold' }]}>
                          {site.taskCount} {t('active_tasks_lower', 'active')}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.fHealthBadge, { backgroundColor: healthBg }]}>
                      <Text style={[styles.fHealthText, { color: healthColor }]}>
                        {site.health === 'critical' ? t('critical', 'CRITICAL') : (site.health === 'warning' ? t('warning', 'WARNING') : t('healthy', 'HEALTHY'))}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* 5. Business Activity Chart */}
          <View style={{ paddingHorizontal: 24 }}>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionHeading, { paddingHorizontal: 0 }, isDarkMode && { color: 'white' }]}>Business Activity</Text>
            </View>
            <View style={[styles.chartContainer, isDarkMode && styles.darkCard]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, isDarkMode && styles.darkTextSub]}>{t('daily_tasks_trend', 'Daily Completed Tasks (Last 7 Days)')}</Text>
              </View>
              <View style={styles.barChartBox}>
                <Svg width={width - 64} height={120}>
                  {founderStats?.chartData.map((d: any, i: number) => {
                    const maxV = Math.max(...(founderStats?.chartData.map((cd: any) => cd.value) || [1]), 1);
                    const barW = 24;
                    const gap = ((width - 64) - (barW * 7)) / 6;
                    const h = (d.value / maxV) * 80;
                    const x = i * (barW + gap);
                    const y = 100 - h;
                    
                    return (
                      <G key={i}>
                        <Rect
                          x={x}
                          y={y}
                          width={barW}
                          height={h}
                          fill={d.isToday ? '#6366F1' : isDarkMode ? '#1E293B' : '#E2E8F0'}
                          rx={4}
                        />
                        {d.value > 0 && (
                          <SvgText
                            x={x + barW / 2}
                            y={y - 6}
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
                          y={118}
                          fontSize="9"
                          fontFamily="Inter_600SemiBold"
                          fill={d.isToday ? '#6366F1' : isDarkMode ? '#64748B' : '#94A3B8'}
                          textAnchor="middle"
                        >
                          {d.label}
                        </SvgText>
                      </G>
                    );
                  })}
                </Svg>
              </View>
            </View>
          </View>

          {/* 6. Operations Health Bar */}
          <View style={{ paddingHorizontal: 24 }}>
            <View style={styles.sWorkloadHeader}>
              <Text style={[styles.sSectionLabel, isDarkMode && { color: '#475569' }]}>{t('ops_health', 'OPERATIONS HEALTH')}</Text>
              <Text style={[styles.sWorkloadVal, isDarkMode && { color: '#60A5FA' }]}>{Math.round(founderStats.healthProgress * 100)}%</Text>
            </View>
            <View style={[styles.sProgressBg, isDarkMode && { backgroundColor: '#334155', borderColor: '#475569' }]}>
              <View style={[styles.sProgressFill, { width: `${founderStats.healthProgress * 100}%`, backgroundColor: founderStats.healthProgress > 0.8 ? '#10B981' : '#F59E0B' }]} />
            </View>
            <Text style={[styles.sProgressSub, isDarkMode && { color: '#94A3B8' }]}>
              {founderStats.healthMessage}
            </Text>
          </View>

          {/* 7. GMS Company Card */}
          <GMSCompanyCard isDarkMode={isDarkMode} />

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  statusCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 24,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 }
    }),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border },
  darkCardGlow: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  sStatusIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sStatusNum: { fontSize: 20, fontFamily: 'Inter_900Black' },
  sStatusLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  darkTextSub: { color: Colors.dark.textSub },
  fCriticalHero: { marginHorizontal: 24, borderRadius: 32, padding: 24, marginTop: 10 },
  fHeroContent: { gap: 12 },
  fAlertBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, alignSelf: 'flex-start' },
  fPulseRing: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
  fAlertBadgeText: { color: 'white', fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  fHeroTitle: { color: 'white', fontSize: 20, fontFamily: 'Inter_900Black', lineHeight: 28 },
  fHeroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 20 },
  fHeroCTA: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, alignSelf: 'flex-start', marginTop: 8 },
  fHeroCTAText: { color: '#EF4444', fontSize: 13, fontFamily: 'Inter_700Bold' },
  fActionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12 },
  fActionBtn: { flex: 1, minWidth: '45%', backgroundColor: 'white', borderRadius: 24, padding: 16, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  fActionIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  fActionLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.text },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeading: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: Colors.text },
  viewAllText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textMuted },
  fSiteCard: { width: 180, backgroundColor: 'white', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'space-between' },
  fSiteName: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  fSiteMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  fSiteMetaText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  fHealthBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start', marginTop: 12 },
  fHealthText: { fontSize: 9, fontFamily: 'Inter_800ExtraBold' },
  chartContainer: { backgroundColor: 'white', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  chartHeader: { marginBottom: 20 },
  chartTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textSub },
  barChartBox: { alignItems: 'center' },
  sWorkloadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sSectionLabel: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#64748B', letterSpacing: 1 },
  sWorkloadVal: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: Colors.primary },
  sProgressBg: { width: '100%', height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  sProgressFill: { height: '100%', borderRadius: 5 },
  sProgressSub: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted, marginTop: 8 },
  darkText: { color: 'white' },
});
