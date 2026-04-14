import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useApp } from "@/context/AppContext";
import { Colors } from "@/constants/colors";
import { SoftCard } from "@/components/SoftCard";

export default function NotificationsScreen() {
  const { notifications, markNotificationAsRead } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleNotificationPress = async (notification: any) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.type === 'complaint_new' || notification.type === 'complaint_resolved') {
        router.push("/(tabs)/complaints");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.navbar, { paddingTop: Platform.OS === "web" ? insets.top + 40 : insets.top + 20 }]}>
        <Pressable 
          style={styles.navBtn} 
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Feather name="chevron-left" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.title}>Inbox</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
             <SoftCard style={styles.emptyCard}>
                <Feather name="bell-off" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Nothing to report</Text>
                <Text style={styles.emptySub}>We'll notify you here when there's an update on your incidents.</Text>
             </SoftCard>
          </View>
        ) : (
          notifications.map((n) => (
            <SoftCard
              key={n.id}
              variant={n.isRead ? "flat" : "glass"}
              style={n.isRead ? styles.notifCard : [styles.notifCard, styles.unreadCard]}
              onPress={() => handleNotificationPress(n)}
            >
              <View style={[styles.typeIcon, { backgroundColor: n.type.includes('new') ? '#FFF3E0' : '#A4F0E940' }]}>
                <Feather 
                  name={n.type.includes('new') ? "alert-circle" : "check-circle"} 
                  size={18} 
                  color={n.type.includes('new') ? '#F97316' : '#146A65'} 
                />
              </View>
              <View style={styles.content}>
                <View style={styles.notifHeader}>
                   <Text style={[styles.notifTitle, !n.isRead && styles.unreadText]}>{n.title}</Text>
                   {!n.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message} numberOfLines={2}>{n.message}</Text>
                <Text style={styles.time}>{new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </SoftCard>
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
  scroll: { padding: 32, gap: 16, paddingBottom: 120 },
  empty: { flex: 1, marginTop: 80, alignItems: 'center' },
  emptyCard: { padding: 48, alignItems: "center", gap: 20, borderRadius: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_900Black", color: '#111827' },
  emptySub: { fontSize: 15, fontFamily: "Inter_500Medium", color: '#6B7280', textAlign: "center", lineHeight: 22 },
  notifCard: {
    padding: 24,
    flexDirection: "row",
    gap: 20,
    alignItems: 'center',
    borderRadius: 32,
  },
  unreadCard: {
    backgroundColor: 'white',
    shadowColor: '#146A65', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6,
  },
  typeIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  content: { flex: 1, gap: 6 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: '#4B5563' },
  unreadText: { color: '#111827', fontFamily: 'Inter_900Black' },
  message: { fontSize: 14, fontFamily: "Inter_500Medium", color: '#6B7280', lineHeight: 20 },
  time: { fontSize: 12, fontFamily: "Inter_700Bold", color: '#9CA3AF', marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#146A65' },
});
