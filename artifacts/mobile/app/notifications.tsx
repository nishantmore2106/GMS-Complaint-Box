import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";
import { SoftCard } from "@/components/SoftCard";

export default function NotificationsScreen() {
  const { notifications, markNotificationAsRead, isDarkMode, currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await markNotificationAsRead(n.id);
    }
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.type.includes('complaint')) {
        router.push({ pathname: "/complaint/[id]", params: { id: notification.data?.complaintId } });
    }
  };

  const groupedNotifications = notifications.reduce((acc: any, n) => {
    const date = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let group = "Earlier";
    if (date.toDateString() === today.toDateString()) group = "Today";
    else if (date.toDateString() === yesterday.toDateString()) group = "Yesterday";

    if (!acc[group]) acc[group] = [];
    acc[group].push(n);
    return acc;
  }, {});

  return (
    <View style={[styles.container, isDarkMode && { backgroundColor: Colors.dark.bg }]}>
      <View style={[styles.navbar, { paddingTop: Platform.OS === "web" ? insets.top + 40 : insets.top + 20 }, isDarkMode && { backgroundColor: Colors.dark.bg }]}>
        <Pressable 
          style={[styles.navBtn, isDarkMode && { backgroundColor: Colors.dark.surface }]} 
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name="chevron-left" size={24} color={isDarkMode ? "white" : Colors.primary} />
        </Pressable>
        <Text style={[styles.title, isDarkMode && { color: 'white' }]}>Pulse Inbox</Text>
        <Pressable 
          style={styles.markAll}
          onPress={handleMarkAllRead}
        >
          <Feather name="check-square" size={18} color={isDarkMode ? "#94A3B8" : "#6B7280"} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, isDarkMode && { backgroundColor: Colors.dark.bg }]} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
             <SoftCard style={[styles.emptyCard, isDarkMode && { backgroundColor: Colors.dark.surface }]}>
                <Feather name="bell-off" size={42} color={Colors.textMuted} />
                <Text style={[styles.emptyTitle, isDarkMode && { color: 'white' }]}>Nothing to report</Text>
                <Text style={styles.emptySub}>We'll notify you here when there's an update on your incidents.</Text>
             </SoftCard>
          </View>
        ) : (
          Object.keys(groupedNotifications).map((group) => (
            <React.Fragment key={group}>
              <Text style={styles.groupHeader}>{group.toUpperCase()}</Text>
              {groupedNotifications[group].map((n: any) => {
                const isAssignment = n.type.includes('assigned');
                const isResolution = n.type.includes('resolved');
                const isNew = n.type.includes('created');

                const getStyles = () => {
                  if (isAssignment) return { bg: '#EEF2FF', icon: '#4F46E5', iconName: 'user-plus' as const };
                  if (isResolution) return { bg: '#ECFDF5', icon: '#10B981', iconName: 'check-circle' as const };
                  return { bg: '#FFF7ED', icon: '#F97316', iconName: 'alert-circle' as const };
                };
                
                const meta = getStyles();

                return (
                  <SoftCard
                    key={n.id}
                    variant={n.isRead ? "flat" : "glass"}
                    style={[
                      styles.notifCard, 
                      !n.isRead && styles.unreadCard,
                      isDarkMode && { backgroundColor: n.isRead ? Colors.dark.surface : Colors.dark.surfaceElevated }
                    ]}
                    onPress={() => handleNotificationPress(n)}
                  >
                    <View style={[styles.typeIcon, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : meta.bg }]}>
                      <Feather name={meta.iconName} size={18} color={meta.icon} />
                    </View>
                    <View style={styles.content}>
                      <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, !n.isRead && styles.unreadText, isDarkMode && { color: 'white' }]}>{n.title}</Text>
                        {!n.isRead && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={[styles.message, isDarkMode && { color: '#94A3B8' }]} numberOfLines={2}>{n.message}</Text>
                      <View style={styles.notifFooter}>
                        <Text style={styles.time}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {n.data?.siteName && (
                           <View style={styles.siteBadge}>
                              <Feather name="map-pin" size={10} color="#94A3B8" />
                              <Text style={styles.siteBadgeText}>{n.data.siteName}</Text>
                           </View>
                        )}
                      </View>
                    </View>
                  </SoftCard>
                );
              })}
            </React.Fragment>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFA' },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 32, paddingBottom: 20 },
  navBtn: { 
    width: 48, height: 48, borderRadius: 16, backgroundColor: 'white', 
    justifyContent: "center", alignItems: "center",
    shadowColor: '#146A65', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  title: { fontSize: 24, fontFamily: "Inter_900Black", color: '#111827' },
  markAll: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  scroll: { padding: 24, gap: 12, paddingBottom: 120 },
  groupHeader: { 
    fontSize: 10, 
    fontFamily: 'Inter_800ExtraBold', 
    color: '#94A3B8', 
    letterSpacing: 1.5, 
    marginTop: 24, 
    marginBottom: 12,
    marginLeft: 4,
    opacity: 0.8
  },
  empty: { flex: 1, marginTop: 80, alignItems: 'center' },
  emptyCard: { padding: 48, alignItems: "center", gap: 20, borderRadius: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_900Black", color: '#111827' },
  emptySub: { fontSize: 13, fontFamily: "Inter_500Medium", color: '#6B7280', textAlign: "center", lineHeight: 20 },
  notifCard: {
    padding: 20,
    flexDirection: "row",
    gap: 16,
    alignItems: 'center',
  },
  unreadCard: {
    borderColor: 'rgba(20, 106, 101, 0.15)',
    borderWidth: 1,
  },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  content: { flex: 1, gap: 4 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: '#4B5563' },
  unreadText: { color: '#111827', fontFamily: 'Inter_900Black' },
  message: { fontSize: 13, fontFamily: "Inter_500Medium", color: '#64748B', lineHeight: 18 },
  notifFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  time: { fontSize: 11, fontFamily: "Inter_700Bold", color: '#CBD5E1' },
  siteBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  siteBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#94A3B8' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
});
