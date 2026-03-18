import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function SitesScreen() {
  const {
    currentUser, selectedCompanyId, getCompanySites, getCompanyComplaints,
    getCompanyUsers, assignSupervisorToSite, getUserById, getCompanyById,
  } = useApp();
  const insets = useSafeAreaInsets();
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");

  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const sites = getCompanySites(companyId);
  const complaints = getCompanyComplaints(companyId);
  const supervisors = getCompanyUsers(companyId).filter((u) => u.role === "supervisor");
  const company = getCompanyById(companyId);

  const handleAssign = (siteId: string, supervisorId: string | null) => {
    assignSupervisorToSite(siteId, supervisorId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAssigningId(null);
  };

  const handleInvite = (siteId: string) => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    const existingSup = supervisors.find((u) => u.name.toLowerCase().includes(email) || u.phone === email);
    if (existingSup) {
      handleAssign(siteId, existingSup.id);
      setEmailInput("");
    } else {
      Alert.alert("Invite Sent", `An invitation would be sent to "${emailInput}" to create a supervisor account. (Demo mode — not implemented)`, [
        { text: "OK", onPress: () => { setEmailInput(""); setAssigningId(null); } },
      ]);
    }
  };

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
        <View>
          <Text style={styles.title}>Site Management</Text>
          <Text style={styles.sub}>{company?.name ?? ""}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{sites.length} sites</Text>
        </View>
      </View>

      {sites.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="map-pin" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No sites yet</Text>
          <Text style={styles.emptySub}>Sites will appear here once added to your account</Text>
        </View>
      ) : (
        sites.map((site) => {
          const siteComplaints = complaints.filter((c) => c.siteId === site.id);
          const active = siteComplaints.filter((c) => c.status !== "resolved").length;
          const resolved = siteComplaints.filter((c) => c.status === "resolved").length;
          const assignedSup = site.assignedSupervisorId ? getUserById(site.assignedSupervisorId) : null;
          const health = siteComplaints.length > 0 ? Math.round((resolved / siteComplaints.length) * 100) : 100;
          const healthColor = health >= 80 ? Colors.resolved : health >= 40 ? Colors.inProgress : Colors.pending;
          const isAssigning = assigningId === site.id;

          return (
            <View key={site.id} style={styles.card}>
              {/* Site header */}
              <View style={styles.cardTop}>
                <View style={styles.siteIcon}>
                  <Feather name="map-pin" size={15} color={Colors.accent} />
                </View>
                <View style={styles.siteInfo}>
                  <Text style={styles.siteName}>{site.name}</Text>
                  <View style={styles.siteStats}>
                    {active > 0 && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>{active} active</Text>
                      </View>
                    )}
                    <Text style={styles.resolvedText}>{resolved} resolved</Text>
                  </View>
                </View>
              </View>

              {/* Health bar */}
              <View style={styles.healthRow}>
                <Text style={styles.healthLabel}>Site Health</Text>
                <View style={styles.healthBarWrap}>
                  <View style={styles.healthTrack}>
                    <View style={[styles.healthFill, { width: `${health}%` as any, backgroundColor: healthColor }]} />
                  </View>
                  <Text style={[styles.healthPct, { color: healthColor }]}>{health}%</Text>
                </View>
              </View>

              {/* Supervisor assignment */}
              <View style={styles.assignSection}>
                <View style={styles.assignHeader}>
                  <Feather name="user-check" size={13} color={Colors.textMuted} />
                  <Text style={styles.assignLabel}>Assigned Supervisor</Text>
                </View>

                {assignedSup ? (
                  <View style={styles.supervisorRow}>
                    <View style={styles.supAvatar}>
                      <Text style={styles.supAvatarText}>{assignedSup.name.split(" ").map((n) => n[0]).join("")}</Text>
                    </View>
                    <View style={styles.supInfo}>
                      <Text style={styles.supName}>{assignedSup.name}</Text>
                      <Text style={styles.supId}>ID: {assignedSup.phone}</Text>
                    </View>
                    <Pressable
                      style={styles.changeBtn}
                      onPress={() => setAssigningId(isAssigning ? null : site.id)}
                    >
                      <Text style={styles.changeBtnText}>Change</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.unassignedRow}
                    onPress={() => setAssigningId(isAssigning ? null : site.id)}
                  >
                    <View style={styles.unassignedIcon}>
                      <Feather name="user-plus" size={14} color={Colors.inProgress} />
                    </View>
                    <Text style={styles.unassignedText}>No supervisor assigned — tap to assign</Text>
                    <Feather name="chevron-right" size={14} color={Colors.inProgress} />
                  </Pressable>
                )}

                {/* Assignment panel */}
                {isAssigning && (
                  <View style={styles.assignPanel}>
                    <Text style={styles.panelTitle}>Select Supervisor</Text>

                    {supervisors.map((sup) => (
                      <Pressable
                        key={sup.id}
                        style={[
                          styles.supOption,
                          site.assignedSupervisorId === sup.id && styles.supOptionActive,
                        ]}
                        onPress={() => handleAssign(site.id, sup.id)}
                      >
                        <View style={styles.supOptionAvatar}>
                          <Text style={styles.supOptionInitials}>{sup.name.split(" ").map((n) => n[0]).join("")}</Text>
                        </View>
                        <View style={styles.supOptionInfo}>
                          <Text style={styles.supOptionName}>{sup.name}</Text>
                          <Text style={styles.supOptionId}>ID: {sup.phone}</Text>
                        </View>
                        {site.assignedSupervisorId === sup.id && (
                          <Feather name="check" size={16} color={Colors.accent} />
                        )}
                      </Pressable>
                    ))}

                    <View style={styles.divider} />
                    <Text style={styles.inviteLabel}>Invite by Employee ID or Email</Text>
                    <View style={styles.inviteRow}>
                      <TextInput
                        style={styles.inviteInput}
                        placeholder="Employee ID or email…"
                        placeholderTextColor={Colors.textMuted}
                        value={emailInput}
                        onChangeText={setEmailInput}
                        selectionColor={Colors.accent}
                        autoCapitalize="none"
                      />
                      <Pressable
                        style={[styles.inviteBtn, !emailInput && { opacity: 0.5 }]}
                        onPress={() => handleInvite(site.id)}
                        disabled={!emailInput}
                      >
                        <Text style={styles.inviteBtnText}>Invite</Text>
                      </Pressable>
                    </View>

                    {assignedSup && (
                      <Pressable style={styles.unassignBtn} onPress={() => handleAssign(site.id, null)}>
                        <Feather name="user-x" size={14} color={Colors.pending} />
                        <Text style={styles.unassignBtnText}>Remove Supervisor</Text>
                      </Pressable>
                    )}

                    <Pressable style={styles.closeBtn} onPress={() => setAssigningId(null)}>
                      <Text style={styles.closeBtnText}>Close</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 16, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.text },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 2 },
  countBadge: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, marginTop: 4 },
  countText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.textSub },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textMuted, textAlign: "center", maxWidth: 220 },
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.surfaceBorder, gap: 14 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  siteIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryMuted, justifyContent: "center", alignItems: "center" },
  siteInfo: { flex: 1, gap: 4 },
  siteName: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.text },
  siteStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeBadge: { backgroundColor: Colors.pendingBg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  activeBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.pending },
  resolvedText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  healthRow: { gap: 6 },
  healthLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  healthBarWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  healthTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.surfaceElevated, overflow: "hidden" },
  healthFill: { height: "100%", borderRadius: 3 },
  healthPct: { fontSize: 11, fontFamily: "Inter_600SemiBold", width: 32, textAlign: "right" },
  assignSection: { gap: 10 },
  assignHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  assignLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textMuted },
  supervisorRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 10 },
  supAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryMuted, justifyContent: "center", alignItems: "center" },
  supAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.accent },
  supInfo: { flex: 1 },
  supName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  supId: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  changeBtn: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  changeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.accent },
  unassignedRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.inProgressBg, borderRadius: 12, padding: 12 },
  unassignedIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.inProgress + "30", justifyContent: "center", alignItems: "center" },
  unassignedText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.inProgress },
  assignPanel: { backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.surfaceBorder },
  panelTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.text },
  supOption: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  supOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  supOptionAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryMuted, justifyContent: "center", alignItems: "center" },
  supOptionInitials: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.accent },
  supOptionInfo: { flex: 1 },
  supOptionName: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text },
  supOptionId: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder },
  inviteLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSub },
  inviteRow: { flexDirection: "row", gap: 8 },
  inviteInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  inviteBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: "center" },
  inviteBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.white },
  unassignBtn: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", paddingVertical: 8 },
  unassignBtnText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.pending },
  closeBtn: { alignItems: "center", paddingVertical: 8 },
  closeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.textMuted },
});
