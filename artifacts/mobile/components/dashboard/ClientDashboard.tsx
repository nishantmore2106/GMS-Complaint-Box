import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Image, Share, Alert, useWindowDimensions } from 'react-native';
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
  const { currentUser, supervisorRequests, requestSupervisorAllocation } = useApp();
  const { width } = useWindowDimensions();

  const pendingRequest = supervisorRequests.find(r => r.siteId === clientStats.siteData?.id && r.status === 'pending');

  if (!clientStats) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={{ gap: 28, paddingBottom: 60, paddingTop: 12 }}>
          
          {/* 1. Profile Context (Glassmorphic) */}
          <View style={styles.sectionContainer}>
            <View style={[styles.profileGlass, isDarkMode && styles.darkGlass]}>
              <View style={[styles.avatarBox, isDarkMode && styles.darkAvatar]}>
                <Text style={[styles.avatarText, isDarkMode && styles.darkText]}>
                  {currentUser?.name?.substring(0,2).toUpperCase() || 'CL'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileName, isDarkMode && styles.darkText]}>{currentUser?.name}</Text>
                <Text style={styles.profileRole}>{clientStats.siteName}</Text>
              </View>
              <Pressable style={styles.editBtn} onPress={() => router.push('/(tabs)/profile')}>
                <Feather name="settings" size={18} color="#94A3B8" />
              </Pressable>
            </View>
          </View>

          {/* 2. Feedback Portal (Interactive Card) */}
          <View style={styles.sectionContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.portalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.portalContent}>
                <View style={styles.portalIconBox}>
                  <Feather name="maximize" size={24} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.portalTitle}>Employee Feedback Hub</Text>
                  <Text style={styles.portalSub}>Deploy anonymous site QR</Text>
                </View>
                <Pressable 
                  style={styles.portalCTA}
                  onPress={() => {
                    const url = `https://gms-complaint-box.netlify.app/public/scan/${clientStats.siteData?.id}`;
                    Share.share({
                      message: `GMS Site QR Portal: ${clientStats.siteName}. Scan to report cleaning or behavior issues: ${url}`,
                      url: url
                    });
                  }}
                >
                  <Feather name="share-2" size={18} color="#059669" />
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* 3. Site Intelligence (Tonal Surface) */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('site_intelligence', 'Site Intelligence')}</Text>
            <View style={[styles.siteIntelCard, isDarkMode && styles.darkCard]}>
              <View style={styles.intelHeader}>
                {clientStats.siteData?.logoUrl ? (
                  <Image source={{ uri: clientStats.siteData.logoUrl }} style={styles.siteLogo} resizeMode="contain" />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Feather name="home" size={24} color="#3B82F6" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.siteName, isDarkMode && styles.darkText]}>{clientStats.siteName}</Text>
                  <View style={styles.addressRow}>
                    <Feather name="map-pin" size={12} color="#94A3B8" />
                    <Text style={styles.addressText} numberOfLines={1}>{clientStats.siteData?.address || 'Site mapping pending'}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.intelStats}>
                 <View style={styles.intelStatItem}>
                    <Text style={[styles.intelVal, isDarkMode && styles.darkText]}>{clientStats.pendingCount}</Text>
                    <Text style={styles.intelLabel}>{t('pending', 'Pending')}</Text>
                 </View>
                 <View style={styles.intelDivider} />
                 <View style={styles.intelStatItem}>
                    <Text style={[styles.intelVal, isDarkMode && styles.darkText]}>{clientStats.inProgressCount}</Text>
                    <Text style={styles.intelLabel}>{t('active', 'Active')}</Text>
                 </View>
                 <View style={styles.intelDivider} />
                 <View style={styles.intelStatItem}>
                    <Text style={[styles.intelVal, isDarkMode && styles.darkText]}>{clientStats.resolvedToday}</Text>
                    <Text style={styles.intelLabel}>{t('resolved', 'Resolved')}</Text>
                 </View>
              </View>
            </View>
          </View>

          {/* 4. Service Health (Editorial Hero) */}
          <View style={styles.sectionContainer}>
            <LinearGradient
              colors={isDarkMode ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#F1F5F9']}
              style={styles.healthHero}
            >
              <View style={styles.healthContent}>
                <View style={[styles.healthBadge, { backgroundColor: clientStats.siteHealth === 'critical' ? '#EF4444' : '#10B981' }]}>
                  <Text style={styles.healthBadgeText}>{clientStats.siteHealth.toUpperCase()}</Text>
                </View>
                <Text style={[styles.healthTitle, isDarkMode && styles.darkText]}>
                  {clientStats.siteHealth === 'critical' ? 'Attention Required' : 'Service Optimal'}
                </Text>
                <Text style={styles.healthDesc}>
                  {clientStats.siteActiveCount > 0 
                    ? `Currently managing ${clientStats.siteActiveCount} active service requests.`
                    : 'Your site is currently operating at peak efficiency.'}
                </Text>
                <Pressable style={styles.healthCTA} onPress={() => router.push("/(tabs)/complaints")}>
                  <Text style={styles.healthCTAText}>Access Full Logs</Text>
                  <Feather name="arrow-right" size={16} color="white" />
                </Pressable>
              </View>
            </LinearGradient>
          </View>

          {/* 5. Command Center (Tactile Buttons) */}
          <View style={styles.commandGrid}>
            <Pressable style={[styles.commandBtn, isDarkMode && styles.darkCard]} onPress={() => router.push("/complaint/new")}>
              <View style={[styles.commandIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Feather name="plus" size={24} color="#EF4444" />
              </View>
              <Text style={[styles.commandLabel, isDarkMode && styles.darkText]}>{t('request_service', 'Request Service')}</Text>
            </Pressable>
            <Pressable style={[styles.commandBtn, isDarkMode && styles.darkCard]} onPress={() => router.push("/(tabs)/complaints")}>
              <View style={[styles.commandIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Feather name="activity" size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.commandLabel, isDarkMode && styles.darkText]}>{t('view_history', 'View History')}</Text>
            </Pressable>
          </View>

          {/* 6. Facility Management (Profile Card) */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>{t('facility_management', 'Facility Management')}</Text>
            {clientStats.supervisor ? (
              <View style={[styles.supervisorCard, isDarkMode && styles.darkCard]}>
                <View style={[styles.supAvatar, isDarkMode && styles.darkAvatar]}>
                  <Text style={[styles.avatarText, isDarkMode && styles.darkText]}>
                    {clientStats.supervisor.name?.substring(0, 2).toUpperCase() || "SM"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.supName, isDarkMode && styles.darkText]}>{clientStats.supervisor.name}</Text>
                   <Text style={styles.supRole}>Primary Supervisor</Text>
                   <View style={styles.contactRow}>
                      <Feather name="mail" size={12} color="#94A3B8" />
                      <Text style={styles.contactText}>{clientStats.supervisor.email}</Text>
                   </View>
                </View>
                <Pressable style={styles.callBtn} onPress={() => Alert.alert('Calling', `Dialing ${clientStats.supervisor.phone || 'N/A'}`)}>
                   <Feather name="phone" size={20} color="#3B82F6" />
                </Pressable>
              </View>
            ) : (
              <View style={[styles.emptySup, isDarkMode && styles.darkCard]}>
                 <Feather name="user-x" size={24} color={pendingRequest ? "#3B82F6" : "#EF4444"} />
                 <Text style={[styles.emptySupText, isDarkMode && styles.darkText]}>
                    {pendingRequest ? 'Allocation Request Sent' : 'No supervisor assigned yet.'}
                 </Text>
                 {!pendingRequest && (
                    <Pressable 
                        style={styles.requestBtn}
                        onPress={() => {
                            Alert.alert(
                                "Request Supervisor",
                                "Send a request to the administrator to assign a supervisor to this site?",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Request", onPress: () => requestSupervisorAllocation(clientStats.siteData?.id) }
                                ]
                            )
                        }}
                    >
                        <Text style={styles.requestBtnText}>Request Allocation</Text>
                    </Pressable>
                 )}
              </View>
            )}
          </View>

          {/* 7. Active Missions (Horizontal Slider) */}
          {clientStats.activeComplaints.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { marginLeft: 24 }, isDarkMode && styles.darkText]}>{t('active_missions', 'Active Missions')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.missionsScroll}>
                {clientStats.activeComplaints.map((c: any) => (
                  <Pressable key={c.id} style={[styles.missionCard, isDarkMode && styles.darkCard]} onPress={() => router.push(`/complaint/${c.id}`)}>
                    <View style={styles.missionHeader}>
                       <Text style={[styles.missionTitle, isDarkMode && styles.darkText]} numberOfLines={1}>{c.category}</Text>
                       <View style={[styles.priorityTag, { backgroundColor: c.priority === 'high' ? '#FEE2E2' : '#F1F5F9' }]}>
                          <Text style={[styles.priorityText, { color: c.priority === 'high' ? '#EF4444' : '#64748B' }]}>{c.priority.toUpperCase()}</Text>
                       </View>
                    </View>
                    <View style={styles.missionFooter}>
                       <Feather name="clock" size={12} color="#94A3B8" />
                       <Text style={styles.missionDate}>{new Date(c.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 8. GMS Identity */}
          <GMSCompanyCard isDarkMode={isDarkMode} />

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },
  sectionContainer: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827', marginBottom: 16 },
  profileGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'white',
    gap: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 10 },
      android: { elevation: 1 }
    })
  },
  darkGlass: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.borderStrong },
  avatarBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  darkAvatar: { backgroundColor: Colors.dark.bg },
  avatarText: { fontSize: 16, fontFamily: 'Inter_900Black', color: '#1E293B' },
  profileName: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  profileRole: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#3B82F6' },
  editBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  portalGradient: { borderRadius: 28, padding: 24 },
  portalContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  portalIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  portalTitle: { color: 'white', fontSize: 18, fontFamily: 'Inter_900Black' },
  portalSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  portalCTA: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  siteIntelCard: { backgroundColor: 'white', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#F1F5F9' },
  intelHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  siteLogo: { width: 56, height: 56, borderRadius: 16 },
  logoPlaceholder: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  siteName: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  addressText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#94A3B8' },
  intelStats: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 20 },
  intelStatItem: { flex: 1, alignItems: 'center', gap: 4 },
  intelVal: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827' },
  intelLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  intelDivider: { width: 1, height: 30, backgroundColor: '#F1F5F9' },
  healthHero: { borderRadius: 32, padding: 28, overflow: 'hidden' },
  healthContent: { gap: 12 },
  healthBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, alignSelf: 'flex-start' },
  healthBadgeText: { color: 'white', fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.5 },
  healthTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  healthDesc: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#64748B', lineHeight: 22 },
  healthCTA: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 100, alignSelf: 'flex-start', marginTop: 8 },
  healthCTAText: { color: 'white', fontSize: 14, fontFamily: 'Inter_800ExtraBold' },
  commandGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 12 },
  commandBtn: { flex: 1, backgroundColor: 'white', borderRadius: 28, padding: 24, alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  commandIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  commandLabel: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#111827', textAlign: 'center' },
  supervisorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 28, gap: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  supAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  supName: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  supRole: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#3B82F6', marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#94A3B8' },
  callBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  emptySup: { padding: 32, borderRadius: 28, backgroundColor: '#F8FAFC', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  emptySupText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#94A3B8' },
  missionsScroll: { paddingHorizontal: 24, gap: 16, paddingBottom: 12 },
  missionCard: { width: 220, backgroundColor: 'white', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F1F5F9' },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  missionTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#111827', marginRight: 8 },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  missionFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  missionDate: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#94A3B8' },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.borderStrong },
  darkText: { color: Colors.dark.text },
  requestBtn: { 
    marginTop: 12, 
    backgroundColor: '#3B82F6', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 12 
  },
  requestBtnText: { 
    color: 'white', 
    fontSize: 14, 
    fontFamily: 'Inter_800ExtraBold' 
  },
});
