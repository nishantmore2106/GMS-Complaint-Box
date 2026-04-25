import React, { useRef } from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle, ActivityIndicator, StyleProp, Animated, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { HapticsService } from '../utils/haptics';

interface SoftButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  isDarkMode?: boolean;
  activeScale?: number;
}

export const SoftButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  style,
  textStyle,
  isDarkMode = false,
  activeScale = 0.96,
}: SoftButtonProps) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    HapticsService.impact('light');
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

  const Content = () => (
    <>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : (isDarkMode ? 'white' : '#111827')} size="small" />
      ) : (
        <Text style={[
          styles.text, 
          isPrimary && { color: '#FFFFFF' },
          !isPrimary && { color: isDarkMode ? 'white' : '#475569' },
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </>
  );

  return (
    <Pressable 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={({ pressed }) => [
        Platform.OS === 'web' && { cursor: (disabled || loading) ? 'default' : 'pointer' } as any
      ]}
    >
      <Animated.View 
        style={[
          styles.button,
          isPrimary && styles.primaryButton,
          !isPrimary && !isOutline && { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: 'rgba(20, 106, 101, 0.1)', borderWidth: 1 },
          isOutline && { 
            borderWidth: 1.5, 
            borderColor: isDarkMode ? '#334155' : 'rgba(20, 106, 101, 0.2)', 
            backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF' 
          },
          { transform: [{ scale: scaleAnim }] },
          { opacity: (disabled || loading) ? 0.6 : 1 },
          isPrimary && styles.shadow,
          style
        ]}
      >
        <Content />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 60,
    borderRadius: 100, // Modern pill shape
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#111827',
  },
  text: {
    color: '#0F172A',
    fontSize: 16,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.2,
  },
  shadow: {
    shadowColor: '#146A65',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  }
});
