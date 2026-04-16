import { Text, StyleSheet, Pressable, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from 'react-native';
import { Colors } from '../constants/colors';

interface SoftButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  isDarkMode?: boolean;
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
}: SoftButtonProps) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  const Content = () => (
    <>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#0F172A' : (isDarkMode ? 'white' : '#111827')} size="small" />
      ) : (
        <Text style={[
          styles.text, 
          !isPrimary && { color: isDarkMode ? 'white' : '#475569' },
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </>
  );

  if (isPrimary) {
    return (
      <Pressable 
        onPress={onPress} 
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.button,
          styles.primaryButton,
          { opacity: (disabled || loading) ? 0.6 : (pressed ? 0.95 : 1) },
          styles.shadow,
          style
        ]}
      >
        <Content />
      </Pressable>
    );
  }

  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        !isOutline && { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1 },
        isOutline && { 
          borderWidth: 1, 
          borderColor: isDarkMode ? '#334155' : '#CBD5E1', 
          backgroundColor: isDarkMode ? 'transparent' : '#FFFFFF' 
        },
        { opacity: (disabled || loading) ? 0.6 : (pressed ? 0.9 : 1) },
        style
      ]}
    >
      <Content />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12, // Professional rounded rectangle
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0F172A',
  },
  text: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  }
});
