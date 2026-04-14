import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleResetPassword() {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'gms-complaints://reset-password',
      });

      if (error) throw error;
      
      Alert.alert(
        'Success',
        'Password reset link has been sent to your email.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Feather name="key" size={32} color={Colors.primary} />
          </View>
          
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                placeholder="email@example.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>
          </View>

          <Pressable 
            onPress={handleResetPassword} 
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryBtn,
              loading && styles.disabledBtn,
              pressed && styles.pressedBtn
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { marginTop: 40, marginBottom: 40 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  content: { alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontFamily: 'Inter_900Black', color: Colors.text, marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  inputGroup: { width: '100%', marginBottom: 32 },
  label: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.text, marginBottom: 10, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, height: 56, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium', color: Colors.text },
  primaryBtn: { width: '100%', height: 56, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4 },
  disabledBtn: { opacity: 0.6 },
  pressedBtn: { transform: [{ scale: 0.98 }] },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFF' },
});
