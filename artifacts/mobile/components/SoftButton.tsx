import React, { useRef } from 'react';
import { Text, StyleSheet, Pressable, ViewStyle, TextStyle, ActivityIndicator, StyleProp, Animated, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { HapticsService } from '../utils/haptics';

interface SoftButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'glass';
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
  const isGlass = variant === 'glass';
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
          !isPrimary && { color: isDarkMode ? 'white' : '#111827' },
          isGlass && { color: 'white' },
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </>
  );

  const ButtonWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isPrimary && !disabled) {
      return (
        <LinearGradient
          colors={['#4F46E5', '#3730A3']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.button, styles.shadow, style]}
        >
          {children}
        </LinearGradient>
      );
    }
    return (
      <View 
        style={[
          styles.button,
          isPrimary && styles.primaryButton,
          !isPrimary && !isOutline && !isGlass && { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' },
          isOutline && { 
            borderWidth: 1.5, 
            borderColor: isDarkMode ? '#334155' : '#E2E8F0', 
            backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF' 
          },
          isGlass && {
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
          },
          isPrimary && styles.shadow,
          style
        ]}
      >
        {children}
      </View>
    );
  };

  return (
    <Pressable 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={({ pressed }) => [
        Platform.OS === 'web' && { cursor: (disabled || loading) ? 'default' : 'pointer' } as any,
        { opacity: (disabled || loading) ? 0.6 : 1 }
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <ButtonWrapper>
          <Content />
        </ButtonWrapper>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  text: {
    fontSize: 16,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.2,
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 10px 20px rgba(79, 70, 229, 0.2)',
      }
    }),
  }
});

