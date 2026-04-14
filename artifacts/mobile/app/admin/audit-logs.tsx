import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import React, { useState, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TextInput,
  Platform,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp, SystemLog } from "@/context/AppContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import * as Haptics from 'expo-haptics';

export default function AuditLogsScreen() {
  const { systemLogs, isDarkMode, refreshData } = useApp();
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase();
    const logs = systemLogs || [];
    return logs.filter(
      (log: SystemLog) =>
        log.message.toLowerCase().includes(q) ||
        log.type.toLowerCase().includes(q)
    ).sort((a: SystemLog, b: SystemLog) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [systemLogs, search]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshData();
    setIsRefreshing(false);
  };

  const renderLogItem = ({ item }: { item: SystemLog }) => {
    const isSecurity = item.type === 'system';
    const date = new Date(item.created_at);
    
    return (
      <View style={[styles.logCard, isDarkMode && styles.darkCard]}>
        <View style={styles.logHeader}>
          <View style={[styles.actionBadge, { backgroundColor: isSecurity ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)' }]}>
            <Text style={[styles.actionText, { color: isSecurity ? '#EF4444' : '#3B82F6' }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.timestamp, isDarkMode && styles.darkTextSub]}>
            {format(date, "MMM d, HH:mm")}
          </Text>
        </View>
        
        <Text style={[styles.details, isDarkMode && styles.darkText]}>{item.message}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, isDarkMode && styles.darkRoot]}>
      <DashboardHeader 
        title="Audit Trail" 
        subtitle="System logs & activity"
        showBack={true}
      />

      <View style={styles.searchBox}>
        <View style={[styles.searchBar, isDarkMode && styles.darkSearchBar]}>
          <Feather name="search" size={18} color={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"} />
          <TextInput
            placeholder="Search records..."
            placeholderTextColor={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"}
            style={[styles.searchInput, isDarkMode && styles.darkText]}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        data={filteredLogs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor={isDarkMode ? 'white' : Colors.primary} 
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="database" size={48} color={isDarkMode ? Colors.dark.border : "#E5E7EB"} />
            <Text style={[styles.emptyText, isDarkMode && styles.darkTextSub]}>
              {search ? "No matches found" : "No activity logs recorded yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  darkRoot: { backgroundColor: Colors.dark.bg },
  searchBox: { paddingHorizontal: 24, paddingBottom: 16 },
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 16, height: 50, borderRadius: 12, gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  darkSearchBar: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  list: { padding: 24, gap: 16, paddingBottom: 100 },
  logCard: { 
    padding: 16, backgroundColor: 'white', borderRadius: 16, gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 1 }
    })
  },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  actionText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold' },
  timestamp: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#9CA3AF' },
  details: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#111827', lineHeight: 20 },
  empty: { flex: 1, height: 300, justifyContent: 'center', alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#9CA3AF' },
  darkText: { color: 'white' },
  darkTextSub: { color: Colors.dark.textSub },
});
