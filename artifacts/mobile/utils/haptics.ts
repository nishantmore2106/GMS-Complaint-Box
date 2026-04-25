import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Standardized Haptic Feedback Service for GMS Facility
 */
export const HapticsService = {
  /**
   * Success notification - use for completions like site created, complaint submitted
   */
  async success() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn("[HapticsService] success fail:", e);
    }
  },

  /**
   * Error notification - use for failures, validation blocks, geofence violations
   */
  async error() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      console.warn("[HapticsService] error fail:", e);
    }
  },

  /**
   * Warning notification - use for soft warnings or "already performed" actions
   */
  async warning() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      console.warn("[HapticsService] warning fail:", e);
    }
  },

  /**
   * Discrete impact - use for button taps, list item selections, category changes
   * @param style 'light' | 'medium' | 'heavy'
   */
  async impact(style: 'light' | 'medium' | 'heavy' = 'light') {
    if (Platform.OS === 'web') return;
    try {
      const gsdStyle = 
        style === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy :
        style === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
        Haptics.ImpactFeedbackStyle.Light;
      
      await Haptics.impactAsync(gsdStyle);
    } catch (e) {
      console.warn("[HapticsService] impact fail:", e);
    }
  },

  /**
   * Selection change - use for scrolling through wheels or rapid item switching
   */
  async selection() {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      console.warn("[HapticsService] selection fail:", e);
    }
  }
};
