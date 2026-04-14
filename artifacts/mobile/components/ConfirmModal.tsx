import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info" | "success";
}

export function ConfirmModal({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger"
}: Props) {
  const { isDarkMode } = useApp();
  
  const typeColor = {
    danger: "#EF4444",
    info: Colors.accent,
    success: Colors.resolved,
  }[type];

  const typeIcon = {
    danger: "alert-triangle",
    info: "info",
    success: "check-circle",
  }[type] as any;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        
        <View style={[
          styles.content, 
          isDarkMode && { backgroundColor: Colors.dark.surface, borderColor: Colors.dark.border, borderWidth: 1 }
        ]}>
          <View style={[styles.iconContainer, { backgroundColor: typeColor + '15' }]}>
            <Feather name={typeIcon} size={28} color={typeColor} />
          </View>
          
          <Text style={[styles.title, isDarkMode && { color: Colors.dark.text }]}>{title}</Text>
          <Text style={[styles.message, isDarkMode && { color: Colors.dark.textSub }]}>{message}</Text>
          
          <View style={styles.actions}>
            <Pressable 
              style={[styles.btn, styles.cancelBtn, isDarkMode && { borderColor: Colors.dark.border }]} 
              onPress={onCancel}
            >
              <Text style={[styles.cancelText, isDarkMode && { color: Colors.dark.textSub }]}>{cancelText}</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.btn, { backgroundColor: typeColor }]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  content: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "white",
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { fontSize: 24, fontFamily: "Inter_900Black", color: "#111827", textAlign: "center" },
  message: { fontSize: 16, fontFamily: "Inter_500Medium", color: "#6B7280", textAlign: "center", lineHeight: 24 },
  actions: { flexDirection: "row", gap: 12, marginTop: 12, width: "100%" },
  btn: { flex: 1, height: 56, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  cancelBtn: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: "#E5E7EB" },
  cancelText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#4B5563" },
  confirmText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "white" },
});
