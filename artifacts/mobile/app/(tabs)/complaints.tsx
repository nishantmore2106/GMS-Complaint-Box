import { Feather } from "@expo/vector-icons";
import { PremiumRefreshVisuals } from "@/components/PremiumRefreshVisuals";
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { DashboardHeader } from "@/components/DashboardHeader";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ComplaintCard } from "@/components/ComplaintCard";
import { ComplaintsListSkeleton } from "@/components/Skeleton";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import type { ComplaintStatus } from "@/context/AppContext";

const STATUS_FILTERS: { label: string; value: ComplaintStatus | "all"; color: string }[] = [
  { label: "All", value: "all", color: Colors.accent },
  { label: "Pending", value: "pending", color: Colors.pending },
  { label: "In Progress", value: "in_progress", color: Colors.inProgress },
  { label: "Resolved", value: "resolved", color: Colors.resolved },
];

export default function ComplaintsScreen() {
  const { currentUser, selectedCompanyId, getCompanyComplaints, users, isDarkMode, loadMoreComplaints, refreshData, notifications, profileImage, getCompanyById, isLoading } = useApp();
  const [activeFilter, setActiveFilter] = useState<ComplaintStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const company = getCompanyById(companyId);
  const allComplaints = getCompanyComplaints(companyId);
  const role = currentUser?.role;

  const userComplaints = useMemo(() => {
    if (role === "client") return allComplaints.filter((c) => c.clientId === currentUser?.id);
    if (role === "supervisor") return allComplaints.filter((c) => c.supervisorId === currentUser?.id);
    return allComplaints;
  }, [allComplaints, role, currentUser]);

  const filtered = useMemo(() => {
    let list = userComplaints;
    if (activeFilter !== "all") list = list.filter((c) => c.status === activeFilter);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [userComplaints, activeFilter]);

  // Search Debounce Logic
  const isInitialMount = React.useRef(true);
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      refreshData({ search: search.trim() || undefined }); 
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, refreshData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await refreshData({ search: search.trim() || undefined });
    } catch (e) {
      console.error("[Complaints] Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || userComplaints.length < 20) return;
    setLoadingMore(true);
    await loadMoreComplaints({ search: search.trim() || undefined, companyId });
    setLoadingMore(false);
  };

  const renderHeader = () => (
    <>
      <DashboardHeader 
        title="Complaints"
        subtitle={company?.name || "Global"}
        showCompanyPill={false}
        rightElement={
          role === "client" && (
            <Pressable
              style={[styles.addBtnStandard, isDarkMode && { backgroundColor: Colors.dark.surfaceElevated, borderColor: Colors.dark.border, borderWidth: 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/complaint/new"); }}
            >
              <Feather name="plus" size={20} color="white" />
            </Pressable>
          )
        }
      />

      <View style={styles.headerSearchArea}>
        <View style={[styles.searchRow, isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1 }, searchFocused && styles.searchRowFocused]}>
          <Feather name="search" size={18} color={isDarkMode ? Colors.dark.textMuted : Colors.textMuted} />
          <TextInput
            style={[styles.searchInput, isDarkMode && { color: Colors.dark.text }]}
            placeholder="Search by ID, site, description…"
            placeholderTextColor={isDarkMode ? Colors.dark.textMuted : Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            selectionColor={Colors.accent}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x-circle" size={15} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        <View>
          <Animated.FlatList 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterScroll}
            data={STATUS_FILTERS}
            keyExtractor={(item) => item.value}
            renderItem={({ item: f }) => {
              const count = f.value === "all" ? userComplaints.length : userComplaints.filter((c) => c.status === f.value).length;
              const active = activeFilter === f.value;
              return (
                <Pressable
                  key={f.value}
                  style={[
                    styles.chip,
                    isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border },
                    active && { backgroundColor: f.color, borderColor: f.color },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter(f.value); }}
                >
                  {active && <View style={[styles.chipDot, { backgroundColor: Colors.white }]} />}
                  <Text style={[styles.chipText, isDarkMode && !active && { color: Colors.dark.textSub }, active && styles.chipTextActive]}>{f.label}</Text>
                  <View style={[styles.chipCount, active && { backgroundColor: "rgba(255,255,255,0.25)" }, isDarkMode && !active && { backgroundColor: Colors.dark.surfaceElevated }]}>
                    <Text style={[styles.chipCountText, active && { color: Colors.white }, isDarkMode && !active && { color: Colors.dark.textMuted }]}>{count}</Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.root, isDarkMode && { backgroundColor: Colors.dark.bg }]}>
      <PremiumRefreshVisuals scrollY={scrollY} refreshing={refreshing} isDarkMode={isDarkMode} />
      
      <Animated.FlatList
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ComplaintCard complaint={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          isLoading && !refreshing ? (
            <View style={{ paddingHorizontal: 24, paddingTop: 10 }}>
              <ComplaintsListSkeleton isDarkMode={isDarkMode} />
            </View>
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Feather name="inbox" size={28} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptyText}>{search ? "Try a different search term" : "No complaints match the selected filter"}</Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator color={Colors.accent} />
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="transparent"
            colors={["transparent"]}
            style={{ backgroundColor: 'transparent' }}
          />
        }
      />
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: isDarkMode ? Colors.dark.bg : '#F8FAFA' },
  addBtnStandard: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: '#111827', 
    justifyContent: 'center', 
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 8 }, 
        shadowOpacity: 0.15, 
        shadowRadius: 12, 
      },
      android: {
        elevation: 4 
      }
    })
  },
  headerSearchArea: { paddingHorizontal: 24, paddingBottom: 20, gap: 20, paddingTop: 10 },
  searchRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: '#F0F4F4', borderRadius: 24,
    paddingHorizontal: 16, gap: 10, height: 58,
  },
  searchRowFocused: { backgroundColor: '#E0F2F1' },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: '#111827' },
  filterScroll: { flexGrow: 0 },
  chip: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 32, backgroundColor: 'white', gap: 6, marginRight: 10,
    shadowColor: '#146A65', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#F1F5F9'
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 14, fontFamily: "Inter_700Bold", color: '#6B7280' },
  chipTextActive: { color: 'white' },
  chipCount: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  chipCountText: { fontSize: 11, fontFamily: "Inter_800ExtraBold", color: '#6B7280' },
  list: { paddingHorizontal: 24, paddingTop: 10, gap: 16 },
  empty: { alignItems: "center", paddingVertical: 80, gap: 16 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: isDarkMode ? Colors.dark.surface : 'white', justifyContent: "center", alignItems: "center", shadowColor: '#146A65', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, borderWidth: isDarkMode ? 1 : 0, borderColor: Colors.dark.borderStrong },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_900Black", color: isDarkMode ? Colors.dark.text : '#111827' },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium", color: isDarkMode ? Colors.dark.textSub : '#6B7280', textAlign: "center", maxWidth: 260, lineHeight: 22 },
});
