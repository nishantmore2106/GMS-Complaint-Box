import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Animated, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useToast, ToastType } from "../context/ToastContext";
import { Colors } from "../constants/colors";

const TYPE_CONFIG = {
  success: { icon: "check-circle", color: Colors.resolved, bg: Colors.resolvedBg },
  error: { icon: "alert-circle", color: Colors.pending, bg: Colors.pendingBg },
  info: { icon: "info", color: Colors.accent, bg: Colors.accent + "15" },
  warning: { icon: "alert-triangle", color: Colors.warning, bg: Colors.warning + "15" },
};

export function ToastContainer() {
  const { toasts, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.container, { top: insets.top + (Platform.OS === 'web' ? 70 : 10) }]} pointerEvents="box-none">
      {toasts.map((toast) => {
        const config = TYPE_CONFIG[toast.type as ToastType] || TYPE_CONFIG.info;
        return (
          <Animated.View
            key={toast.id}
            entering={FadeInUp.springify()}
            exiting={FadeOutUp}
            layout={Layout.springify()}
            style={[styles.toast, { backgroundColor: Colors.surface, borderColor: config.color + '40' }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
              <Feather name={config.icon as any} size={16} color={config.color} />
            </View>
            <Text style={styles.message}>{toast.message}</Text>
            <Pressable onPress={() => hideToast(toast.id)} style={styles.closeBtn}>
              <Feather name="x" size={14} color={Colors.textMuted} />
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: "center",
    gap: 10,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    width: "100%",
    maxWidth: 400,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
