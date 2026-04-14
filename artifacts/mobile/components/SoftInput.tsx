import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle, Platform, Text, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface SoftInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  containerStyle?: ViewStyle;
  isDarkMode?: boolean;
}

export const SoftInput = React.forwardRef<TextInput, SoftInputProps>(
  ({ label, icon, rightIcon, onRightIconPress, error, containerStyle, isDarkMode, ...props }, ref) => {
    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label && <Text style={[styles.label, isDarkMode && { color: Colors.dark.textMuted }]}>{label}</Text>}
        <View style={[
          styles.container, 
          isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border },
          error ? styles.containerError : null
        ]}>
          {icon && (
            <Feather 
              name={icon} 
              size={18} 
              color={error ? '#EF4444' : (isDarkMode ? Colors.dark.textMuted : '#9CA3AF')} 
              style={styles.icon} 
            />
          )}
          <TextInput
            ref={ref}
            placeholderTextColor={isDarkMode ? Colors.dark.textMuted : "#9CA3AF"}
            style={[styles.input, isDarkMode && { color: Colors.dark.text }]}
            {...props}
            keyboardAppearance={isDarkMode ? 'dark' : 'light'}
          />
          {rightIcon && (
            <Pressable 
              onPress={onRightIconPress}
              style={({ pressed }) => [
                styles.rightIconBtn,
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }
              ]}
            >
              <Feather 
                name={rightIcon} 
                size={20} 
                color={isDarkMode ? 'white' : Colors.primary} 
              />
            </Pressable>
          )}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_800ExtraBold',
    color: '#6B7280',
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  container: {
    height: 58,
    backgroundColor: '#F3F4F6',
    borderRadius: 100, // Pill shape
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24, // Wider horizontal padding for pill
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  containerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  icon: {
    marginRight: 12,
  },
  rightIconBtn: {
    padding: 8,
    marginRight: -4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    height: '100%',
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#EF4444',
    marginLeft: 16,
  }
});
