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
// Base Skeleton Pieces
// ─────────────────────────────────────────────────────

export const HeaderSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={[styles.header, isDarkMode && styles.darkHeader, { paddingTop: 60 }]}>
    <View style={styles.col}>
      <Skeleton width="40%" height={12} borderRadius={6} isDarkMode={isDarkMode} />
      <Skeleton width="60%" height={24} borderRadius={12} style={{ marginTop: 8 }} isDarkMode={isDarkMode} />
    </View>
    <View style={[styles.row, { gap: 12 }]}>
      <Skeleton width={44} height={44} borderRadius={12} isDarkMode={isDarkMode} />
      <Skeleton width={40} height={40} borderRadius={20} isDarkMode={isDarkMode} />
    </View>
  </View>
);

export const SearchSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
    <Skeleton width="100%" height={56} borderRadius={28} isDarkMode={isDarkMode} />
  </View>
);

export const DashHeroSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
    <View style={[styles.heroCard, isDarkMode && styles.darkCard, { padding: 32, gap: 32, borderRadius: 40 }]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={{ gap: 8, flex: 1 }}>
          <Skeleton width="40%" height={13} borderRadius={6} isDarkMode={isDarkMode} />
          <Skeleton width="60%" height={15} borderRadius={7} isDarkMode={isDarkMode} />
        </View>
        <Skeleton width={90} height={90} borderRadius={45} isDarkMode={isDarkMode} />
      </View>
      <View style={{ gap: 24 }}>
        <View style={{ gap: 12 }}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Skeleton width="30%" height={12} borderRadius={6} isDarkMode={isDarkMode} />
            <Skeleton width="15%" height={18} borderRadius={9} isDarkMode={isDarkMode} />
          </View>
          <Skeleton width="100%" height={28} borderRadius={14} isDarkMode={isDarkMode} />
        </View>
        <View style={{ gap: 12 }}>
           <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Skeleton width="35%" height={12} borderRadius={6} isDarkMode={isDarkMode} />
            <Skeleton width="15%" height={18} borderRadius={9} isDarkMode={isDarkMode} />
          </View>
          <View style={[styles.row, { gap: 4 }]}>
             {[...Array(15)].map((_, i) => (
               <Skeleton key={i} width={6} height={6} borderRadius={3} isDarkMode={isDarkMode} />
             ))}
          </View>
        </View>
      </View>
    </View>
  </View>
);

export const ActionGridSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={{ paddingHorizontal: 24, gap: 16 }}>
    <Skeleton width="30%" height={20} borderRadius={10} isDarkMode={isDarkMode} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <View key={i} style={{ width: '47.5%', height: 170, borderRadius: 32, backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', padding: 24, justifyContent: 'space-between', borderWidth: 1, borderColor: isDarkMode ? '#334155' : '#F1F5F9' }}>
           <View style={{ gap: 8 }}>
             <Skeleton width="60%" height={12} borderRadius={6} isDarkMode={isDarkMode} />
             <Skeleton width="80%" height={20} borderRadius={10} isDarkMode={isDarkMode} />
           </View>
           <View style={{ alignSelf: 'flex-end' }}>
             <Skeleton width={48} height={48} borderRadius={24} isDarkMode={isDarkMode} />
           </View>
        </View>
      ))}
    </View>
  </View>
);

export const DashboardHomeSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }}>
    <DashHeroSkeleton isDarkMode={isDarkMode} />
    <ActionGridSkeleton isDarkMode={isDarkMode} />
    <View style={{ padding: 24 }}>
       <Skeleton width="40%" height={20} borderRadius={10} isDarkMode={isDarkMode} />
       <View style={{ marginTop: 16, gap: 12 }}>
          {[0, 1].map(i => (
             <Skeleton key={i} width="100%" height={80} borderRadius={24} isDarkMode={isDarkMode} />
          ))}
       </View>
    </View>
  </View>
);

// Backward compatibility
export const DashboardStatsSkeleton = DashboardHomeSkeleton;

// ─────────────────────────────────────────────────────
// Layout Skeletons
// ─────────────────────────────────────────────────────

export const ComplaintCardSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={[styles.card, isDarkMode && styles.darkCard, { borderRadius: 32, padding: 24 }]}>
    <View style={styles.row}>
      <Skeleton width={56} height={56} borderRadius={20} isDarkMode={isDarkMode} />
      <View style={styles.col}>
        <Skeleton width="65%" height={16} borderRadius={8} isDarkMode={isDarkMode} />
        <Skeleton width="45%" height={12} borderRadius={6} style={{ marginTop: 8 }} isDarkMode={isDarkMode} />
      </View>
      <Skeleton width={80} height={32} borderRadius={16} isDarkMode={isDarkMode} />
    </View>
    <Skeleton width="100%" height={70} borderRadius={20} style={{ marginTop: 20 }} isDarkMode={isDarkMode} />
    <View style={[styles.row, { marginTop: 20, justifyContent: 'space-between' }]}>
      <Skeleton width="35%" height={28} borderRadius={12} isDarkMode={isDarkMode} />
      <Skeleton width="25%" height={28} borderRadius={12} isDarkMode={isDarkMode} />
    </View>
  </View>
);

export const SiteCardSkeleton = ({ isDarkMode = false }: { isDarkMode?: boolean }) => (
  <View style={[styles.card, isDarkMode && styles.darkCard, { borderRadius: 32, padding: 24 }]}>
    <View style={styles.row}>
      <Skeleton width={60} height={60} borderRadius={24} isDarkMode={isDarkMode} />
      <View style={styles.col}>
        <Skeleton width="70%" height={18} borderRadius={9} isDarkMode={isDarkMode} />
        <Skeleton width="50%" height={13} borderRadius={6} style={{ marginTop: 8 }} isDarkMode={isDarkMode} />
      </View>
      <Skeleton width={40} height={40} borderRadius={20} isDarkMode={isDarkMode} />
    </View>
    <View style={[styles.row, { marginTop: 20, gap: 10 }]}>
      <Skeleton width="30%" height={26} borderRadius={13} isDarkMode={isDarkMode} />
      <Skeleton width="30%" height={26} borderRadius={13} isDarkMode={isDarkMode} />
      <Skeleton width="30%" height={26} borderRadius={13} isDarkMode={isDarkMode} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  darkHeader: {
    backgroundColor: '#0F172A',
  },
  heroCard: {
    backgroundColor: 'white',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});
