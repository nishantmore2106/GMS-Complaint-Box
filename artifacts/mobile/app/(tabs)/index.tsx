import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ComplaintCard } from "@/components/ComplaintCard";
import { KPICard } from "@/components/KPICard";
import { Colors } from "@/constants/colors";
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
    if (role === "client") return complaints.filter((c) => c.clientId === currentUser?.id);
    if (role === "supervisor") return complaints.filter((c) => c.supervisorId === currentUser?.id);
    return complaints;
  }, [complaints, role, currentUser]);

  const pending = userComplaints.filter((c) => c.status === "pending").length;
  const inProgress = userComplaints.filter((c) => c.status === "in_progress").length;
  const resolved = userComplaints.filter((c) => c.status === "resolved").length;
  const urgent = userComplaints.filter((c) => c.priority === "high" && c.status !== "resolved").length;

  const recentComplaints = useMemo(
    () => [...userComplaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    [userComplaints]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };

  const roleColors = { founder: Colors.primary, client: Colors.success, supervisor: Colors.warning };
  const roleColor = roleColors[role ?? "client"];
  const roleLabels = { founder: "Founder", client: "Client", supervisor: "Supervisor" };

  const founderCompanies = role === "founder" ? companies : [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16,
            paddingBottom: 120,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.companyPill}>
              <Feather name="briefcase" size={11} color={Colors.textMuted} />
              <Text style={styles.companyName}>{company?.name ?? "—"}</Text>
            </View>
            <Text style={styles.greeting}>{greeting}, <Text style={styles.userName}>{currentUser?.name?.split(" ")[0]}</Text></Text>
          </View>
          <View style={[styles.rolePill, { backgroundColor: roleColor + "22" }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabels[role ?? "client"]}</Text>
          </View>
        </View>

        {/* Company switcher for founders */}
        {role === "founder" && founderCompanies.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.companySwitcher}>
            {founderCompanies.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.companyChip, c.id === companyId && styles.companyChipActive]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedCompanyId(c.id); }}
              >
                <Text style={[styles.companyChipText, c.id === companyId && styles.companyChipTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Urgent alert */}
        {urgent > 0 && (
          <Pressable
            style={styles.alertBanner}
            onPress={() => router.push("/(tabs)/complaints")}
          >
            <LinearGradient
              colors={["rgba(239,68,68,0.18)", "rgba(239,68,68,0.06)"]}
              style={styles.alertGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <View style={styles.alertDot} />
              <Text style={styles.alertText}>{urgent} urgent complaint{urgent > 1 ? "s" : ""} need attention</Text>
              <Feather name="chevron-right" size={16} color={Colors.pending} />
            </LinearGradient>
          </Pressable>
        )}

        {/* KPI row */}
        <View style={styles.kpiRow}>
          <KPICard label="Pending" value={pending} icon="clock" color={Colors.inProgress} bg={Colors.inProgressBg} />
          <KPICard label="Active" value={inProgress} icon="activity" color={Colors.primary} bg={Colors.primaryMuted} />
          <KPICard label="Resolved" value={resolved} icon="check-circle" color={Colors.resolved} bg={Colors.resolvedBg} />
        </View>

        {/* Role-specific raise button */}
        {role === "client" && (
          <Pressable
            style={({ pressed }) => [styles.raiseBtn, pressed && { opacity: 0.85 }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/complaint/new"); }}
          >
            <LinearGradient colors={["#2563EB", "#1D4ED8"]} style={styles.raiseBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.raiseBtnIcon}>
                <Feather name="camera" size={18} color={Colors.white} />
              </View>
              <View style={styles.raiseBtnText}>
                <Text style={styles.raiseBtnTitle}>Raise New Complaint</Text>
                <Text style={styles.raiseBtnSub}>Camera-first complaint submission</Text>
              </View>
              <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </Pressable>
        )}

        {/* Supervisor urgent tasks */}
        {role === "supervisor" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <View style={styles.taskSummary}>
              <View style={[styles.taskChip, { borderColor: Colors.pendingBg }]}>
                <View style={[styles.taskDot, { backgroundColor: Colors.pending }]} />
                <Text style={[styles.taskChipText, { color: Colors.pending }]}>{pending} Pending</Text>
              </View>
              <View style={[styles.taskChip, { borderColor: Colors.inProgressBg }]}>
                <View style={[styles.taskDot, { backgroundColor: Colors.inProgress }]} />
                <Text style={[styles.taskChipText, { color: Colors.inProgress }]}>{inProgress} Active</Text>
              </View>
              <Pressable
                style={styles.taskViewAll}
                onPress={() => router.push("/(tabs)/complaints")}
              >
                <Text style={styles.taskViewAllText}>View All</Text>
                <Feather name="arrow-right" size={12} color={Colors.accent} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Sites for non-clients */}
        {role !== "client" && sites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Sites Overview</Text>
              <Text style={styles.sectionCount}>{sites.length} sites</Text>
            </View>
            <View style={styles.siteGrid}>
              {sites.slice(0, 4).map((s) => {
                const sc = complaints.filter((c) => c.siteId === s.id);
                const active = sc.filter((c) => c.status !== "resolved").length;
                const health = sc.length === 0 ? 1 : Math.round(((sc.length - active) / sc.length) * 100);
                const healthColor = health >= 80 ? Colors.resolved : health >= 50 ? Colors.inProgress : Colors.pending;
                return (
                  <View key={s.id} style={styles.siteCard}>
                    <View style={styles.siteCardTop}>
                      <Feather name="map-pin" size={13} color={Colors.accent} />
                      {active > 0 && (
                        <View style={styles.siteBadge}>
                          <Text style={styles.siteBadgeText}>{active}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.siteName} numberOfLines={2}>{s.name}</Text>
                    <View style={styles.siteHealthBar}>
                      <View style={[styles.siteHealthFill, { width: `${health}%` as any, backgroundColor: healthColor }]} />
                    </View>
                    <Text style={[styles.siteHealthText, { color: healthColor }]}>{health}% resolved</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent complaints */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Complaints</Text>
            <Pressable onPress={() => router.push("/(tabs)/complaints")}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          {recentComplaints.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="inbox" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>All clear</Text>
              <Text style={styles.emptySub}>{role === "client" ? "Raise a complaint above" : "No complaints assigned"}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {recentComplaints.map((c) => <ComplaintCard key={c.id} complaint={c} />)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, gap: 18 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  headerLeft: { gap: 5, flex: 1 },
  companyPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  companyName: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  greeting: { fontSize: 21, fontFamily: "Inter_400Regular", color: Colors.text },
  userName: { fontFamily: "Inter_700Bold", color: Colors.text },
  rolePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginTop: 4 },
  roleText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  companySwitcher: { flexGrow: 0 },
  companyChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8,
  },
  companyChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  companyChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textSub },
  companyChipTextActive: { color: Colors.white },
  alertBanner: { borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.pendingBg },
  alertGrad: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.pending },
  alertText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.pending },
  kpiRow: { flexDirection: "row", gap: 10 },
  raiseBtn: { borderRadius: 16, overflow: "hidden" },
  raiseBtnGrad: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12, borderRadius: 16 },
  raiseBtnIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  raiseBtnText: { flex: 1 },
  raiseBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.white },
  raiseBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 1 },
  section: { gap: 12 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  sectionCount: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  taskSummary: { flexDirection: "row", alignItems: "center", gap: 10 },
  taskChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  taskDot: { width: 6, height: 6, borderRadius: 3 },
  taskChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  taskViewAll: { marginLeft: "auto" as any, flexDirection: "row", alignItems: "center", gap: 4 },
  taskViewAllText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  siteGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  siteCard: {
    flex: 1, minWidth: 140, backgroundColor: Colors.surface, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 6,
  },
  siteCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  siteBadge: { backgroundColor: Colors.pendingBg, borderRadius: 100, paddingHorizontal: 6, paddingVertical: 1 },
  siteBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.pending },
  siteName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  siteHealthBar: { height: 4, backgroundColor: Colors.surfaceElevated, borderRadius: 2, overflow: "hidden" },
  siteHealthFill: { height: "100%", borderRadius: 2 },
  siteHealthText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  list: { gap: 10 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textSub },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center", maxWidth: 220 },
});
