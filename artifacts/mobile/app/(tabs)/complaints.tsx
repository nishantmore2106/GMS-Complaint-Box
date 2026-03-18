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
import { Colors } from "@/constants/colors";
import { ComplaintCard } from "@/components/ComplaintCard";
import { useApp } from "@/context/AppContext";
import type { ComplaintStatus } from "@/context/AppContext";

const STATUS_FILTERS: { label: string; value: ComplaintStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
];

export default function ComplaintsScreen() {
  const { currentUser, selectedCompanyId, getCompanyComplaints } = useApp();
  const [activeFilter, setActiveFilter] = useState<ComplaintStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const allComplaints = getCompanyComplaints(companyId);
  const role = currentUser?.role;

  const userComplaints = useMemo(() => {
    if (role === "client") {
      return allComplaints.filter((c) => c.clientId === currentUser?.id);
    }
    if (role === "supervisor") {
      return allComplaints.filter((c) => c.supervisorId === currentUser?.id);
    }
    return allComplaints;
  }, [allComplaints, role, currentUser]);

  const filtered = useMemo(() => {
    let list = userComplaints;
    if (activeFilter !== "all") {
      list = list.filter((c) => c.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.description.toLowerCase().includes(q) ||
          c.siteName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [userComplaints, activeFilter, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 700));
    setRefreshing(false);
  };

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop:
              Platform.OS === "web" ? insets.top + 67 : insets.top + 16,
          },
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Complaints</Text>
          {role === "client" && (
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                pressed && styles.addBtnPressed,
              ]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/complaint/new");
              }}
            >
              <Feather name="plus" size={20} color={Colors.white} />
            </Pressable>
          )}
        </View>

        <View style={styles.searchWrapper}>
          <Feather name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search complaints..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === "all"
                ? userComplaints.length
                : userComplaints.filter((c) => c.status === f.value).length;
            const active = activeFilter === f.value;
            return (
              <Pressable
                key={f.value}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveFilter(f.value);
                }}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {f.label}
                </Text>
                <View
                  style={[
                    styles.filterCount,
                    active && styles.filterCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      active && styles.filterCountTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: Platform.OS === "web" ? 120 : 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No complaints found</Text>
            <Text style={styles.emptySubtitle}>
              {search
                ? "Try adjusting your search"
                : "No complaints match the selected filter"}
            </Text>
          </View>
        ) : (
          filtered.map((c) => <ComplaintCard key={c.id} complaint={c} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  topBar: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnPressed: { opacity: 0.8 },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  filterCount: {
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterCountActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  filterCountText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  filterCountTextActive: {
    color: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
});
