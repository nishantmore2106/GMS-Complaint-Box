import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { DashboardHeader } from "@/components/DashboardHeader";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
  Image
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import Svg, { G, Rect, Text as SvgText, Circle } from "react-native-svg";
import { SoftCard } from "@/components/SoftCard";

export default function AnalyticsScreen() {
  const { currentUser, selectedCompanyId, getCompanyComplaints, getCompanySites, getCompanyById, isDarkMode, notifications, profileImage } = useApp();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDark = isDarkMode;
  
  const styles = useMemo(() => getStyles(isDark, width), [isDark, width]);

  const [dateFilter, setDateFilter] = useState<'Today' | 'Week' | 'Month'>('Month');

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const role = currentUser?.role;
  const company = getCompanyById(companyId);
  const unreadNotifs = notifications?.filter(n => !n.isRead).length || 0;
  
  const allComplaints = getCompanyComplaints(companyId);
  const allSites = getCompanySites(companyId);

  // Filter complaints based on role and date filter
  const filteredComplaints = useMemo(() => {
    let base = allComplaints;
    if (role === 'supervisor') {
      base = allComplaints.filter(c => c.supervisorId === currentUser?.id);
    } else if (role === 'client') {
      base = allComplaints.filter(c => c.clientId === currentUser?.id);
    }

    const now = new Date().getTime();
    return base.filter(c => {
      if (!c.createdAt) return false;
      const diffMs = now - new Date(c.createdAt).getTime();
      const diffDays = diffMs / (1000 * 3600 * 24);
      if (dateFilter === 'Today') return diffDays <= 1;
      if (dateFilter === 'Week') return diffDays <= 7;
      return diffDays <= 30; // Month
    });
  }, [allComplaints, role, currentUser?.id, dateFilter]);

  const stats = useMemo(() => {
    const total = filteredComplaints.length;
    const resolved = filteredComplaints.filter(c => c.status === "resolved");
    const pending = filteredComplaints.filter(c => c.status === "pending").length;
    const inProgress = filteredComplaints.filter(c => c.status === "in_progress").length;
    
    // Satisfaction Rating (Client only)
    const ratedComplaints = filteredComplaints.filter(c => c.rating);
    const avgRating = ratedComplaints.length > 0 
      ? (ratedComplaints.reduce((acc, c) => acc + (c.rating || 0), 0) / ratedComplaints.length).toFixed(1)
      : "0.0";

    // Completion Rate
    const completionRate = total > 0 ? Math.round((resolved.length / total) * 100) : 0;

    // Average Resolution Time
    let totalResTimeMs = 0;
    let resCount = 0;
    resolved.forEach((c) => {
      if (c.createdAt && c.resolvedAt) {
        const diff = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
        if (diff > 0) {
          totalResTimeMs += diff;
          resCount++;
        }
      }
    });

    let avgResTimeStr = "-";
    let avgResHours = 0;
    if (resCount > 0) {
       avgResHours = (totalResTimeMs / resCount) / (1000 * 60 * 60);
       if (avgResHours > 24) {
         avgResTimeStr = `${(avgResHours / 24).toFixed(1)} Days`;
       } else {
         avgResTimeStr = `${Math.max(1, Math.round(avgResHours))} Hrs`;
       }
    }

    // Site Performance breakdown
    const handledSiteIds = Array.from(new Set(filteredComplaints.map(c => c.siteId)));
    const siteMetrics = handledSiteIds.map(sid => {
      const site = allSites.find(s => s.id === sid);
      const siteComplaints = filteredComplaints.filter(c => c.siteId === sid);
      const siteResolved = siteComplaints.filter(c => c.status === 'resolved');
      
      let sTime = 0;
      let sCount = 0;
      siteResolved.forEach(c => {
        if (c.createdAt && c.resolvedAt) {
          sTime += (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime());
          sCount++;
        }
      });
      const sAvgH = sCount > 0 ? (sTime / sCount) / (1000 * 3600) : 0;

      return {
        id: sid,
        name: site?.name?.split(' · ')[0] || "Unknown Site",
        count: siteComplaints.length,
        avgTime: sAvgH > 24 ? `${(sAvgH/24).toFixed(1)}d` : `${Math.round(sAvgH)}h`,
        avgHours: sAvgH
      };
    }).sort((a, b) => b.count - a.count);

    // Insights
    const insights = [];
    if (role === 'client') {
      if (pending > 0) insights.push({ type: 'alert', text: `You have ${pending} open issues. Our team is working on them.` });
      if (completionRate > 80) insights.push({ type: 'success', text: "High resolution rate! Most of your issues are being addressed quickly." });
      if (avgRating !== "0.0" && parseFloat(avgRating) < 3.5) insights.push({ type: 'warning', text: "We noticed some dissatisfaction. Please let us know how we can improve." });
    } else {
      if (pending > 3) insights.push({ type: 'alert', text: `${pending} tasks are pending. Consider prioritizing high-priority issues.` });
      if (completionRate < 70 && total > 5) insights.push({ type: 'warning', text: "Completion rate is below target. Try resolving pending tasks." });
      if (avgResHours > 48 && resCount > 0) insights.push({ type: 'warning', text: "Average resolution time is high. Check for blockers at slow sites." });
    }
    
    if (insights.length === 0) insights.push({ type: 'success', text: "Great job! Your performance metrics are looking healthy." });

    return { total, resolvedCount: resolved.length, pending, inProgress, completionRate, avgResTimeStr, siteMetrics, insights, avgRating };
  }, [filteredComplaints, allSites, role]);

  // Donut Chart logic
  const donutSize = 140;
  const strokeW = 16;
  const center = donutSize / 2;
  const radius = center - strokeW;
  const circumference = 2 * Math.PI * radius;
  
  const pPct = stats.total > 0 ? stats.pending / stats.total : 0;
  const ipPct = stats.total > 0 ? stats.inProgress / stats.total : 0;
  const rPct = stats.total > 0 ? stats.resolvedCount / stats.total : 1;
  
  const pStroke = circumference * pPct;
  const ipStroke = circumference * ipPct;
  const rStroke = circumference * rPct;

  // Bar Chart Logic (Last 7 Days Activity)
  const chartWidth = width - 64;
  const chartHeight = 120;
  const barData = useMemo(() => {
    const intervals = 7;
    const now = new Date();
    const data = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = intervals - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0,0,0,0));
      const dayEnd = new Date(d.setHours(23,59,59,999));
      
      const count = allComplaints.filter(c => 
        c.status === 'resolved' && 
        c.resolvedAt && 
        new Date(c.resolvedAt) >= dayStart && 
        new Date(c.resolvedAt) <= dayEnd
      ).length;
      
      data.push({
        label: dayNames[d.getDay()],
        value: count,
        isToday: i === 0
      });
    }
    return data;
  }, [allComplaints]);

  const maxVal = Math.max(...barData.map(d => d.value), 1);

  // Bar Chart Logic (Top 5 sites by resolution time)
  const barChartHeight = 120;
  const barWidth = 30;
  const barSpacing = 20;
  const topSitesForBar = stats.siteMetrics.filter(s => s.avgHours > 0).slice(0, 5);
  const maxBarVal = Math.max(...topSitesForBar.map(s => s.avgHours), 1);

  return (
    <View style={[styles.root, isDark && { backgroundColor: Colors.dark.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 120 },
        ]}
      >
        <DashboardHeader 
          title={role === 'client' ? "My Statistics" : "My Performance"}
          subtitle={company?.name || "Global"}
          showCompanyPill={false}
        />

        {/* Date Filter */}
        <View style={styles.filterRow}>
           {(['Today', 'Week', 'Month'] as const).map((filter) => (
             <Pressable 
               key={filter} 
               onPress={() => setDateFilter(filter)}
               style={[styles.filterPill, dateFilter === filter && styles.filterPillActive]}
             >
               <Text style={[styles.filterText, dateFilter === filter && styles.filterTextActive]}>{filter}</Text>
             </Pressable>
           ))}
        </View>

        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <SoftCard style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: isDark ? 'rgba(79, 70, 229, 0.15)' : '#EEF2FF' }]}>
              <Feather name="check-circle" size={18} color={isDark ? "#818CF8" : "#4F46E5"} />
            </View>
            <Text style={styles.kpiValue}>{stats.resolvedCount}</Text>
            <Text style={styles.kpiLabel}>{role === 'client' ? "Issues Resolved" : "Tasks Completed"}</Text>
          </SoftCard>

          <SoftCard style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED' }]}>
              <Feather name="clock" size={18} color={isDark ? "#FB923C" : "#EA580C"} />
            </View>
            <Text style={styles.kpiValue}>{stats.avgResTimeStr}</Text>
            <Text style={styles.kpiLabel}>Avg Resolution</Text>
          </SoftCard>

          <SoftCard style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
              <Feather name={role === 'client' ? "star" : "trending-up"} size={18} color={role === 'client' ? "#F59E0B" : (isDark ? "#34D399" : "#10B981")} />
            </View>
            <Text style={styles.kpiValue}>{role === 'client' ? stats.avgRating : `${stats.completionRate}%`}</Text>
            <Text style={styles.kpiLabel}>{role === 'client' ? "Current Satisfaction" : "Completion Rate"}</Text>
          </SoftCard>

          <SoftCard style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}>
              <Feather name="list" size={18} color={isDark ? "#F87171" : "#EF4444"} />
            </View>
            <Text style={styles.kpiValue}>{stats.pending}</Text>
            <Text style={styles.kpiLabel}>Pending Work</Text>
          </SoftCard>
        </View>

        {/* Daily Activity Bar Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{role === 'client' ? "RESOLUTION HISTORY" : "OPERATIONAL TREND"}</Text>
          <SoftCard style={styles.chartCardLarge}>
            <View style={styles.chartHeaderRow}>
               <Text style={styles.chartTitle}>{role === 'client' ? "Issues Resolved" : "Daily Completed Tasks"}</Text>
               <View style={styles.legend}>
                  <View style={[styles.legendDot, { backgroundColor: isDark ? '#818CF8' : '#6366F1' }]} />
                  <Text style={styles.legendText}>Completed</Text>
               </View>
            </View>
            
            <View style={styles.barChartContainerLarge}>
               <Svg width={chartWidth} height={chartHeight}>
                  {barData.map((d, i) => {
                    const barW = 28;
                    const gap = (chartWidth - (barW * 7)) / 6;
                    const h = (d.value / maxVal) * (chartHeight - 30);
                    const x = i * (barW + gap);
                    const y = chartHeight - h - 10;
                    
                    return (
                      <G key={i}>
                        <Rect
                          x={x}
                          y={y}
                          width={barW}
                          height={h}
                          fill={d.isToday ? (isDark ? '#818CF8' : '#6366F1') : (isDark ? Colors.dark.surfaceElevated : '#E2E8F0')}
                          rx={6}
                        />
                        {d.value > 0 && (
                          <SvgText
                            x={x + barW / 2}
                            y={y - 8}
                            fontSize="10"
                            fontFamily="Inter_800ExtraBold"
                            fill={isDark ? Colors.dark.textMuted : "#64748B"}
                            textAnchor="middle"
                          >
                            {d.value}
                          </SvgText>
                        )}
                      </G>
                    );
                  })}
               </Svg>
               <View style={styles.barLabelsRow}>
                  {barData.map((d, i) => (
                    <Text key={i} style={[styles.barLabelText, d.isToday && styles.barLabelToday]}>
                      {d.label}
                    </Text>
                  ))}
               </View>
            </View>
          </SoftCard>
        </View>

        {/* Breakdown & Speed Section */}
        <View style={styles.sideBySide}>
           {/* Donut Chart */}
           <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>STATUS</Text>
              <SoftCard style={styles.donutCard}>
                 <View style={styles.donutStack}>
                    <Svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
                      <G transform={`rotate(-90 ${center} ${center})`}>
                        <Circle cx={center} cy={center} r={radius} stroke={isDark ? Colors.dark.surfaceElevated : "#F3F4F6"} strokeWidth={strokeW} fill="none" />
                        <Circle cx={center} cy={center} r={radius} stroke="#10B981" strokeWidth={strokeW} strokeDasharray={`${rStroke} ${circumference}`} strokeLinecap="round" fill="none" />
                        <Circle cx={center} cy={center} r={radius} stroke="#F59E0B" strokeWidth={strokeW} strokeDasharray={`${ipStroke} ${circumference}`} strokeDashoffset={-rStroke} strokeLinecap="round" fill="none" />
                        <Circle cx={center} cy={center} r={radius} stroke="#EF4444" strokeWidth={strokeW} strokeDasharray={`${pStroke} ${circumference}`} strokeDashoffset={-(rStroke + ipStroke)} strokeLinecap="round" fill="none" />
                      </G>
                    </Svg>
                    <View style={styles.donutInner}>
                       <Text style={styles.donutNum}>{stats.total}</Text>
                       <Text style={styles.donutTxt}>Total</Text>
                    </View>
                 </View>
              </SoftCard>
           </View>

           {/* Bar Chart */}
           <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>SPEED (HRS)</Text>
              <SoftCard style={styles.barCard}>
                 <View style={styles.barChartContainer}>
                    <Svg width="100%" height={barChartHeight}>
                       {topSitesForBar.map((s, i) => {
                          const h = (s.avgHours / maxBarVal) * (barChartHeight - 20);
                          return (
                             <Rect
                                key={i}
                                x={i * (barWidth + barSpacing) + 10}
                                y={barChartHeight - h}
                                width={barWidth}
                                height={h}
                                fill={isDark ? "#A78BFA" : "#8B5CF6"}
                                rx="4"
                             />
                          );
                       })}
                    </Svg>
                 </View>
                 <Text style={styles.barLegend}>Top 5 Slowest Sites</Text>
              </SoftCard>
           </View>
        </View>

        {/* Site Performance List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{role === 'client' ? "LOCATIONS COVERED" : "SITES HANDLED"}</Text>
          <SoftCard style={styles.listCard}>
            {stats.siteMetrics.length > 0 ? stats.siteMetrics.map((sm, i) => (
              <View key={sm.id} style={[styles.listItem, i !== stats.siteMetrics.length - 1 && styles.borderBottom]}>
                <View style={styles.listTextContainer}>
                  <Text style={styles.listName}>{sm.name}</Text>
                  <Text style={styles.listSub}>{sm.count} complaints raised</Text>
                </View>
                <View style={styles.listMetric}>
                   <Feather name="clock" size={12} color={isDark ? "#94A3B8" : "#6B7280"} style={{ marginRight: 4 }} />
                   <Text style={styles.metricText}>{sm.avgTime}</Text>
                </View>
              </View>
            )) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No site data available for this period.</Text>
              </View>
            )}
          </SoftCard>
        </View>

        {/* Insights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DYNAMIC INSIGHTS</Text>
          <View style={styles.insightsList}>
            {stats.insights.map((insight, i) => (
              <View 
                key={i} 
                style={[
                  styles.insightItem, 
                  insight.type === 'alert' && styles.insightAlert,
                  insight.type === 'warning' && styles.insightWarning,
                  insight.type === 'success' && styles.insightSuccess,
                ]}
              >
                <Feather 
                  name={insight.type === 'alert' ? 'alert-octagon' : (insight.type === 'warning' ? 'alert-triangle' : 'check-circle')} 
                  size={16} 
                  color={insight.type === 'alert' ? (isDark ? '#FCA5A5' : '#B91C1C') : (insight.type === 'warning' ? (isDark ? '#FCD34D' : '#B45309') : (isDark ? '#6EE7B7' : '#047857'))} 
                />
                <Text style={[
                  styles.insightText,
                  insight.type === 'alert' && { color: isDark ? '#FCA5A5' : '#7F1D1D' },
                  insight.type === 'warning' && { color: isDark ? '#FCD34D' : '#78350F' },
                  insight.type === 'success' && { color: isDark ? '#6EE7B7' : '#064E3B' },
                ]}>
                  {insight.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const getStyles = (isDark: boolean, width: number) => StyleSheet.create({
  root: { flex: 1, backgroundColor: isDark ? Colors.dark.bg : Colors.bg },
  scroll: { paddingBottom: 120 },
  headerStandard: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: isDark ? Colors.dark.bg : '#F8FAFA',
  },
  headerLeft: {
    gap: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: { fontSize: 24, fontFamily: "Inter_900Black", color: '#111827' },
  companyPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  companyPillText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#6B7280' },
  bellBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...Platform.select({
      web: { boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 10, 
        elevation: 2 
      }
    })
  },
  notifBadge: { position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: 'white' },
  avatar: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: 'white' },
  avatarFallback: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#146A65', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: 'white', fontSize: 14, fontFamily: 'Inter_700Bold' },
  darkText: { color: Colors.dark.text },
  darkTextSub: { color: Colors.dark.textSub },
  darkTextMuted: { color: Colors.dark.textMuted },
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_900Black', color: isDark ? Colors.dark.text : '#111827' },
  subtitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: isDark ? Colors.dark.textSub : '#6B7280', marginTop: 4 },
  
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 24, marginBottom: 24 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, backgroundColor: isDark ? Colors.dark.surfaceElevated : 'white', borderWidth: 1, borderColor: isDark ? Colors.dark.border : '#F3F4F6' },
  filterPillActive: { backgroundColor: isDark ? Colors.dark.accent : '#111827', borderColor: isDark ? Colors.dark.accent : '#111827' },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: isDark ? Colors.dark.textSub : '#6B7280' },
  filterTextActive: { color: 'white', fontFamily: 'Inter_800ExtraBold' },
  
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingHorizontal: 24, marginBottom: 24 },
  kpiCard: { width: width > 768 ? ((width - 64) / 4) - 8 : (width - 64) / 2, padding: 20, borderRadius: 24, gap: 12 },
  kpiIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  kpiValue: { fontSize: 24, fontFamily: 'Inter_900Black', color: isDark ? Colors.dark.text : '#111827' },
  kpiLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: isDark ? Colors.dark.textSub : '#6B7280' },
  
  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: isDark ? Colors.dark.textMuted : '#9CA3AF', letterSpacing: 1.5, marginBottom: 12, marginLeft: 4 },
  
  chartCardLarge: { padding: 24, borderRadius: 32, gap: 20 },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chartTitle: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: isDark ? Colors.dark.text : '#111827' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: isDark ? Colors.dark.textSub : '#6B7280' },
  barChartContainerLarge: { height: 120, width: '100%', marginTop: 10 },
  barLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 2 },
  barLabelText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: isDark ? Colors.dark.textMuted : '#94A3B8' },
  barLabelToday: { color: isDark ? '#818CF8' : '#6366F1', fontFamily: 'Inter_800ExtraBold' },

  sideBySide: { flexDirection: width > 768 ? 'row' : 'column', gap: 16, paddingHorizontal: 24, marginBottom: 32 },
  donutCard: { padding: 20, borderRadius: 32, alignItems: 'center', minHeight: 180, justifyContent: 'center' },
  donutStack: { position: 'relative', width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  donutInner: { position: 'absolute', alignItems: 'center' },
  donutNum: { fontSize: 28, fontFamily: 'Inter_900Black', color: isDark ? Colors.dark.text : '#111827' },
  donutTxt: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: isDark ? Colors.dark.textMuted : '#9CA3AF', marginTop: -4 },
  
  barCard: { padding: 20, borderRadius: 32, minHeight: 180, justifyContent: 'center' },
  barChartContainer: { height: 120, alignItems: 'center' },
  barLegend: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: isDark ? Colors.dark.textMuted : '#9CA3AF', textAlign: 'center', marginTop: 12 },
  
  listCard: { padding: 8, borderRadius: 32 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: isDark ? Colors.dark.border : '#F3F4F6' },
  listTextContainer: { flex: 1, gap: 4 },
  listName: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: isDark ? Colors.dark.text : '#111827' },
  listSub: { fontSize: 12, fontFamily: 'Inter_500Medium', color: isDark ? Colors.dark.textSub : '#6B7280' },
  listMetric: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? Colors.dark.surfaceElevated : '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  metricText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: isDark ? '#CBD5E1' : '#4B5563' },
  
  insightsList: { gap: 12 },
  insightItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: isDark ? Colors.dark.border : '#E5E7EB' },
  insightText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1, lineHeight: 20, color: isDark ? Colors.dark.text : '#111827' },
  insightAlert: { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' },
  insightWarning: { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB', borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' },
  insightSuccess: { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4', borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' },
  
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: isDark ? Colors.dark.textMuted : '#9CA3AF' },
});
