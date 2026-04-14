import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

interface GMSCompanyCardProps {
  isDarkMode: boolean;
}

export function GMSCompanyCard({ isDarkMode }: GMSCompanyCardProps) {
  const handleEmail = () => {
    Linking.openURL('mailto:nishantmore087@gmail.com');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionHeading, isDarkMode && { color: Colors.dark.textMuted }]}>
        GLOBAL HEADQUARTERS
      </Text>
      
      <LinearGradient
        colors={isDarkMode ? ['#1E293B', '#0F172A'] : ['#1E3A8A', '#1E40AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, isDarkMode && styles.darkCard]}
      >
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <View style={styles.logoCircle}>
              <Feather name="globe" size={24} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.brandTitle}>GMS NETWORK</Text>
              <Text style={styles.brandSubtitle}>Central Operations Hub</Text>
            </View>
          </View>
          <View style={styles.shieldBadge}>
            <Feather name="shield" size={14} color="#10B981" />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.contactGrid}>
          <View style={styles.contactItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Feather name="map-pin" size={16} color="#60A5FA" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>HEAD OFFICE</Text>
              <Text style={styles.contactValue}>Vadodara, IN</Text>
            </View>
          </View>

          <Pressable onPress={handleEmail} style={styles.contactItem}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Feather name="mail" size={16} color="#F87171" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>SUPPORT DESK</Text>
              <Text style={styles.contactValue}>nishantmore087@gmail.com</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Global Maintenance Services</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    marginBottom: 40,
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Inter_800ExtraBold',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(30, 58, 138, 0.15)' },
      default: {
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
      }
    }),
  },
  darkCard: {
    borderWidth: 1,
    borderColor: '#334155',
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' },
      default: { shadowOpacity: 0.4 }
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: 'Inter_900Black',
    color: 'white',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#93C5FD',
    marginTop: 2,
  },
  shieldBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    padding: 8,
    borderRadius: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  contactGrid: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  contactValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: 'white',
    marginTop: 2,
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.4)',
  }
});
