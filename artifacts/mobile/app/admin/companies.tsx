import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Image, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { DashboardHeader } from '@/components/DashboardHeader';

export default function CompaniesScreen() {
  const { 
    companies, 
    getCompanySites, 
    getCompanyUsers, 
    notifications, 
    profileImage, 
    currentUser, 
    isDarkMode, 
    deleteCompany 
  } = useApp();
  const insets = useSafeAreaInsets();
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const unreadNotifs = notifications.filter(n => !n.isRead).length;

  return (
    <View style={[styles.root, isDarkMode && styles.darkRoot]}>
      <DashboardHeader 
        title="All Companies"
        subtitle="Manage Organizations"
        showBack
        rightElement={
          <Pressable style={styles.addBtn} onPress={() => router.push("/admin/company-new")}>
            <Feather name="plus" size={20} color="white" />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {companies.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No companies registered yet</Text>
          </View>
        ) : (
          companies.map((c) => {
            const sitesCount = getCompanySites(c.id).length;
            const staffCount = getCompanyUsers(c.id).length;

            return (
              <View key={c.id} style={[styles.card, isDarkMode && styles.darkCard]}>
                <View style={styles.cardHeader}>
                  <View style={styles.companyIcon}>
                    <Feather name="briefcase" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.companyInfo}>
                    <Text style={[styles.companyName, isDarkMode && styles.darkText]}>{c.name}</Text>
                    <Text style={[styles.companyId, isDarkMode && styles.darkTextSub]}>ID: {c.id.substring(0, 8).toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, isDarkMode && styles.darkText]}>{sitesCount}</Text>
                    <Text style={[styles.statLabel, isDarkMode && styles.darkTextSub]}>Sites</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statVal, isDarkMode && styles.darkText]}>{staffCount}</Text>
                    <Text style={[styles.statLabel, isDarkMode && styles.darkTextSub]}>Staff</Text>
                  </View>
                </View>

                <View style={styles.footer}>
                  {currentUser?.role === 'founder' && (
                    <Pressable 
                      style={[styles.deleteBtn, isDeleting === c.id && { opacity: 0.5 }]} 
                      onPress={() => {
                        Alert.alert(
                          "Terminate Organization?",
                          `This will permanently purge ${c.name} and ALL its associated sites, personnel, and complaints from the backend. This cannot be undone.`,
                          [
                            { text: "Cancel", style: "cancel" },
                            { 
                              text: "Delete Forever", 
                              style: "destructive", 
                              onPress: async () => {
                                setIsDeleting(c.id);
                                try {
                                  await deleteCompany(c.id);
                                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                } catch (e) {
                                  Alert.alert("Error", "Failed to remove organization.");
                                } finally {
                                  setIsDeleting(null);
                                }
                              } 
                            }
                          ]
                        );
                      }}
                      disabled={!!isDeleting}
                    >
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </Pressable>
                  )}
                  <Pressable style={styles.manageBtn} onPress={() => {
                    // Logic to select company and go to hub
                    router.push("/admin");
                  }}>
                    <Text style={styles.manageBtnText}>Manage Hub</Text>
                    <Feather name="external-link" size={14} color={Colors.primary} />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFA' },
  darkRoot: { backgroundColor: Colors.dark.bg },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#F8FAFA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: { 
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', 
    justifyContent: "center", alignItems: "center",
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  title: { fontSize: 18, fontFamily: "Inter_900Black", color: '#111827' },
  bellBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 2, borderColor: 'white' },
  avatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'white' },
  avatarFallback: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#146A65', justifyContent: 'center', alignItems: 'center' },
  avatarFallbackText: { color: 'white', fontSize: 16, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  scroll: { padding: 32, gap: 24 },
  card: { backgroundColor: 'white', borderRadius: 32, padding: 24, gap: 24, shadowColor: '#146A65', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 24, elevation: 6 },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  companyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#A4F0E940', justifyContent: 'center', alignItems: 'center' },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 18, fontFamily: 'Inter_900Black', color: '#111827' },
  companyId: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#9CA3AF', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 32, paddingVertical: 4 },
  stat: { gap: 4 },
  statVal: { fontSize: 22, fontFamily: 'Inter_900Black', color: '#111827' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 },
  footer: { borderTopWidth: 1, borderTopColor: '#F0F4F4', paddingTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  manageBtnText: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#146A65' },
  empty: { padding: 80, alignItems: 'center' },
  emptyText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#9CA3AF' },
  darkText: { color: Colors.dark.text },
  darkTextSub: { color: Colors.dark.textSub },
});
