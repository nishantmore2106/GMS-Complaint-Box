import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { useTranslation } from 'react-i18next';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  showProfile?: boolean;
  showCompanyPill?: boolean;
  showBack?: boolean;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  rightElement?: React.ReactNode;
}

export function DashboardHeader({
  title,
  subtitle,
  showNotifications = true,
  showProfile = true,
  showCompanyPill = false,
  showBack = false,
  onProfilePress,
  onNotificationPress,
  rightElement
}: DashboardHeaderProps) {
  const { currentUser, notifications, profileImage, isDarkMode, getCompanyById, selectedCompanyId } = useApp();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const companyId = selectedCompanyId ?? currentUser?.companyId ?? "";
  const company = getCompanyById(companyId);

  return (
    <View style={[
      styles.header, 
      { paddingTop: insets.top + 10 },
      isDarkMode && styles.darkHeader
    ]}>
      <View style={styles.leftContent}>
        {showBack && (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={isDarkMode ? 'white' : Colors.text} />
          </Pressable>
        )}
        
        {showCompanyPill && company && (
          <View style={[styles.companyPill, isDarkMode && styles.darkCompanyPill]}>
            <View style={styles.companyDot} />
            <Text style={[styles.companyName, isDarkMode && styles.darkTextSub]} numberOfLines={1}>
              {company.name}
            </Text>
          </View>
        )}
        
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>
            {title || t('welcome_back', 'Welcome back,')}
          </Text>
          <Text style={[styles.subtitle, isDarkMode && styles.darkTextSub]}>
            {subtitle || currentUser?.name || 'User'}
          </Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        {rightElement}
        
        {showNotifications && (
          <Pressable 
            onPress={onNotificationPress || (() => router.push("/notifications"))}
            style={[styles.iconBtn, isDarkMode && styles.darkIconBtn]}
          >
            <Feather name="bell" size={20} color={isDarkMode ? 'white' : Colors.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        )}

        {showProfile && (
          <Pressable 
            onPress={onProfilePress || (() => router.push("/(tabs)/profile"))}
            style={styles.profileBtn}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.primary }]}>
                <Text style={styles.avatarText}>
                  {currentUser?.name?.substring(0, 1).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.bg,
  },
  darkHeader: {
    backgroundColor: Colors.dark.bg,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleContainer: {
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textMuted,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.text,
  },
  companyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 }
    })
  },
  darkCompanyPill: {
    backgroundColor: Colors.dark.surface,
    borderColor: Colors.dark.border,
  },
  companyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  companyName: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSub,
    maxWidth: 120,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  darkIconBtn: {
    backgroundColor: Colors.dark.surfaceElevated,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  darkText: { color: Colors.dark.text },
  darkTextSub: { color: Colors.dark.textSub },
});
