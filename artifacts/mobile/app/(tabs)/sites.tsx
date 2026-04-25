import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MapPicker } from "@/components/MapPicker";
import React, { useState, useMemo, useRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  Image,
  RefreshControl,
  TextInput,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftInput } from "@/components/SoftInput";
import { SoftButton } from "@/components/SoftButton";
import * as Haptics from 'expo-haptics';
import { useToast } from "@/components/Toast";
import { DashboardHeader } from "@/components/DashboardHeader";
import { PremiumRefreshVisuals } from "@/components/PremiumRefreshVisuals";
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

export default function SitesTabScreen() {
  const { 
    currentUser, 
    getCompanySites, 
    selectedCompanyId, 
    complaints, 
    users, 
    getCompanyById, 
    createSite, 
    provisionClient, 
    isDarkMode,
    refreshData 
  } = useApp();
  
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const role = currentUser?.role;
  
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const company = getCompanyById(companyId);
  const sites = getCompanySites(companyId);

  const filteredSites = useMemo(() => {
    const q = search.toLowerCase();
    let baseSites = sites;
    if (role === 'supervisor') {
      baseSites = sites.filter(s => s.assignedSupervisorId === currentUser?.id);
    }
    return baseSites.filter((s) => {
      const supervisor = users.find((u) => u.id === s.assignedSupervisorId);
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.address || "").toLowerCase().includes(q) ||
        (supervisor?.name || "").toLowerCase().includes(q) ||
        (s.clientName || "").toLowerCase().includes(q)
      );
    });
  }, [sites, search, users, role, currentUser]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refreshData();
    setIsRefreshing(false);
  };

  const renderSiteItem = ({ item: s }: { item: any }) => {
    const sc = complaints.filter((c) => c.siteId === s.id);
    const activeCount = sc.filter(c => c.status !== 'resolved').length;
    const supervisor = users.find(u => u.id === s.assignedSupervisorId);
    
    const statusColor = activeCount > 5 ? '#EF4444' : (activeCount > 0 ? '#F59E0B' : '#10B981');
    const statusBg = isDarkMode ? `${statusColor}20` : `${statusColor}10`;
    
    return (
      <Pressable 
        style={[styles.siteCard, isDarkMode && styles.darkCard]}
        onPress={() => router.push(`/admin/site/${s.id}`)}
      >
        <View style={styles.siteCardInternal}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          
          <View style={styles.cardMainContent}>
            <View style={styles.siteHeaderRow}>
              <View style={styles.titleArea}>
                <Text style={[styles.siteName, isDarkMode && styles.darkText]} numberOfLines={1}>{s.name}</Text>
                <View style={styles.locationRow}>
                  <Feather name="map-pin" size={12} color={Colors.textMuted} />
                  <Text style={[styles.siteAddress, isDarkMode && styles.darkTextSub]} numberOfLines={1}>{s.address || "Location pending"}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                 <Text style={[styles.statusText, { color: statusColor }]}>
                   {activeCount} {activeCount === 1 ? 'ISSUE' : 'ISSUES'}
                 </Text>
              </View>
            </View>

            <View style={[styles.cardFooter, isDarkMode && styles.darkCardFooter]}>
              <View style={styles.metaInfo}>
                <View style={[styles.avatarMini, isDarkMode && styles.darkAvatar]}>
                  {supervisor ? (
                    <Text style={[styles.avatarText, isDarkMode && styles.darkText]}>{supervisor.name.substring(0, 1).toUpperCase()}</Text>
                  ) : (
                    <Feather name="user-x" size={14} color="#9CA3AF" />
                  )}
                </View>
                <Text style={[styles.metaText, isDarkMode && styles.darkTextSub]} numberOfLines={1}>
                  {supervisor?.name || "Unassigned"}
                </Text>
              </View>
              
              <View style={styles.metaInfo}>
                <Feather name="activity" size={14} color={Colors.textMuted} />
                <Text style={[styles.metaText, isDarkMode && styles.darkTextSub]}>
                  {sc.length} reports
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, isDarkMode && styles.darkRoot]}>
      <PremiumRefreshVisuals scrollY={scrollY} refreshing={isRefreshing} isDarkMode={isDarkMode} />
      
      <Animated.FlatList
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        data={filteredSites}
        renderItem={renderSiteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <DashboardHeader 
              title="Sites"
              subtitle={company?.name || "Service Locations"}
            />
            <View style={styles.searchBox}>
              <View style={[styles.searchBar, isDarkMode && styles.darkSearchBar]}>
                <Feather name="search" size={18} color={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"} />
                <TextInput
                  placeholder="Search sites..."
                  placeholderTextColor={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"}
                  style={[styles.searchInput, isDarkMode && styles.darkText]}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
              </View>
            </View>
          </>
        }
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor="transparent"
            colors={["transparent"]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFA' },
  darkRoot: { backgroundColor: Colors.dark.bg },
  searchBox: { paddingHorizontal: 24, paddingBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, height: 60, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  darkSearchBar: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.borderStrong },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: '#111827' },
  list: { paddingTop: 10, paddingBottom: 120 },
  siteCard: { 
    backgroundColor: 'white', 
    borderRadius: 28, 
    marginHorizontal: 24,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#146A65', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 4 }
    }),
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  siteCardInternal: { flexDirection: 'row' },
  statusIndicator: { width: 6, height: '100%' },
  cardMainContent: { flex: 1, padding: 20 },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.borderStrong },
  siteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  titleArea: { flex: 1, gap: 4 },
  siteName: { fontSize: 17, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  siteAddress: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC'
  },
  darkCardFooter: { borderTopColor: Colors.dark.borderStrong },
  metaInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },
  avatarMini: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  darkAvatar: { backgroundColor: Colors.dark.bg },
  avatarText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold' },
  darkText: { color: 'white' },
  darkTextSub: { color: Colors.dark.textSub },
});
