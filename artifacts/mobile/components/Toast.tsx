import React, { createContext, useContext, useState, useCallback } from 'react';
import { Animated, StyleSheet, Text, View, Platform, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start(() => setToast(null));
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  };

  const getColor = (type: ToastType) => {
    switch (type) {
      case 'success': return Colors.resolved;
      case 'error': return Colors.pending;
      case 'warning': return Colors.warning;
      default: return Colors.primary;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { 
              top: insets.top + (Platform.OS === 'web' ? 40 : 20), 
              opacity: fadeAnim, 
              transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] 
            }
          ]}
        >
          <View style={styles.toast}>
            <View style={[styles.iconBox, { backgroundColor: getColor(toast.type) + '15' }]}>
               <Feather name={getIcon(toast.type)} size={18} color={getColor(toast.type)} />
            </View>
            <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
            <Pressable onPress={() => setToast(null)} style={styles.closeBtn}>
              <Feather name="x" size={14} color={Colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: Platform.OS === 'web' ? 450 : '100%',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
