import React, { useRef } from 'react';
import { StyleSheet, ViewStyle, Platform, Pressable, StyleProp, Animated, View } from 'react-native';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';

interface SoftCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'flat' | 'elevated' | 'glass';
  onPress?: () => void;
  activeScale?: number;
}

export const SoftCard = ({ 
  children, 
  style, 
  variant = 'elevated', 
  onPress,
  activeScale = 0.98 
}: SoftCardProps) => {
  const { isDarkMode } = useApp();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: activeScale,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const CardContent = (
    <Animated.View style={[
      styles.card,
      { transform: [{ scale: scaleAnim }] },
      isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.borderStrong },
      variant === 'elevated' && styles.elevated,
      variant === 'glass' && (isDarkMode ? styles.darkGlass : styles.glass),
      style
    ]}>
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => Platform.OS === 'web' ? { cursor: 'pointer' } : null}
      >
        {CardContent}
      </Pressable>
    );
  }

  return CardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9', 
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: '#146A65',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: `0px 12px 24px rgba(20, 106, 101, 0.06)`,
      }
    }),
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  darkGlass: {
    backgroundColor: Colors.dark.glass,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
  }
});
