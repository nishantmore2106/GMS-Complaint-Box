import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export function LoadingScreen() {
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();

    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [rotation, opacity]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.logoContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Feather name="loader" size={40} color={Colors.accent} />
        </Animated.View>
        <View style={styles.iconOverlay}>
          <Feather name="inbox" size={18} color={Colors.accent} />
        </View>
      </View>
      <Text style={styles.text}>Synchronizing Session...</Text>
      <View style={styles.progressBar}>
        <Animated.View style={styles.progressFill} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconOverlay: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  text: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  progressBar: {
    width: 140,
    height: 3,
    backgroundColor: Colors.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.accent,
  },
});
