import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { ComplaintCard } from "@/components/ComplaintCard";
import { KPICard } from "@/components/KPICard";
import { SectionHeader } from "@/components/SectionHeader";
import { useApp } from "@/context/AppContext";

export default function DashboardScreen() {
  const {
    currentUser,
    selectedCompanyId,
    companies,
    getCompanyComplaints,
    getCompanySites,
    setSelectedCompanyId,
    getCompanyById,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const company = getCompanyById(companyId);
  const complaints = getCompanyComplaints(companyId);
  const sites = getCompanySites(companyId);
  const role = currentUser?.role;

  const userComplaints = useMemo(() => {
    if (role === "client") {
      return complaints.filter((c) => c.clientId === currentUser?.id);
    }
    if (role === "supervisor") {
      return complaints.filter((c) => c.supervisorId === currentUser?.id);
    }
    return complaints;
  }, [complaints, role, currentUser]);

  const pending = userComplaints.filter((c) => c.status === "pending").length;
  const inProgress = userComplaints.filter((c) => c.status === "in_progress").length;
  const resolved = userComplaints.filter((c) => c.status === "resolved").length;

  const recentComplaints = useMemo(
    () =>
      [...userComplaints]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [userComplaints]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };

  const getRoleLabel = () => {
    if (role === "founder") return "Founder";
    if (role === "client") return "Client";
    return "Supervisor";
  };

  const getRoleColor = () => {
    if (role === "founder") return Colors.accent;
    if (role === "client") return Colors.success;
    return Colors.warning;
  };

  const founderCompanies = role === "founder" ? companies : [];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop:
            Platform.OS === "web" ? insets.top + 67 : insets.top + 16,
          paddingBottom: Platform.OS === "web" ? 120 : 120,
        },
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
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.companyRow}>
            <Feather name="briefcase" size={14} color={Colors.textMuted} />
            <Text style={styles.companyName}>{company?.name ?? "—"}</Text>
          </View>
          <Text style={styles.greeting}>
            Good {new Date().getHours() < 12 ? "Morning" : "Afternoon"},{" "}
            <Text style={styles.userName}>{currentUser?.name?.split(" ")[0]}</Text>
          </Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor() + "20" }]}>
          <Text style={[styles.roleText, { color: getRoleColor() }]}>
            {getRoleLabel()}
          </Text>
        </View>
      </View>

      {role === "founder" && founderCompanies.length > 1 && (
        <View style={styles.companySwitcher}>
          <Text style={styles.switcherLabel}>Switch Company</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.switcherScroll}>
            {founderCompanies.map((c) => (
              <Pressable
                key={c.id}
                style={[
                  styles.switcherChip,
                  c.id === companyId && styles.switcherChipActive,
                ]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCompanyId(c.id);
                }}
              >
                <Text
                  style={[
                    styles.switcherChipText,
                    c.id === companyId && styles.switcherChipTextActive,
                  ]}
                >
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.kpiRow}>
        <KPICard
          label="Pending"
          value={pending}
          color={Colors.warning}
        />
        <KPICard
          label="In Progress"
          value={inProgress}
          color={Colors.accent}
        />
        <KPICard
          label="Resolved"
          value={resolved}
          color={Colors.success}
        />
      </View>

      {role === "client" && (
        <Pressable
          style={({ pressed }) => [
            styles.newComplaintBtn,
            pressed && styles.newComplaintBtnPressed,
          ]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/complaint/new");
          }}
        >
          <Feather name="plus-circle" size={20} color={Colors.white} />
          <Text style={styles.newComplaintBtnText}>Raise New Complaint</Text>
          <Feather name="chevron-right" size={20} color={Colors.white} />
        </Pressable>
      )}

      {role !== "client" && sites.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title={`Sites (${sites.length})`} />
          <View style={styles.sitesRow}>
            {sites.map((s) => {
              const siteComplaints = complaints.filter((c) => c.siteId === s.id);
              const activeSite = siteComplaints.filter((c) => c.status !== "resolved").length;
              return (
                <View key={s.id} style={styles.siteCard}>
                  <Feather name="map-pin" size={16} color={Colors.accent} />
                  <Text style={styles.siteName}>{s.name}</Text>
                  {activeSite > 0 && (
                    <View style={styles.siteBadge}>
                      <Text style={styles.siteBadgeText}>{activeSite}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader
          title="Recent Complaints"
          rightElement={
            <Pressable onPress={() => router.push("/complaints")}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          }
        />
        {recentComplaints.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No complaints yet</Text>
            <Text style={styles.emptySubtitle}>
              {role === "client"
                ? "Raise a complaint using the button above"
                : "No complaints assigned to you"}
            </Text>
          </View>
        ) : (
          <View style={styles.complaintList}>
            {recentComplaints.map((c) => (
              <ComplaintCard key={c.id} complaint={c} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  container: {
    paddingHorizontal: 16,
    gap: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    gap: 4,
    flex: 1,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  companyName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  greeting: {
    fontSize: 22,
    fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
  },
  userName: {
    fontFamily: "Inter_700Bold",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  companySwitcher: {
    gap: 8,
  },
  switcherLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  switcherScroll: {
    flexGrow: 0,
  },
  switcherChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: 8,
  },
  switcherChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  switcherChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  switcherChipTextActive: {
    color: Colors.white,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },
  newComplaintBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  newComplaintBtnPressed: {
    opacity: 0.85,
  },
  newComplaintBtnText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.white,
  },
  section: {
    gap: 0,
  },
  sitesRow: {
    gap: 8,
  },
  siteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  siteName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  siteBadge: {
    backgroundColor: Colors.danger + "20",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  siteBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.danger,
  },
  complaintList: {
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 240,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.accent,
  },
});
