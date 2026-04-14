import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { SoftCard } from './SoftCard';

// 1. Time Pill for Header
export const TimePill = ({ time = "1:30" }) => (
  <View style={styles.timePill}>
    <Text style={styles.timePillVal}>{time}</Text>
    <Text style={styles.timePillLab}>Hour</Text>
  </View>
);

// 2. Striped Progress Bar (Diagonal Lines)
export const StripedProgress = ({ progress = 0.65, color = '#84CC16' }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBase, { backgroundColor: color + '20' }]}>
        <View style={[styles.progressFill, { width: `${Math.min(1, Math.max(0, progress)) * 100}%`, backgroundColor: color }]}>
          <View style={styles.stripeOverlay}>
            {[...Array(20)].map((_, i) => (
              <View key={i} style={styles.stripe} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

// 3. Dotted Progress Bar (Particles)
export const DottedProgress = ({ current = 40, total = 120, color = Colors.primary }) => {
  const dots = 25;
  const activeDots = Math.floor((current / Math.max(1, total)) * dots);
  
  return (
    <View style={styles.dottedRow}>
      {[...Array(dots)].map((_, i) => (
        <View 
          key={i} 
          style={[
            styles.dot, 
            { backgroundColor: i < activeDots ? color : Colors.surfaceBorder },
            i < activeDots && { transform: [{ scale: 1.2 }] }
          ]} 
        />
      ))}
    </View>
  );
};

// 4. Hero Card (Profile + Overlapping Shapes)
export const DashHeroCard = ({ user, stats }: any) => (
  <SoftCard style={styles.heroCard} variant="elevated">
    <View style={styles.heroHeader}>
       <View style={styles.heroInfo}>
          <Text style={styles.heroTag}>{user?.role?.toUpperCase() || 'USER'}'S HUB</Text>
          <Text style={styles.heroID}>Node ID: {user?.id?.slice(0, 8) || '00000000'}</Text>
       </View>
       <View style={styles.profileOverlap}>
          <View style={[styles.profileBg, { backgroundColor: '#E0F2F1' }]} />
          <View style={styles.profileImgWrap}>
             <View style={styles.avatarCircle}>
                <Text style={styles.avatarTxt}>{user?.name?.[0] || '?'}</Text>
             </View>
          </View>
       </View>
    </View>

    <View style={styles.heroStats}>
       <View style={styles.heroMetric}>
          <View style={styles.metricHead}>
             <Text style={styles.metricLab}>Avg. Adherence</Text>
             <Text style={styles.metricVal}>{stats.adherence}%</Text>
          </View>
          <StripedProgress progress={stats.adherence / 100} color="#84CC16" />
       </View>
       
       <View style={styles.heroMetric}>
          <View style={styles.metricHead}>
             <Text style={styles.metricLab}>Reports vs Solved</Text>
             <Text style={styles.metricVal}>{stats.pills}/{stats.total}</Text>
          </View>
          <DottedProgress current={stats.pills} total={stats.total} color={Colors.primary} />
       </View>
    </View>
  </SoftCard>
);

// 5. Action Card (Pastel themed)
export const ActionCard = ({ title, subtitle, icon, bgColor, iconColor = Colors.primary, onPress }: any) => (
  <Pressable 
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionCard, 
      { backgroundColor: bgColor },
      pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
    ]}
  >
    <View style={styles.actionContent}>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </View>
    <View style={styles.actionIconOuter}>
       <View style={styles.actionIconInner}>
          <Feather name={icon} size={20} color={iconColor} />
       </View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  heroCard: { padding: 32, gap: 32, borderRadius: 40, backgroundColor: 'white' },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroInfo: { gap: 8 },
  heroTag: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#111827' },
  heroID: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#6B7280' },
  profileOverlap: { width: 100, height: 100, position: 'relative' },
  profileBg: { 
    position: 'absolute', top: -10, right: -20, 
    width: 120, height: 120, borderRadius: 60, 
  },
  profileImgWrap: { 
    width: 90, height: 90, borderRadius: 45, 
    backgroundColor: 'white', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 
  },
  avatarCircle: { flex: 1, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 36, fontFamily: 'Inter_800ExtraBold', color: Colors.primary },
  
  heroStats: { gap: 24 },
  heroMetric: { gap: 8 },
  metricHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLab: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#374151' },
  metricVal: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#111827' },

  timePill: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'white',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#F9731640',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  timePillVal: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#111827' },
  timePillLab: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#6B7280', textTransform: 'uppercase' },
  
  progressContainer: { height: 28, width: '100%', marginTop: 8 },
  progressBase: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 14, position: 'relative', overflow: 'hidden' },
  stripeOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    flexDirection: 'row', 
    gap: 8, 
    transform: [{ skewX: '-20deg' }] 
  },
  stripe: { width: 4, height: '150%', backgroundColor: 'rgba(255,255,255,0.3)', marginTop: -5 },
  
  dottedRow: { flexDirection: 'row', gap: 4, alignItems: 'center', height: 20, marginTop: 8 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  
  actionCard: { 
    flex: 1, height: 170, borderRadius: 32, padding: 24, 
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 
  },
  actionContent: { gap: 6 },
  actionSubtitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#374151', opacity: 0.6 },
  actionTitle: { fontSize: 20, fontFamily: 'Inter_900Black', color: '#111827', lineHeight: 26 },
  actionIconOuter: { alignSelf: 'flex-end' },
  actionIconInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
});
