import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Keyboard,
  Image,
  Switch,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftCard } from "@/components/SoftCard";
import { SoftButton } from "@/components/SoftButton";
import { SoftInput } from "@/components/SoftInput";
import { useTranslation } from "react-i18next";
import { PremiumRefreshVisuals } from "@/components/PremiumRefreshVisuals";
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import { RefreshControl } from "react-native";

function MenuItem({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { isDarkMode } = useApp();
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, isDarkMode && pressed && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? '#FEF2F2' : (isDarkMode ? '#334155' : '#F3F4F6') }]}>
        <Feather name={icon} size={18} color={danger ? '#EF4444' : (isDarkMode ? 'white' : '#111827')} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && { color: '#EF4444' }, !danger && (isDarkMode ? styles.darkText : { color: '#111827' })]}>{label}</Text>
        {value && <Text style={[styles.rowValue, isDarkMode && styles.darkTextSub]} numberOfLines={1}>{value}</Text>}
      </View>
      {!danger && <Feather name="chevron-right" size={16} color={isDarkMode ? Colors.dark.textMuted : Colors.textMuted} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { 
    currentUser, logout, deleteAccount, updateUser, getCompanyById, companies, users, sites, complaints, profileImage, setProfileImage,
    isDarkMode, setIsDarkMode, notificationsEnabled, setNotificationsEnabled, reportAppIssue, systemSettings, refreshData
  } = useApp();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const company = getCompanyById(currentUser?.companyId ?? "");

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isTermsVisible, setIsTermsVisible] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editPhone, setEditPhone] = useState(currentUser?.phone || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isIssueModalVisible, setIsIssueModalVisible] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [isAboutVisible, setIsAboutVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refreshData();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Permission Required", "Gallery access is needed to update your profile photo. Please enable it in Settings.");
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.warn("[Profile] Image pick error:", err);
    }
  };

  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  } | null>(null);

  const roleLabels = { founder: "Founder", client: "Client", supervisor: "Supervisor" };
  const role = currentUser?.role ?? "client";
  const roleLabel = roleLabels[role];

  const initials = currentUser?.name?.split(" ").map((n) => n[0]).join("") ?? "?";

  // Role-based Stats
  const founderStats = [
    { label: "Managed Sites", value: sites.length, icon: "map-pin" as const, gradient: ["#F0FDF4", "#DCFCE7"] as readonly [string, string, ...string[]], iconColor: "#15803D" },
    { label: "Staff", value: users.filter(u => u.role === 'supervisor').length, icon: "users" as const, gradient: ["#EFF6FF", "#DBEAFE"] as readonly [string, string, ...string[]], iconColor: "#1D4ED8" },
  ];

  const supervisorStats = [
    { label: "My Sites", value: sites.filter(s => s.assignedSupervisorId === currentUser?.id).length, icon: "map-pin" as const, gradient: ["#F0FDF4", "#DCFCE7"] as readonly [string, string, ...string[]], iconColor: "#15803D" },
    { label: "Fixed", value: complaints.filter(c => c.supervisorId === currentUser?.id && c.status === 'resolved').length, icon: "check-circle" as const, gradient: ["#EFF6FF", "#DBEAFE"] as readonly [string, string, ...string[]], iconColor: "#1D4ED8" },
  ];

  const clientStats = [
    { label: "Sites", value: sites.filter(s => s.clientId === currentUser?.id).length, icon: "map-pin" as const, gradient: ["#F0FDF4", "#DCFCE7"] as readonly [string, string, ...string[]], iconColor: "#15803D" },
    { label: "Reports", value: complaints.filter(c => c.clientId === currentUser?.id).length, icon: "alert-circle" as const, gradient: ["#FEF2F2", "#FEE2E2"] as readonly [string, string, ...string[]], iconColor: "#B91C1C" },
  ];

  const handleLogout = () => {
    setConfirmData({
      title: "Sign Out",
      message: "Are you sure you want to exit your current session? You'll need credentials to return.",
      isDestructive: true,
      onConfirm: async () => {
        setIsConfirmVisible(false);
        setIsLoggingOut(true);
        
        const timeoutId = setTimeout(() => {
          setIsLoggingOut(false);
        }, 8000); 

        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
        } catch (e: any) {
          setIsLoggingOut(false);
          clearTimeout(timeoutId);
          Alert.alert("Error", e.message || "Failed to sign out");
        }
      }
    });
    setIsConfirmVisible(true);
  };

  const handleDeleteAccount = () => {
    setConfirmData({
      title: "Delete Account",
      message: "WARNING: This will permanently suspend your access and is irreversible. Your data will be archived according to corporate policy.",
      isDestructive: true,
      onConfirm: async () => {
        setIsConfirmVisible(false);
        setIsLoggingOut(true); // Reuse the loader
        
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          await deleteAccount();
        } catch (e: any) {
          setIsLoggingOut(false);
          Alert.alert("Error", e.message || "Failed to delete account");
        }
      }
    });
    setIsConfirmVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    if (!editName.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    setIsUpdating(true);
    try {
      await updateUser(currentUser.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditModalVisible(false);
      Keyboard.dismiss();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueTitle.trim() || !issueDesc.trim()) {
      Alert.alert("Error", "Title and description are required");
      return;
    }
    setIsReporting(true);
    try {
      await reportAppIssue({
        title: issueTitle.trim(),
        description: issueDesc.trim(),
        app_version: systemSettings?.current_version || "2.4.1",
        device_info: `${Platform.OS} ${Platform.Version}`,
        priority: 'medium'
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsIssueModalVisible(false);
      setIssueTitle("");
      setIssueDesc("");
      Alert.alert("Success", "Your report has been submitted to our technical team.");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit report");
    } finally {
      setIsReporting(false);
    }
  };

  const openEditModal = () => {
    setEditName(currentUser?.name || "");
    setEditPhone(currentUser?.phone || "");
    setIsEditModalVisible(true);
  };

  const statsToRender = role === 'founder' ? founderStats : role === 'supervisor' ? supervisorStats : clientStats;

  return (
    <View style={[styles.root, isDarkMode && styles.darkBg]}>
      <PremiumRefreshVisuals scrollY={scrollY} refreshing={refreshing} isDarkMode={isDarkMode} />
      
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Platform.OS === "web" ? insets.top + 40 : insets.top + 20, paddingBottom: 150 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="transparent"
            colors={["transparent"]}
          />
        }
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>{t('account', 'Account')}</Text>
          <Pressable 
            style={({ pressed }) => [styles.editBtn, isDarkMode && styles.darkCard, pressed && { opacity: 0.7 }]}
            onPress={openEditModal}
          >
            <Feather name="edit-3" size={16} color={isDarkMode ? Colors.dark.text : Colors.text} />
            <Text style={[styles.editBtnText, isDarkMode && styles.darkText]}>{t('edit_profile', 'Edit Profile')}</Text>
          </Pressable>
        </View>

        {/* Identity Section */}
        <View style={styles.identityWrapper}>
          <Pressable onPress={handlePickImage} style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                <Text style={[styles.avatarText, isDarkMode && { color: 'white' }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.editIconBadge, isDarkMode && { backgroundColor: '#334155' }]}>
               <Feather name="camera" size={14} color={isDarkMode ? 'white' : "#111827"} />
            </View>
          </Pressable>
          <View style={styles.identityInfoText}>
            <Text style={[styles.userNameProfessional, isDarkMode && styles.darkText]}>{currentUser?.name || "Guest User"}</Text>
            <View style={[styles.rolePill, isDarkMode && styles.darkElevatedCard]}>
              <Text style={[styles.roleTextProfessional, isDarkMode && styles.darkTextSub]}>{roleLabel} • ID: {currentUser?.displayId}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {statsToRender.map((stat, i) => (
            <LinearGradient key={i} colors={(isDarkMode ? Colors.dark.cardGradient : stat.gradient) as any} style={[styles.statCard, isDarkMode && styles.darkCard]}>
              <View style={[styles.statIconBox, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)' }]}>
                <Feather name={stat.icon} size={16} color={isDarkMode ? 'white' : stat.iconColor} />
              </View>
              <View>
                <Text style={[styles.statVal, isDarkMode && styles.darkText]}>{stat.value}</Text>
                <Text style={[styles.statLab, isDarkMode && styles.darkTextSub]}>{stat.label}</Text>
              </View>
            </LinearGradient>
          ))}
        </View>

        {/* Information Table */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkTextMuted]}>{t('personal_details', 'PERSONAL DETAILS')}</Text>
          <View style={[styles.menuCard, isDarkMode && styles.darkCard]}>
            <MenuItem icon="mail" label={t('email_address', "Email Address")} value={currentUser?.email} />
            <View style={[styles.divisor, isDarkMode && { backgroundColor: '#334155' }]} />
            <MenuItem icon="phone" label={t('mobile_number', "Mobile Number")} value={currentUser?.phone || t('not_provided', "Not provided")} />
            <View style={[styles.divisor, isDarkMode && { backgroundColor: '#334155' }]} />
            <MenuItem icon="briefcase" label={t('organization', "GMS Network")} value={company?.name || t('independent', "Independent")} />
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkTextMuted]}>{t('preferences_title', 'PREFERENCES')}</Text>
          <View style={[styles.menuCard, isDarkMode && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: isDarkMode ? '#334155' : '#F3F4F6' }]}>
                <Feather name="moon" size={18} color={isDarkMode ? 'white' : "#111827"} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, isDarkMode && styles.darkText]}>{t('dark_appearance', 'Dark Appearance')}</Text>
                <Text style={[styles.rowValue, isDarkMode && styles.darkTextSub]}>{isDarkMode ? t('active', 'Active') : t('standard', 'Standard')}</Text>
              </View>
              <Switch 
                value={isDarkMode} 
                onValueChange={setIsDarkMode}
                trackColor={{ false: "#E5E7EB", true: "#3B82F6" }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.divisor, isDarkMode && { backgroundColor: '#334155' }]} />

            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: isDarkMode ? '#334155' : '#F3F4F6' }]}>
                <Feather name="bell" size={18} color={isDarkMode ? 'white' : "#111827"} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, isDarkMode && styles.darkText]}>{t('push_notifications', 'Push Notifications')}</Text>
                <Text style={[styles.rowValue, isDarkMode && styles.darkTextSub]}>{notificationsEnabled ? t('enabled', 'Enabled') : t('paused', 'Paused')}</Text>
              </View>
              <Switch 
                value={notificationsEnabled} 
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#E5E7EB", true: "#10B981" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* App Overview Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkTextMuted]}>{t('app_guide', 'PLATFORM GUIDE')}</Text>
          <View style={[styles.menuCard, isDarkMode && styles.darkCard]}>
            <MenuItem 
              icon="info" 
              label={t('about_gms', "About GMS Platform")} 
              value="Version 2.4.1" 
              onPress={() => setIsAboutVisible(true)} 
            />
          </View>
        </View>

        {/* Actions Table */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkTextMuted]}>{t('advanced', 'ADVANCED')}</Text>
          <View style={[styles.menuCard, isDarkMode && styles.darkCard]}>
            <MenuItem icon="shield" label={t('security_terms', "Security & Terms")} value="View Policies" onPress={() => setIsTermsVisible(true)} />
            <View style={[styles.divisor, isDarkMode && { backgroundColor: '#334155' }]} />
            <MenuItem icon="alert-octagon" label="Report App Issue" value="Found a bug?" onPress={() => setIsIssueModalVisible(true)} />
            <View style={[styles.divisor, isDarkMode && { backgroundColor: '#334155' }]} />
            <MenuItem icon="trash-2" label="Delete Account" onPress={handleDeleteAccount} danger />
            <View style={[styles.divisor, isDarkMode && { backgroundColor: '#334155' }]} />
            <MenuItem icon="log-out" label={t('sign_out_action', "Sign Out Action")} onPress={handleLogout} danger />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerBranding, isDarkMode && styles.darkTextMuted]}>GMS • COMPLAINT BOX</Text>
          <Text style={[styles.footerVersion, isDarkMode && { color: Colors.dark.textMuted, opacity: 0.8 }]}>V2.4.1 RELEASE</Text>
        </View>
      </Animated.ScrollView>

      {/* Edit Profile Overlay */}
      <Modal visible={isEditModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => Keyboard.dismiss()}>
            <Pressable 
              style={[styles.editModalContent, isDarkMode && styles.darkCard]} 
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalHeading, isDarkMode && styles.darkText]}>Modify Identity</Text>
                 <Pressable onPress={() => setIsEditModalVisible(false)} style={[styles.closeModal, isDarkMode && { backgroundColor: '#334155' }]}>
                   <Feather name="x" size={20} color={isDarkMode ? 'white' : Colors.textMuted} />
                 </Pressable>
              </View>

              <View style={styles.modalForm}>
                 <SoftInput 
                   label="Your Preferred Name"
                   value={editName}
                   onChangeText={setEditName}
                   icon="user"
                   placeholder="e.g. Nishant More"
                   isDarkMode={isDarkMode}
                 />
                 <SoftInput 
                   label="Contact Number"
                   value={editPhone}
                   onChangeText={setEditPhone}
                   icon="phone"
                   placeholder="+91 00000 00000"
                   keyboardType="phone-pad"
                   isDarkMode={isDarkMode}
                 />

                 <SoftButton 
                   title={isUpdating ? "Saving..." : "Update Identity"}
                   onPress={handleUpdateProfile}
                   loading={isUpdating}
                   style={{ marginTop: 10 }}
                 />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Logout Confirmation */}
      <Modal visible={isConfirmVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmCard, isDarkMode && styles.darkCard]}>
            <View style={styles.confirmHeader}>
              <View style={[styles.confirmIcon, { backgroundColor: isDarkMode ? '#450a0a' : '#FEF2F2' }]}>
                <Feather name={confirmData?.isDestructive ? "alert-triangle" : "info"} size={24} color="#EF4444" />
              </View>
              <Text style={[styles.confirmTitle, isDarkMode && styles.darkText]}>{confirmData?.title}</Text>
              <Text style={[styles.confirmMsg, isDarkMode && styles.darkTextSub]}>{confirmData?.message}</Text>
            </View>

            <View style={styles.confirmActions}>
              <Pressable style={[styles.cancelBtn, isDarkMode && { backgroundColor: '#334155' }]} onPress={() => setIsConfirmVisible(false)}>
                <Text style={[styles.cancelTxt, isDarkMode && styles.darkText]}>Cancel</Text>
              </Pressable>
              <SoftButton 
                title="Sign Out" 
                onPress={confirmData?.onConfirm || (() => {})} 
                style={styles.confirmFullBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isLoggingOut} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.loaderCard, isDarkMode && styles.darkCard]}>
            <Feather name="loader" size={32} color={Colors.primary} />
            <Text style={[styles.loaderTxt, isDarkMode && styles.darkText]}>Finalizing request...</Text>
          </View>
        </View>
      </Modal>

      {/* Terms & Policy Modal */}
      <Modal visible={isTermsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.termsCard, isDarkMode && { backgroundColor: '#1E293B' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeading, isDarkMode && { color: 'white' }]}>Terms & Privacy</Text>
              <Pressable onPress={() => setIsTermsVisible(false)} style={styles.closeModal}>
                <Feather name="x" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.termsContent}>
              <View style={styles.termsSection}>
                <View style={[styles.termsIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Feather name="eye" size={24} color="#4F46E5" />
                </View>
                <Text style={[styles.termsTitle, isDarkMode && { color: 'white' }]}>Operational Transparency</Text>
                <Text style={[styles.termsText, isDarkMode && { color: 'white', opacity: 0.7 }]}>
                  Clients benefit from 100% visibility. Real-time status tracking and evidence-backed resolutions (photo uploads) ensure that every reported issue is addressed with verifiable proof of work.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <View style={[styles.termsIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Feather name="map-pin" size={24} color="#10B981" />
                </View>
                <Text style={[styles.termsTitle, isDarkMode && { color: 'white' }]}>Data Integrity & Geofencing</Text>
                <Text style={[styles.termsText, isDarkMode && { color: 'white', opacity: 0.7 }]}>
                  Our advanced geofencing ensures that reports are only filed when personnel are physically present at the site. This protects clients from fraudulent reporting and provides GMS with high-accuracy operational data.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <View style={[styles.termsIconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Feather name="shield" size={24} color="#EA580C" />
                </View>
                <Text style={[styles.termsTitle, isDarkMode && { color: 'white' }]}>Mutual Accountability</Text>
                <Text style={[styles.termsText, isDarkMode && { color: 'white', opacity: 0.7 }]}>
                  Every interaction is timestamped and logged, creating an immutable audit trail. This protects the client's interests by ensuring service delivery and protects GMS personnel by verifying their professional actions.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <View style={[styles.termsIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Feather name="trending-up" size={24} color="#3B82F6" />
                </View>
                <Text style={[styles.termsTitle, isDarkMode && { color: 'white' }]}>Service Level Excellence</Text>
                <Text style={[styles.termsText, isDarkMode && { color: 'white', opacity: 0.7 }]}>
                  Automated performance analytics allow GMS to optimize response times and maintain industry-leading service quality, ensuring that your facilities remain in peak operational condition.
                </Text>
              </View>

              <View style={styles.footerBrandingBox}>
                <Text style={styles.footerBranding}>GMS • MUTUAL TRUST CENTER</Text>
                <Text style={styles.footerVersion}>Platform Terms V2.4 • Updated April 2026</Text>
              </View>
            </ScrollView>

            <SoftButton 
              title="I Understand" 
              onPress={() => setIsTermsVisible(false)}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
      {/* Report Issue Modal */}
      <Modal visible={isIssueModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={() => Keyboard.dismiss()}>
            <Pressable 
              style={[styles.editModalContent, isDarkMode && styles.darkCard]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalHeading, isDarkMode && styles.darkText]}>Report App Issue</Text>
                <Pressable onPress={() => setIsIssueModalVisible(false)} style={[styles.closeModal, isDarkMode && { backgroundColor: '#334155' }]}>
                  <Feather name="x" size={20} color={isDarkMode ? 'white' : Colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.modalForm}>
                <SoftInput 
                  label="Issue Title"
                  value={issueTitle}
                  onChangeText={setIssueTitle}
                  placeholder="e.g. App crashes on login"
                  isDarkMode={isDarkMode}
                />
                <SoftInput 
                  label="Detailed Description"
                  value={issueDesc}
                  onChangeText={setIssueDesc}
                  placeholder="Describe what happened..."
                  multiline
                  isDarkMode={isDarkMode}
                />
                <SoftButton 
                  title={isReporting ? "Reporting..." : "Submit Report"}
                  onPress={handleReportIssue}
                  loading={isReporting}
                  style={{ marginTop: 10 }}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      {/* About Platform Modal */}
      <Modal visible={isAboutVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.termsCard, isDarkMode && styles.darkCard]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeading, isDarkMode && styles.darkText]}>Platform Intelligence</Text>
              <Pressable onPress={() => setIsAboutVisible(false)} style={[styles.closeModal, isDarkMode && { backgroundColor: '#334155' }]}>
                <Feather name="x" size={20} color={isDarkMode ? 'white' : Colors.textMuted} />
              </Pressable>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.termsContent}>
              <View style={styles.termsSection}>
                <View style={[styles.termsIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Feather name="command" size={24} color="#4F46E5" />
                </View>
                <Text style={[styles.termsTitle, isDarkMode && { color: 'white' }]}>Founder: Strategic Hub</Text>
                <Text style={[styles.termsText, isDarkMode && { color: 'white', opacity: 0.7 }]}>
                  Founders maintain full organizational oversight. Features include global site management, real-time personnel tracking, strategic resource allocation, and deep performance analytics across all facilities.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <View style={[styles.termsIconBox, { backgroundColor: '#FFF7ED' }]}>
                  <Feather name="zap" size={24} color="#EA580C" />
                </View>
                <Text style={[styles.termsTitle, isDarkMode && { color: 'white' }]}>Supervisor: Operational Center</Text>
                <Text style={[styles.termsText, isDarkMode && { color: 'white', opacity: 0.7 }]}>
                  Supervisors manage active field operations. Features include instant zone-based notifications, standardized step-by-step resolution workflows, evidence collection (photo upload), and automated resolution reporting.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <View style={[styles.termsIconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Feather name="monitor" size={24} color="#16A34A" />
                </View>
                <Text style={[styles.termsTitle, isDarkMode && { color: 'white' }]}>Client: Status Room</Text>
                <Text style={[styles.termsText, isDarkMode && { color: 'white', opacity: 0.7 }]}>
                  Clients monitor their specific site health. Features include transparent real-time tracking of all reported issues, direct feedback loops with the field team, and historical performance visibility for their assigned site.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <View style={[styles.termsIconBox, { backgroundColor: '#FDF2F8' }]}>
                  <Feather name="cpu" size={24} color="#DB2777" />
                </View>
                <Text style={[styles.termsTitle, isDarkMode && { color: 'white' }]}>Platform Architecture</Text>
                <Text style={[styles.termsText, isDarkMode && { color: 'white', opacity: 0.7 }]}>
                  GMS Platform utilizes advanced geofencing to ensure data integrity, real-time synchronization through a premium brand-loader interaction, and end-to-end encrypted communication for all operational data.
                </Text>
              </View>

              <View style={styles.footerBrandingBox}>
                <Text style={styles.footerBranding}>GMS • COMPLAINT BOX PLATFORM</Text>
                <Text style={styles.footerVersion}>V2.4.1 PRODUCTION BUILD</Text>
              </View>
            </ScrollView>

            <SoftButton 
              title="Close Guide" 
              onPress={() => setIsAboutVisible(false)}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  darkBg: { backgroundColor: Colors.dark.bg },
  darkCard: { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1 },
  darkElevatedCard: { backgroundColor: Colors.dark.surfaceElevated, borderColor: Colors.dark.border, borderWidth: 1 },
  darkText: { color: Colors.dark.text },
  darkTextSub: { color: Colors.dark.textSub },
  darkTextMuted: { color: Colors.dark.textMuted },
  scroll: { paddingHorizontal: 24, gap: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 32, fontFamily: "Inter_900Black", color: '#111827' },
  editBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 100, 
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
  editBtnText: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  
  identityWrapper: { alignItems: 'center', gap: 20, paddingVertical: 16 },
  avatarContainer: { 
    position: 'relative', 
    ...Platform.select({
      web: { boxShadow: '0 12px 20px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 12 }, 
        shadowOpacity: 0.08, 
        shadowRadius: 20, 
        elevation: 6 
      }
    })
  },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: 'white' },
  avatarFallback: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'white' },
  avatarText: { fontSize: 32, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF' },
  editIconBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: 'white', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    ...Platform.select({
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 8, 
        elevation: 4 
      }
    })
  },
  identityInfoText: { alignItems: 'center', gap: 8 },
  userNameProfessional: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  rolePill: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100 },
  roleTextProfessional: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#4B5563' },
  
  statsGrid: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 32 },
  statIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statVal: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  statLab: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#4B5563' },
  
  section: { gap: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#9CA3AF', letterSpacing: 1.5, marginLeft: 8 },
  menuCard: { 
    padding: 8, 
    borderRadius: 32, 
    backgroundColor: 'white', 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.03)', 
    ...Platform.select({
      web: { boxShadow: '0 10px 20px rgba(0,0,0,0.03)' },
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 10 }, 
        shadowOpacity: 0.03, 
        shadowRadius: 20, 
        elevation: 4 
      }
    })
  },
  row: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 16, borderRadius: 24 },
  rowPressed: { backgroundColor: '#F9FAFB' },
  rowIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  rowContent: { flex: 1, gap: 4 },
  rowLabel: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  rowValue: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#6B7280' },
  divisor: { height: 1.5, backgroundColor: '#F3F4F6', marginHorizontal: 24 },
  
  footer: { alignItems: 'center', gap: 6, paddingVertical: 32 },
  footerBranding: { fontSize: 13, fontFamily: 'Inter_900Black', color: '#D1D5DB', letterSpacing: 2 },
  footerVersion: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#D1D5DB', opacity: 0.5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(17, 24, 39, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  editModalContent: { 
    width: '100%', 
    padding: 32, 
    gap: 32, 
    borderRadius: 40, 
    backgroundColor: 'white', 
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 20 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 40, 
        elevation: 10 
      }
    })
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHeading: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  closeModal: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  modalForm: { gap: 24 },
  
  confirmCard: { 
    width: '100%', 
    padding: 40, 
    gap: 32, 
    borderRadius: 48, 
    backgroundColor: 'white', 
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 20 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 40, 
        elevation: 10 
      }
    })
  },
  confirmHeader: { alignItems: 'center', gap: 20 },
  confirmIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  confirmTitle: { fontSize: 24, fontFamily: 'Inter_900Black', color: '#111827' },
  confirmMsg: { fontSize: 16, fontFamily: 'Inter_500Medium', color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  confirmActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  cancelBtn: { flex: 1, height: 58, borderRadius: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelTxt: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#4B5563' },
  confirmFullBtn: { flex: 1.5, height: 58, borderRadius: 100 },
  
  loaderCard: { 
    padding: 48, 
    alignItems: 'center', 
    gap: 24, 
    borderRadius: 40, 
    backgroundColor: 'white', 
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 20 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 40, 
        elevation: 10 
      }
    })
  },
  loaderTxt: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  
  langBtnTextActive: { color: '#111827' },
  
  termsCard: { 
    width: '100%', 
    maxHeight: '80%', 
    padding: 32, 
    borderRadius: 40, 
    backgroundColor: 'white', 
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 20 }, 
        shadowOpacity: 0.1, 
        shadowRadius: 40, 
        elevation: 10 
      }
    })
  },
  termsContent: { gap: 32, paddingBottom: 20 },
  termsSection: { gap: 12 },
  termsIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center' },
  termsTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  termsText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#6B7280', lineHeight: 22 },
  footerBrandingBox: { alignItems: 'center', marginTop: 10, gap: 4 },
});
