import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, Pressable, StyleProp } from 'react-native';
import { Colors } from '../constants/colors';
import { useApp } from '../context/AppContext';

interface SoftCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'flat' | 'elevated' | 'glass';
  onPress?: () => void;
}

export const SoftCard = ({ children, style, variant = 'elevated', onPress }: SoftCardProps) => {
  const { isDarkMode } = useApp();
  const CardContent = (
    <View style={[
      styles.card,
      isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1 },
      variant === 'elevated' && styles.elevated,
      variant === 'glass' && (isDarkMode ? styles.darkGlass : styles.glass),
      style
    ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
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
  },
  elevated: {
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowColor,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: `0px 20px 40px rgba(20, 106, 101, 0.08)`,
      }
    }),
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  darkGlass: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.4)',
  }
});
