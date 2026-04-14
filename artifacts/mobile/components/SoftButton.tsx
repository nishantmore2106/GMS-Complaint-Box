import { Text, StyleSheet, Pressable, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
        <ActivityIndicator color={isPrimary ? '#FFF' : (isDarkMode ? 'white' : '#111827')} size="small" />
      ) : (
        <Text style={[
          styles.text, 
          !isPrimary && { color: isDarkMode ? 'white' : '#111827' },
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
          { opacity: (disabled || loading) ? 0.6 : (pressed ? 0.9 : 1) },
          styles.shadow,
          style
        ]}
      >
        <LinearGradient
          colors={['#111827', '#1F2937'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Content />
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        !isOutline && { backgroundColor: isDarkMode ? '#2D3748' : '#F3F4F6' },
        isOutline && { 
          borderWidth: 1.5, 
          borderColor: isDarkMode ? '#4A5568' : '#F3F4F6', 
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
    height: 58,
    borderRadius: 100, // Pill shape
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.2,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  }
});
