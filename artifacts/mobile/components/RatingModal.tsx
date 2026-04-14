import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { SoftCard } from "@/components/SoftCard";
import { SoftButton } from "@/components/SoftButton";
import * as Haptics from "expo-haptics";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
  loading?: boolean;
}

export function RatingModal({ visible, onClose, onSubmit, loading }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handlePress = async (idx: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(idx + 1);
  };

  const canSubmit = rating > 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <SoftCard style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Service Quality</Text>
              <Pressable onPress={onClose} disabled={loading} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Colors.textMuted} />
              </Pressable>
            </View>

            <Text style={styles.subtitle}>
              How would you rate the resolution provided for this incident?
            </Text>

            <View style={styles.starRow}>
              {[0, 1, 2, 3, 4].map((i) => {
                const active = i < rating;
                return (
                  <Pressable
                    key={i}
                    onPress={() => handlePress(i)}
                    style={[styles.starBtn, active && styles.starBtnActive]}
                    disabled={loading}
                  >
                    <Feather
                      name="star"
                      size={28}
                      color={active ? Colors.primary : Colors.textMuted}
                      fill={active ? Colors.primary : "transparent"}
                    />
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ADDITIONAL FEEDBACK</Text>
              <TextInput
                style={styles.input}
                placeholder="What could we have done better?"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                value={feedback}
                onChangeText={setFeedback}
                editable={!loading}
                textAlignVertical="top"
              />
            </View>

            <SoftButton 
              title={loading ? "Synchronizing..." : "Submit Feedback"}
              onPress={() => onSubmit(rating, feedback)}
              disabled={!canSubmit || loading}
              loading={loading}
              style={{ marginTop: 10 }}
            />
          </SoftCard>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
  },
  card: {
    padding: 24,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center'
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSub,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  starBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  starBtnActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: 16,
    color: Colors.text,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    minHeight: 100,
  },
});
