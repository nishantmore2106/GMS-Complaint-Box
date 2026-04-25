import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, Image, ActivityIndicator } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate, 
  withRepeat, 
  withTiming, 
  Easing,
  useDerivedValue
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PremiumRefreshVisualsProps {
  scrollY: Animated.SharedValue<number>;
  refreshing: boolean;
  isDarkMode: boolean;
}

export const PremiumRefreshVisuals = ({ scrollY, refreshing, isDarkMode }: PremiumRefreshVisualsProps) => {
  const insets = useSafeAreaInsets();
  
  const rotation = useDerivedValue(() => {
    if (refreshing) return 0;
    return interpolate(-scrollY.value, [0, 120], [0, 360], Extrapolate.CLAMP);
  });

  const iconStyle = useAnimatedStyle(() => {
    const pullDistance = -scrollY.value;
    
    // Scale and opacity based on pull distance
    const opacity = interpolate(pullDistance, [0, 70], [0, 1], Extrapolate.CLAMP);
    const scale = interpolate(pullDistance, [0, 100], [0.4, 1.1], Extrapolate.CLAMP);
    
    if (refreshing) {
      return {
        opacity: 1,
        transform: [
          { scale: 1.1 },
          { rotate: withRepeat(withTiming('360deg', { duration: 1000, easing: Easing.linear }), -1, false) }
        ]
      };
    }

    return {
      opacity,
      transform: [
        { scale },
        { rotate: `${rotation.value}deg` }
      ]
    };
  });

  const bgStyle = useAnimatedStyle(() => {
    const pullDistance = -scrollY.value;
    const height = Math.max(0, pullDistance + insets.top + 50);
    const opacity = interpolate(pullDistance, [0, 100], [0, 0.2], Extrapolate.CLAMP);

    return {
      height,
      opacity: refreshing ? 0.1 : opacity,
      backgroundColor: isDarkMode ? Colors.dark.accent : Colors.inProgress,
    };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} pointerEvents="none">
      {/* Background Glow */}
      <Animated.View style={[styles.glow, bgStyle]} />
      
      {/* Animated Icon Container */}
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.iconWrapper, iconStyle, isDarkMode && styles.darkIconWrapper]}>
          <View style={[styles.innerCircle, isDarkMode && styles.darkInnerCircle]}>
             <Image 
               source={require('../assets/images/icon.png')} 
               style={styles.brandIcon}
               resizeMode="contain"
             />
             {refreshing && (
               <View style={styles.loaderOverlay}>
                 <ActivityIndicator size="small" color={isDarkMode ? Colors.dark.accent : Colors.inProgress} />
               </View>
             )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  glow: {
    position: 'absolute',
    top: 0,
    width: '100%',
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    transform: [{ scaleX: 2 }],
  },
  iconContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 18,
      },
      android: {
        elevation: 10,
      }
    })
  },
  darkIconWrapper: {
    backgroundColor: Colors.dark.surface,
    shadowColor: '#000',
    shadowOpacity: 0.4,
  },
  innerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  darkInnerCircle: {
    backgroundColor: Colors.dark.surface,
  },
  brandIcon: {
    width: 36,
    height: 36,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
