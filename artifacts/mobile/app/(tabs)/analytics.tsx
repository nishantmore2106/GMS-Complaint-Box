import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={barS.track}>
      <View style={[barS.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const barS = StyleSheet.create({
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceElevated, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
});

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ComponentProps<typeof Feather>["name"] }) {
  return (
    <View style={[sc.card, { borderTopColor: color }]}>
      <View style={[sc.iconWrap, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { flex: 1, minWidth: "45%", backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderTopWidth: 3, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 6 },
  iconWrap: { width: 32, height: 32, borderRadius: 9, justifyContent: "center", alignItems: "center", marginBottom: 2 },
  value: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.text },
  label: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});

export default function AnalyticsScreen() {
  const { currentUser, selectedCompanyId, getCompanyComplaints, getCompanySites, getCompanyById, getCompanyUsers } = useApp();
  const insets = useSafeAreaInsets();

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const company = getCompanyById(companyId);
  const complaints = getCompanyComplaints(companyId);
  const sites = getCompanySites(companyId);
  const supervisors = getCompanyUsers(companyId).filter((u) => u.role === "supervisor");

  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const pending = complaints.filter((c) => c.status === "pending").length;
    const inProgress = complaints.filter((c) => c.status === "in_progress").length;
    const resolvable = complaints.filter((c) => c.status === "resolved" && c.resolvedAt && c.createdAt);
    const avgDays = resolvable.length > 0 ? Math.round(resolvable.reduce((a, c) => a + (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / 86400000, 0) / resolvable.length) : 0;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const high = complaints.filter((c) => c.priority === "high").length;

    const sitePerf = sites.map((s) => {
      const sc = complaints.filter((c) => c.siteId === s.id);
      const sr = sc.filter((c) => c.status === "resolved").length;
      return { name: s.name.split(" · ")[0] ?? s.name, total: sc.length, resolved: sr, rate: sc.length > 0 ? Math.round((sr / sc.length) * 100) : 0 };
    }).sort((a, b) => b.total - a.total);

    const supPerf = supervisors.map((su) => {
      const sc = complaints.filter((c) => c.supervisorId === su.id);
      const sr = sc.filter((c) => c.status === "resolved").length;
      return { name: su.name, initials: su.name.split(" ").map((n) => n[0]).join(""), total: sc.length, resolved: sr };
    });

    const categories = Array.from(complaints.reduce((m, c) => m.set(c.category, (m.get(c.category) ?? 0) + 1), new Map<string, number>()))
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    return { total, resolved, pending, inProgress, avgDays, rate, high, sitePerf, supPerf, categories };
  }, [complaints, sites, supervisors]);

  const STATUS_DATA = [
    { label: "Pending", value: stats.pending, color: Colors.pending },
    { label: "In Progress", value: stats.inProgress, color: Colors.inProgress },
    { label: "Resolved", value: stats.resolved, color: Colors.resolved },
  ];
  const maxStatus = Math.max(...STATUS_DATA.map((d) => d.value), 1);

  const CATEGORY_COLORS = [Colors.accent, Colors.warning, Colors.resolved, Colors.pending, Colors.primary];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scroll,
        { paddingTop: Platform.OS === "web" ? insets.top + 67 : insets.top + 16, paddingBottom: 120 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.companyPill}>
          <Feather name="briefcase" size={11} color={Colors.textMuted} />
          <Text style={styles.companyName}>{company?.name}</Text>
        </View>
      </View>

      {/* KPI grid */}
      <View style={styles.kpiGrid}>
        <StatCard label="Total Complaints" value={stats.total} color={Colors.accent} icon="inbox" />
        <StatCard label="Resolution Rate" value={`${stats.rate}%`} color={Colors.resolved} icon="check-circle" />
        <StatCard label="Pending" value={stats.pending} color={Colors.inProgress} icon="clock" />
        <StatCard label="Avg. Resolution" value={`${stats.avgDays}d`} color={Colors.primary} icon="zap" />
      </View>

      {/* Status overview */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="activity" size={17} color={Colors.accent} />
          <Text style={styles.cardTitle}>Status Breakdown</Text>
        </View>
        <View style={styles.statusList}>
          {STATUS_DATA.map((d) => (
            <View key={d.label} style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: d.color }]} />
              <Text style={styles.statusLabel}>{d.label}</Text>
              <Bar value={d.value} max={maxStatus} color={d.color} />
              <Text style={[styles.statusValue, { color: d.color }]}>{d.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Urgent indicator */}
      {stats.high > 0 && (
        <View style={styles.urgentCard}>
          <Feather name="alert-triangle" size={16} color={Colors.pending} />
          <View style={{ flex: 1 }}>
            <Text style={styles.urgentTitle}>{stats.high} High Priority</Text>
            <Text style={styles.urgentSub}>Complaints requiring immediate attention</Text>
          </View>
          <Text style={[styles.urgentCount, { color: Colors.pending }]}>{stats.high}</Text>
        </View>
      )}

      {/* Site performance */}
      {stats.sitePerf.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="map-pin" size={17} color={Colors.accent} />
            <Text style={styles.cardTitle}>Site Performance</Text>
          </View>
          {stats.sitePerf.map((s, i) => (
            <View key={i} style={styles.perfRow}>
              <View style={styles.perfLabel}>
                <Text style={styles.perfName}>{s.name}</Text>
                <Text style={styles.perfStat}>{s.resolved}/{s.total} resolved · {s.rate}%</Text>
              </View>
              <View style={styles.perfBarWrap}>
                <View style={styles.perfBg}>
                  <View style={[styles.perfFill, { width: `${s.rate}%` as any, backgroundColor: s.rate >= 80 ? Colors.resolved : s.rate >= 40 ? Colors.inProgress : Colors.pending }]} />
                </View>
                <Text style={styles.perfPct}>{s.rate}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Supervisor performance */}
      {stats.supPerf.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="users" size={17} color={Colors.accent} />
            <Text style={styles.cardTitle}>Supervisor Performance</Text>
          </View>
          {stats.supPerf.map((s, i) => (
            <View key={i} style={styles.supRow}>
              <View style={styles.supAvatar}>
                <Text style={styles.supInitials}>{s.initials}</Text>
              </View>
              <View style={styles.supInfo}>
                <Text style={styles.supName}>{s.name}</Text>
                <Text style={styles.supStat}>{s.resolved} resolved / {s.total} assigned</Text>
              </View>
              <View style={[styles.supScore, { backgroundColor: Colors.resolvedBg }]}>
                <Text style={[styles.supScoreText, { color: Colors.resolved }]}>{s.resolved}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Category breakdown */}
      {stats.categories.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="tag" size={17} color={Colors.accent} />
            <Text style={styles.cardTitle}>By Category</Text>
          </View>
          {stats.categories.map((c, i) => {
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            return (
              <View key={c.label} style={styles.catRow}>
                <View style={[styles.catDot, { backgroundColor: color }]} />
                <Text style={styles.catLabel}>{c.label}</Text>
                <Bar value={c.value} max={stats.categories[0].value} color={color} />
                <Text style={[styles.catValue, { color }]}>{c.value}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, gap: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.text },
  companyPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  companyName: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: Colors.surfaceBorder },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  statusList: { gap: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSub, width: 76 },
  statusValue: { fontSize: 14, fontFamily: "Inter_700Bold", width: 28, textAlign: "right" },
  urgentCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.pendingBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.pending + "40",
  },
  urgentTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.pending },
  urgentSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.pending + "AA", marginTop: 2 },
  urgentCount: { fontSize: 22, fontFamily: "Inter_700Bold" },
  perfRow: { gap: 6 },
  perfLabel: { flexDirection: "row", justifyContent: "space-between" },
  perfName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  perfStat: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  perfBarWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  perfBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceElevated, overflow: "hidden" },
  perfFill: { height: "100%", borderRadius: 4 },
  perfPct: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.textSub, width: 32, textAlign: "right" },
  supRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  supAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryMuted, justifyContent: "center", alignItems: "center" },
  supInitials: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.accent },
  supInfo: { flex: 1 },
  supName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.text },
  supStat: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 1 },
  supScore: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  supScoreText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  catRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSub, width: 80 },
  catValue: { fontSize: 14, fontFamily: "Inter_700Bold", width: 28, textAlign: "right" },
});
