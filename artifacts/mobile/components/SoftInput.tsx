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
  ({ label, icon, rightIcon, onRightIconPress, error, containerStyle, isDarkMode, multiline, ...props }, ref) => {
    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label && <Text style={[styles.label, isDarkMode && { color: Colors.dark.textMuted }]}>{label}</Text>}
        <View style={[
          styles.container, 
          multiline && styles.containerMultiline,
          isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border },
          error ? styles.containerError : null
        ]}>
          {icon && (
            <Feather 
              name={icon} 
              size={18} 
              color={error ? '#EF4444' : (isDarkMode ? Colors.dark.textMuted : '#94A3B8')} 
              style={[styles.icon, multiline && { marginTop: 4 }]} 
            />
          )}
          <TextInput
            ref={ref}
            multiline={multiline}
            placeholderTextColor={isDarkMode ? Colors.dark.textMuted : "#94A3B8"}
            style={[styles.input, multiline && styles.inputMultiline, isDarkMode && { color: Colors.dark.text }]}
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
    gap: 6,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#475569',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  container: {
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  containerMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 12,
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
    borderRadius: 8,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    minHeight: 24, // Enough for one line
  },
  inputMultiline: {
    height: '100%',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#EF4444',
    marginLeft: 4,
  }
});
