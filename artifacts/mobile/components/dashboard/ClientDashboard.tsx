import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, Share, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { DashboardHeader } from '../DashboardHeader';
import { GMSCompanyCard } from './GMSCompanyCard';
import { useApp } from '@/context/AppContext';

interface ClientDashboardProps {
  clientStats: any;
  isDarkMode: boolean;
  t: (key: string, defaultValue: string) => string;
  setIsSupProfileVisible: (visible: boolean) => void;
}

export function ClientDashboard({
  clientStats,
  isDarkMode,
  t,
  setIsSupProfileVisible
}: ClientDashboardProps) {
  const { currentUser } = useApp();

  if (!clientStats) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={{ gap: 24, paddingBottom: 40 }}>
          
          {/* 0. My Client Overview */}
          <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
            <Text style={[styles.sectionHeading, { paddingHorizontal: 0, marginBottom: 12 }, isDarkMode && { color: 'white' }]}>My Profile</Text>
            <View style={[styles.supervisorCard, isDarkMode && styles.darkCard, { padding: 16 }]}>
              <View style={[styles.supAvatarLg, { width: 56, height: 56, borderRadius: 28 }, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }]}>
                <Text style={[styles.supAvatarText, { fontSize: 18 }, isDarkMode && { color: 'white' }]}>
                  {currentUser?.name?.substring(0,2).toUpperCase() || 'CL'}
                </Text>
              </View>
              <View style={styles.supInfoGroup}>
                <Text style={[styles.supNameLg, { fontSize: 16 }, isDarkMode && { color: 'white' }]}>{currentUser?.name}</Text>
                <Text style={[styles.supRoleLg, { color: Colors.primary }]}>{clientStats.siteName}</Text>
                <View style={styles.supContactRow}>
                  <Feather name="phone" size={13} color={isDarkMode ? Colors.dark.textMuted : '#6B7280'} />
                  <Text style={[styles.supContactText, isDarkMode && { color: Colors.dark.textMuted }]}>{currentUser?.phone || 'No phone provided'}</Text>
                </View>
              </View>
              <Pressable style={styles.fLogIconWrap} onPress={() => router.push('/(tabs)/profile')}>
                <Feather name="edit-3" size={16} color={Colors.primary} />
              </Pressable>
            </View>
          </View>

          {/* New QR Section for Employees */}
          <View style={{ paddingHorizontal: 24, marginTop: -8 }}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={{ padding: 20, borderRadius: 24, gap: 12, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <Feather name="maximize" size={24} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Inter_800ExtraBold' }}>Employee QR Portal</Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>Share this link for anonymous site feedback</Text>
              </View>
              <Pressable 
                onPress={() => {
                  const url = `https://gms-complaint-box.netlify.app/public/scan/${clientStats.siteData?.id}`;
                  Share.share({
                    message: `GMS Site QR Portal: ${clientStats.siteName}. Scan to report cleaning or behavior issues: ${url}`,
                    url: url
                  });
                }}
                style={{ backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100 }}
              >
                <Text style={{ color: '#2563EB', fontSize: 13, fontFamily: 'Inter_800ExtraBold' }}>Share Link</Text>
              </Pressable>
            </LinearGradient>
          </View>

          {/* 0.5 Site Profile */}
          <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
            <Text style={[styles.sectionHeading, { paddingHorizontal: 0, marginBottom: 12 }, isDarkMode && { color: 'white' }]}>Site Profile</Text>
            <View style={[styles.supervisorCard, isDarkMode && styles.darkCard, { padding: 16 }]}>
              {clientStats.siteData?.logoUrl ? (
                <Image 
                  source={{ uri: clientStats.siteData.logoUrl }} 
                  style={{ width: 64, height: 64, borderRadius: 16 }} 
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.supAvatarLg, { width: 64, height: 64, borderRadius: 16, backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : '#EFF6FF' }]}>
                  <Feather name="image" size={24} color="#3B82F6" />
                </View>
              )}
              <View style={styles.supInfoGroup}>
                <Text style={[styles.supNameLg, { fontSize: 16 }, isDarkMode && { color: 'white' }]}>{clientStats.siteName}</Text>
                <View style={[styles.supContactRow, { alignItems: 'flex-start' }]}>
                  <Feather name="map-pin" size={13} color={isDarkMode ? Colors.dark.textMuted : '#6B7280'} style={{ marginTop: 2 }} />
                  <Text style={[styles.supContactText, isDarkMode && { color: Colors.dark.textMuted }, { flex: 1 }]}>
                    {clientStats.siteData?.address || 'Precise address pending'}
                  </Text>
                </View>
                <View style={styles.supContactRow}>
                  <Feather name="phone" size={13} color={isDarkMode ? Colors.dark.textMuted : '#6B7280'} />
                  <Text style={[styles.supContactText, isDarkMode && { color: Colors.dark.textMuted }]}>
                    {clientStats.siteData?.phone || 'Site contact pending'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 1. Smart Status Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}>
            <View style={[styles.statusCard, isDarkMode && styles.darkCard, isDarkMode && styles.darkCardGlow]}>
              <View style={[styles.sStatusIconCircle, { backgroundColor: isDarkMode ? 'rgba(245,158,11,0.1)' : '#FEF3C7' }]}>
                <Feather name="clock" size={14} color="#F59E0B" />
              </View>
              <Text style={[styles.sStatusNum, { color: '#F59E0B' }]}>{clientStats.pendingCount}</Text>
              <Text style={[styles.sStatusLabel, isDarkMode && styles.darkTextSub]}>{t('pending', 'Pending')}</Text>
            </View>
            <View style={[styles.statusCard, isDarkMode && styles.darkCard]}>
              <View style={[styles.sStatusIconCircle, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : '#DBEAFE' }]}>
                <Feather name="activity" size={14} color="#3B82F6" />
              </View>
              <Text style={[styles.sStatusNum, { color: '#3B82F6' }]}>{clientStats.inProgressCount}</Text>
              <Text style={[styles.sStatusLabel, isDarkMode && styles.darkTextSub]}>{t('in_progress', 'In Progress')}</Text>
            </View>
            <View style={[styles.statusCard, isDarkMode && styles.darkCard]}>
              <View style={[styles.sStatusIconCircle, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.1)' : '#DCFCE7' }]}>
                <Feather name="check-circle" size={14} color="#10B981" />
              </View>
              <Text style={[styles.sStatusNum, { color: '#10B981' }]}>{clientStats.resolvedToday}</Text>
              <Text style={[styles.sStatusLabel, isDarkMode && styles.darkTextSub]}>{t('resolved_today', 'Resolved Today')}</Text>
            </View>
          </ScrollView>

          {/* 2. Dynamic Hero Card */}
          <LinearGradient
            colors={isDarkMode ? Colors.dark.heroGradient : ['#146A65', '#0D4D49'] as any}
            style={[styles.fCriticalHero, isDarkMode && styles.darkCardGlow]}
          >
            <View style={styles.fHeroContent}>
              <View style={[
                styles.fAlertBadge, 
                { backgroundColor: clientStats.siteHealth === 'critical' ? 'rgba(239,68,68,0.2)' : (clientStats.siteHealth === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)') },
                isDarkMode && { borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
              ]}>
                 <View style={[styles.fPulseRing, { backgroundColor: clientStats.siteHealth === 'critical' ? '#EF4444' : (clientStats.siteHealth === 'warning' ? '#F59E0B' : '#10B981') }]} />
                 <Text style={[styles.fAlertBadgeText, isDarkMode && { color: 'white' }]}>
                   {clientStats.siteHealth.toUpperCase()} {t('site_status', 'STATUS')}
                 </Text>
              </View>
              <Text style={[styles.fHeroTitle, isDarkMode && { color: 'white' }]}>
                {clientStats.siteHealth === 'critical' ? t('site_needs_attention', 'Priority Issues detected') : 
                 (clientStats.siteHealth === 'warning' ? t('site_warning', 'Maintenance in progress') : t('all_clear', 'All Quiet on Your Site'))}
              </Text>
              <Text style={styles.fHeroSub}>
                {clientStats.siteActiveCount > 0 
                  ? `${t('currently', 'Currently')} ${clientStats.siteActiveCount} ${t('active_tasks_lower', 'active issues')} ${t('at_your_site', 'at your site')}.`
                  : t('no_pending_desc', 'No active maintenance issues at the moment.')}
              </Text>
              <Pressable style={styles.fHeroCTA} onPress={() => router.push("/(tabs)/complaints")}>
                <Text style={styles.fHeroCTAText}>{t('track_all', 'Track All Issues')}</Text>
                <Feather name="arrow-right" size={16} color="white" />
              </Pressable>
            </View>
          </LinearGradient>

          {/* 3. Client Quick Actions */}
          <View style={styles.fActionGrid}>
            <Pressable style={[styles.fActionBtn, isDarkMode && styles.darkCard]} onPress={() => router.push("/complaint/new")}>
              <View style={[styles.fActionIcon, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : '#FEE2E2' }]}>
                <Feather name="plus-circle" size={24} color="#EF4444" />
              </View>
              <Text style={[styles.fActionLabel, isDarkMode && styles.darkTextSub]}>{t('report_issue', 'Report Issue')}</Text>
            </Pressable>
            <Pressable style={[styles.fActionBtn, isDarkMode && styles.darkCard]} onPress={() => router.push("/(tabs)/complaints")}>
              <View style={[styles.fActionIcon, { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.1)' : '#EFF6FF' }]}>
                <Feather name="list" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.fActionLabel, isDarkMode && styles.darkTextSub]}>{t('my_history', 'My History')}</Text>
            </Pressable>
          </View>

          {/* 3.5 Site Supervisor Feature */}
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={[styles.sectionHeading, { paddingHorizontal: 0 }, isDarkMode && { color: 'white' }]}>{t('site_manager', 'Site Supervisor')}</Text>
            {clientStats.supervisor ? (
              <View style={[styles.supervisorCard, isDarkMode && styles.darkCard]}>
                <View style={[styles.supAvatarLg, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated }]}>
                  <Text style={[styles.supAvatarText, isDarkMode && { color: 'white' }]}>
                    {clientStats.supervisor.name?.substring(0, 2).toUpperCase() || "SM"}
                  </Text>
                </View>
                <View style={styles.supInfoGroup}>
                   <Text style={[styles.supNameLg, isDarkMode && { color: 'white' }]}>{clientStats.supervisor.name}</Text>
                   <Text style={[styles.supRoleLg, { color: Colors.primary }]}>Facility Manager</Text>
                   
                   <View style={styles.supContactRow}>
                     <Feather name="mail" size={13} color={isDarkMode ? Colors.dark.textMuted : '#6B7280'} />
                     <Text style={[styles.supContactText, isDarkMode && { color: Colors.dark.textMuted }]}>{clientStats.supervisor.email}</Text>
                   </View>
                   <View style={styles.supContactRow}>
                     <Feather name="phone" size={13} color={isDarkMode ? Colors.dark.textMuted : '#6B7280'} />
                     <Text style={[styles.supContactText, isDarkMode && { color: Colors.dark.textMuted }]}>{clientStats.supervisor.phone || 'Contact number pending'}</Text>
                   </View>
                </View>
              </View>
            ) : (
              <View style={[styles.supervisorCard, isDarkMode && styles.darkCard, { alignItems: 'center', paddingVertical: 32 }]}>
                 <View style={[styles.supAvatarLg, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : '#FEE2E2', marginBottom: 12 }]}>
                    <Feather name="user-x" size={28} color="#EF4444" />
                 </View>
                 <Text style={[styles.supNameLg, isDarkMode && { color: 'white' }]}>Locum</Text>
                 <Text style={[styles.supRoleLg, { color: '#EF4444', textAlign: 'center' }]}>Pending Management Allocation</Text>
              </View>
            )}
          </View>

          {/* 4. Mini Analytics Card */}
          <View style={{ paddingHorizontal: 24 }}>
             <View style={[styles.clientMiniAnalytics, isDarkMode && styles.darkCard]}>
                <View style={styles.miniAnalyticItem}>
                   <Text style={[styles.miniAnalyticVal, isDarkMode && { color: 'white' }]}>{clientStats.weeklyResolved}</Text>
                   <Text style={[styles.miniAnalyticLabel, isDarkMode && { color: Colors.dark.textMuted }]}>{t('resolved_this_week', 'Resolved this week')}</Text>
                </View>
                <View style={[styles.miniAnalyticDivider, isDarkMode && { backgroundColor: Colors.dark.border }]} />
                <View style={styles.miniAnalyticItem}>
                   <Text style={[styles.miniAnalyticVal, isDarkMode && { color: 'white' }]}>{clientStats.avgResStr}</Text>
                   <Text style={[styles.miniAnalyticLabel, isDarkMode && { color: Colors.dark.textMuted }]}>{t('avg_resolution', 'Avg. Resolution')}</Text>
                </View>
             </View>
          </View>

          {/* 5. Smart Alerts */}
          {clientStats.alerts.length > 0 && (
            <View style={{ paddingHorizontal: 24 }}>
              <Text style={[styles.sectionHeading, { paddingHorizontal: 0 }, isDarkMode && { color: 'white' }]}>{t('updates_for_you', 'Updates For You')}</Text>
              <View style={[styles.fFeed, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border }]}>
                {clientStats.alerts.map((alert: any, idx: number) => (
                  <View key={idx} style={[styles.fLogItem, idx === clientStats.alerts.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.fLogIconWrap, { backgroundColor: isDarkMode ? `${alert.color}20` : `${alert.color}15` }]}>
                      <Feather name={alert.icon as any} size={14} color={alert.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fLogMessage, isDarkMode && { color: Colors.dark.textSub }]}>{alert.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 6. Active Issues Snapshot */}
          {clientStats.activeComplaints.length > 0 && (
            <View>
              <View style={styles.recentHeader}>
                <Text style={[styles.sectionHeading, { paddingHorizontal: 24, marginBottom: 0 }, isDarkMode && { color: 'white' }]}>{t('active_issues', 'Active Issues')}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 12, gap: 16 }}>
                {clientStats.activeComplaints.map((c: any) => (
                  <Pressable key={c.id} style={[styles.fSiteCard, isDarkMode && styles.darkCard]} onPress={() => router.push(`/complaint/${c.id}`)}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fSiteName, isDarkMode && { color: 'white' }]} numberOfLines={1}>{c.category}</Text>
                      <View style={styles.fSiteMetaRow}>
                        <Feather name="clock" size={12} color={isDarkMode ? Colors.dark.textMuted : Colors.textMuted} />
                        <Text style={[styles.fSiteMetaText, isDarkMode && { color: Colors.dark.textMuted }]}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <View style={[styles.fHealthBadge, { backgroundColor: c.priority === 'high' ? '#FEE2E2' : '#EFF6FF' }]}>
                      <Text style={[styles.fHealthText, { color: c.priority === 'high' ? '#EF4444' : '#3B82F6' }]}>{c.priority.toUpperCase()}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

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
  fHeroTitle: { color: 'white', fontSize: 22, fontFamily: 'Inter_900Black', lineHeight: 28 },
  fHeroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 20 },
  fHeroCTA: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, alignSelf: 'flex-start', marginTop: 8 },
  fHeroCTAText: { color: '#146A65', fontSize: 13, fontFamily: 'Inter_700Bold' },
  fActionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12 },
  fActionBtn: { flex: 1, minWidth: '45%', backgroundColor: 'white', borderRadius: 24, padding: 16, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  fActionIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  fActionLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.text },
  clientMiniAnalytics: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  miniAnalyticItem: { flex: 1, alignItems: 'center', gap: 4 },
  miniAnalyticVal: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#111827' },
  miniAnalyticLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#64748B' },
  miniAnalyticDivider: { width: 1, height: 40, backgroundColor: '#F1F5F9', marginHorizontal: 12 },
  sectionHeading: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: Colors.text },
  fFeed: { backgroundColor: 'white', borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  fLogItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  fLogIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  fLogMessage: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#334155' },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  fSiteCard: { width: 180, backgroundColor: 'white', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', justifyContent: 'space-between' },
  fSiteName: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  fSiteMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  fSiteMetaText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textMuted },
  fHealthBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start', marginTop: 12 },
  fHealthText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  supervisorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 24, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  supAvatarLg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  supAvatarText: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#4B5563' },
  supInfoGroup: { flex: 1, gap: 4 },
  supNameLg: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827' },
  supRoleLg: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  supContactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  supContactText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280' },
});
