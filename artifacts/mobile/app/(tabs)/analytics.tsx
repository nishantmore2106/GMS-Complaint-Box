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

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={barStyles.container}>
      {data.map((d, i) => (
        <View key={i} style={barStyles.item}>
          <View style={barStyles.barWrapper}>
            <View
              style={[
                barStyles.bar,
                {
                  height: Math.max((d.value / max) * 80, d.value > 0 ? 6 : 0),
                  backgroundColor: d.color,
                },
              ]}
            />
          </View>
          <Text style={barStyles.value}>{d.value}</Text>
          <Text style={barStyles.label} numberOfLines={2}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingTop: 8,
  },
  item: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  barWrapper: {
    height: 80,
    justifyContent: "flex-end",
  },
  bar: {
    width: 28,
    borderRadius: 6,
    minHeight: 4,
  },
  value: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center",
  },
});

export default function AnalyticsScreen() {
  const { currentUser, selectedCompanyId, getCompanyComplaints, getCompanySites, getCompanyById, getCompanyUsers } = useApp();
  const insets = useSafeAreaInsets();

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const company = getCompanyById(companyId);
  const complaints = getCompanyComplaints(companyId);
  const sites = getCompanySites(companyId);
  const users = getCompanyUsers(companyId);
  const supervisors = users.filter((u) => u.role === "supervisor");

  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const pending = complaints.filter((c) => c.status === "pending").length;
    const inProgress = complaints.filter((c) => c.status === "in_progress").length;

    const resolvedComplaints = complaints.filter(
      (c) => c.status === "resolved" && c.resolvedAt && c.createdAt
    );
    const avgResolutionTime =
      resolvedComplaints.length > 0
        ? Math.round(
            resolvedComplaints.reduce((acc, c) => {
              const diff =
                new Date(c.resolvedAt!).getTime() -
                new Date(c.createdAt).getTime();
              return acc + diff / (1000 * 60 * 60 * 24);
            }, 0) / resolvedComplaints.length
          )
        : 0;

    const resolutionRate =
      total > 0 ? Math.round((resolved / total) * 100) : 0;

    const siteStats = sites.map((s) => ({
      name: s.name.split(" - ")[0] ?? s.name,
      total: complaints.filter((c) => c.siteId === s.id).length,
      resolved: complaints.filter((c) => c.siteId === s.id && c.status === "resolved").length,
    }));

    const supervisorStats = supervisors.map((sup) => ({
      name: sup.name.split(" ")[0],
      resolved: complaints.filter(
        (c) => c.supervisorId === sup.id && c.status === "resolved"
      ).length,
      total: complaints.filter((c) => c.supervisorId === sup.id).length,
    }));

    const categoryStats = Array.from(
      complaints.reduce((map, c) => {
        map.set(c.category, (map.get(c.category) ?? 0) + 1);
        return map;
      }, new Map<string, number>())
    ).map(([label, value]) => ({ label, value }));

    return {
      total,
      resolved,
      pending,
      inProgress,
      avgResolutionTime,
      resolutionRate,
      siteStats,
      supervisorStats,
      categoryStats,
    };
  }, [complaints, sites, supervisors]);

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
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.companyTag}>{company?.name}</Text>
      </View>

      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { borderLeftColor: Colors.accent }]}>
          <Text style={styles.kpiValue}>{stats.total}</Text>
          <Text style={styles.kpiLabel}>Total Complaints</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: Colors.success }]}>
          <Text style={[styles.kpiValue, { color: Colors.success }]}>{stats.resolutionRate}%</Text>
          <Text style={styles.kpiLabel}>Resolution Rate</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: Colors.warning }]}>
          <Text style={[styles.kpiValue, { color: Colors.warning }]}>{stats.pending}</Text>
          <Text style={styles.kpiLabel}>Pending</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: Colors.primary }]}>
          <Text style={[styles.kpiValue, { color: Colors.primary }]}>{stats.avgResolutionTime}d</Text>
          <Text style={styles.kpiLabel}>Avg. Resolution</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="bar-chart-2" size={18} color={Colors.accent} />
          <Text style={styles.cardTitle}>Status Overview</Text>
        </View>
        <BarChart
          data={[
            { label: "Pending", value: stats.pending, color: Colors.warning },
            { label: "In Progress", value: stats.inProgress, color: Colors.accent },
            { label: "Resolved", value: stats.resolved, color: Colors.success },
          ]}
        />
      </View>

      {stats.siteStats.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="map-pin" size={18} color={Colors.accent} />
            <Text style={styles.cardTitle}>Site Performance</Text>
          </View>
          {stats.siteStats.map((s, i) => {
            const rate = s.total > 0 ? Math.round((s.resolved / s.total) * 100) : 0;
            return (
              <View key={i} style={styles.siteRow}>
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{s.name}</Text>
                  <Text style={styles.siteStats}>
                    {s.resolved}/{s.total} resolved
                  </Text>
                </View>
                <View style={styles.progressWrapper}>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${rate}%` as any,
                          backgroundColor: rate > 66 ? Colors.success : rate > 33 ? Colors.warning : Colors.danger,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{rate}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {stats.supervisorStats.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="users" size={18} color={Colors.accent} />
            <Text style={styles.cardTitle}>Supervisor Performance</Text>
          </View>
          {stats.supervisorStats.map((s, i) => (
            <View key={i} style={styles.supRow}>
              <View style={styles.supAvatar}>
                <Text style={styles.supAvatarText}>{s.name.charAt(0)}</Text>
              </View>
              <View style={styles.supInfo}>
                <Text style={styles.supName}>{s.name}</Text>
                <Text style={styles.supStat}>{s.resolved} resolved of {s.total} assigned</Text>
              </View>
              <View style={styles.supBadge}>
                <Text style={styles.supBadgeText}>{s.resolved}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {stats.categoryStats.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="tag" size={18} color={Colors.accent} />
            <Text style={styles.cardTitle}>By Category</Text>
          </View>
          <BarChart
            data={stats.categoryStats.slice(0, 5).map((c, i) => ({
              label: c.label,
              value: c.value,
              color: [Colors.accent, Colors.warning, Colors.success, Colors.danger, Colors.primaryLight][i % 5],
            }))}
          />
        </View>
      )}
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
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  companyTag: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  kpiLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  siteRow: {
    gap: 6,
  },
  siteInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  siteName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  siteStats: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBg: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.surfaceTertiary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    width: 36,
    textAlign: "right",
  },
  supRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  supAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  supAvatarText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  supInfo: {
    flex: 1,
    gap: 2,
  },
  supName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  supStat: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
  },
  supBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  supBadgeText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.success,
  },
});
