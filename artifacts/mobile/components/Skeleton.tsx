import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
  isDarkMode?: boolean;
}

// Core shimmer block with wave animation
export const Skeleton = ({ width, height, borderRadius = 12, style, isDarkMode = false }: SkeletonProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(-screenWidth)).current;

  const baseColor = isDarkMode ? '#1E293B' : '#F0F0F0';
  const shimmerColor = isDarkMode ? '#334155' : '#E0E0E0';
  const highlightColor = isDarkMode ? '#475569' : '#F8F8F8';

  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [translateX, screenWidth]);

  return (
    <View
      style={[
        {
          width: width || '100%',
          height: height || 20,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: screenWidth * 2 }}
        />
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────────────
// Skeleton Layouts for specific screens
// ─────────────────────────────────────────────────────

export const ComplaintCardSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={[styles.card, isDarkMode && styles.darkCard]}>
    <View style={styles.row}>
      <Skeleton width={48} height={48} borderRadius={16} isDarkMode={isDarkMode} />
      <View style={styles.col}>
        <Skeleton width="60%" height={14} borderRadius={7} isDarkMode={isDarkMode} />
        <Skeleton width="40%" height={11} borderRadius={6} style={{ marginTop: 6 }} isDarkMode={isDarkMode} />
      </View>
      <Skeleton width={70} height={28} borderRadius={14} isDarkMode={isDarkMode} />
    </View>
    <Skeleton width="100%" height={60} borderRadius={12} style={{ marginTop: 16 }} isDarkMode={isDarkMode} />
    <View style={[styles.row, { marginTop: 16, justifyContent: 'space-between' }]}>
      <Skeleton width="30%" height={24} borderRadius={8} isDarkMode={isDarkMode} />
      <Skeleton width="20%" height={24} borderRadius={8} isDarkMode={isDarkMode} />
    </View>
  </View>
);

export const ComplaintsListSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <>
    {[0, 1, 2, 3].map(i => (
      <ComplaintCardSkeleton key={i} isDarkMode={isDarkMode} />
    ))}
  </>
);

export const SiteCardSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={[styles.card, isDarkMode && styles.darkCard]}>
    <View style={styles.row}>
      <Skeleton width={52} height={52} borderRadius={18} isDarkMode={isDarkMode} />
      <View style={styles.col}>
        <Skeleton width="55%" height={15} borderRadius={8} isDarkMode={isDarkMode} />
        <Skeleton width="35%" height={11} borderRadius={6} style={{ marginTop: 6 }} isDarkMode={isDarkMode} />
      </View>
      <Skeleton width={32} height={32} borderRadius={16} isDarkMode={isDarkMode} />
    </View>
    <View style={[styles.row, { marginTop: 14, gap: 8 }]}>
      <Skeleton width="28%" height={22} borderRadius={8} isDarkMode={isDarkMode} />
      <Skeleton width="28%" height={22} borderRadius={8} isDarkMode={isDarkMode} />
      <Skeleton width="28%" height={22} borderRadius={8} isDarkMode={isDarkMode} />
    </View>
  </View>
);

export const DashboardStatsSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={{ gap: 16, padding: 24 }}>
    {/* Header */}
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <View style={styles.col}>
        <Skeleton width="50%" height={14} borderRadius={7} isDarkMode={isDarkMode} />
        <Skeleton width="70%" height={28} borderRadius={8} style={{ marginTop: 8 }} isDarkMode={isDarkMode} />
      </View>
      <Skeleton width={48} height={48} borderRadius={24} isDarkMode={isDarkMode} />
    </View>

    {/* KPI row */}
    <View style={[styles.row, { gap: 12, marginTop: 8 }]}>
      <Skeleton width="30%" height={80} borderRadius={20} isDarkMode={isDarkMode} />
      <Skeleton width="30%" height={80} borderRadius={20} isDarkMode={isDarkMode} />
      <Skeleton width="30%" height={80} borderRadius={20} isDarkMode={isDarkMode} />
    </View>

    {/* Chart placeholder */}
    <Skeleton width="100%" height={160} borderRadius={24} style={{ marginTop: 8 }} isDarkMode={isDarkMode} />

    {/* List rows */}
    {[0, 1, 2].map(i => (
      <View key={i} style={[styles.row, styles.card, isDarkMode && styles.darkCard, { padding: 16, margin: 0 }]}>
        <Skeleton width={44} height={44} borderRadius={14} isDarkMode={isDarkMode} />
        <View style={styles.col}>
          <Skeleton width="60%" height={14} borderRadius={7} isDarkMode={isDarkMode} />
          <Skeleton width="40%" height={11} borderRadius={6} style={{ marginTop: 6 }} isDarkMode={isDarkMode} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} isDarkMode={isDarkMode} />
      </View>
    ))}
  </View>
);

export const ProfileSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={{ gap: 24, padding: 24, paddingTop: 60 }}>
    {/* Header */}
    <Skeleton width="40%" height={32} borderRadius={8} isDarkMode={isDarkMode} />
    
    {/* Avatar */}
    <View style={{ alignItems: 'center', gap: 16, paddingVertical: 16 }}>
      <Skeleton width={110} height={110} borderRadius={55} isDarkMode={isDarkMode} />
      <Skeleton width="40%" height={20} borderRadius={10} isDarkMode={isDarkMode} />
      <Skeleton width="25%" height={28} borderRadius={14} isDarkMode={isDarkMode} />
    </View>

    {/* Stats grid */}
    <View style={[styles.row, { gap: 16 }]}>
      <Skeleton width="48%" height={80} borderRadius={28} isDarkMode={isDarkMode} />
      <Skeleton width="48%" height={80} borderRadius={28} isDarkMode={isDarkMode} />
    </View>

    {/* Menu rows */}
    {[0, 1, 2].map(i => (
      <Skeleton key={i} width="100%" height={60} borderRadius={20} isDarkMode={isDarkMode} />
    ))}
  </View>
);

// Simple generic card
export const CardSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={[styles.card, isDarkMode && styles.darkCard]}>
    <View style={styles.row}>
      <Skeleton width={52} height={52} borderRadius={26} isDarkMode={isDarkMode} />
      <View style={styles.col}>
        <Skeleton width="70%" height={16} borderRadius={8} isDarkMode={isDarkMode} />
        <Skeleton width="50%" height={12} borderRadius={6} style={{ marginTop: 8 }} isDarkMode={isDarkMode} />
      </View>
    </View>
    <Skeleton width="100%" height={80} borderRadius={16} style={{ marginTop: 20 }} isDarkMode={isDarkMode} />
    <View style={[styles.row, { justifyContent: 'space-between', marginTop: 20 }]}>
      <Skeleton width="35%" height={28} borderRadius={10} isDarkMode={isDarkMode} />
      <Skeleton width="25%" height={28} borderRadius={10} isDarkMode={isDarkMode} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  darkCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  col: {
    flex: 1,
  },
});
