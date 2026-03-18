import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ComplaintCard } from "@/components/ComplaintCard";
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
  const { currentUser, selectedCompanyId, getCompanyComplaints } = useApp();
  const [activeFilter, setActiveFilter] = useState<ComplaintStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
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
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.description.toLowerCase().includes(q) ||
          c.siteName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [userComplaints, activeFilter, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 700));
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Complaints</Text>
          {role === "client" && (
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/complaint/new"); }}
            >
              <Feather name="plus" size={18} color={Colors.white} />
            </Pressable>
          )}
        </View>

        <View style={[styles.searchRow, searchFocused && styles.searchRowFocused]}>
          <Feather name="search" size={15} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by description, site, category…"
            placeholderTextColor={Colors.textMuted}
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {STATUS_FILTERS.map((f) => {
            const count = f.value === "all" ? userComplaints.length : userComplaints.filter((c) => c.status === f.value).length;
            const active = activeFilter === f.value;
            return (
              <Pressable
                key={f.value}
                style={[
                  styles.chip,
                  active && { backgroundColor: f.color, borderColor: f.color },
                ]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveFilter(f.value); }}
              >
                {active && <View style={[styles.chipDot, { backgroundColor: Colors.white }]} />}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
                <View style={[styles.chipCount, active && { backgroundColor: "rgba(255,255,255,0.25)" }]}>
                  <Text style={[styles.chipCountText, active && { color: Colors.white }]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="inbox" size={28} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No complaints found</Text>
            <Text style={styles.emptyText}>{search ? "Try a different search term" : "No complaints match the selected filter"}</Text>
          </View>
        ) : (
          filtered.map((c) => <ComplaintCard key={c.id} complaint={c} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { backgroundColor: Colors.bg, paddingHorizontal: 16, paddingBottom: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.text },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  searchRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 12, gap: 8, borderWidth: 1.5, borderColor: Colors.border, height: 44,
  },
  searchRowFocused: { borderColor: Colors.primary },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.text },
  filterScroll: { flexGrow: 0 },
  chip: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 100, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, gap: 5, marginRight: 8,
  },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSub },
  chipTextActive: { color: Colors.white },
  chipCount: { backgroundColor: Colors.border, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  chipCountText: { fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.textSub },
  scroll: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.surfaceBorder },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.textSub },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center", maxWidth: 220 },
});
