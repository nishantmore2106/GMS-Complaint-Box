import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  async registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') {
      console.log('Push notifications are not supported on web.');
      return null;
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Push registration timeout (5s)")), 5000)
    );

    const registrationPromise = (async () => {
      let token;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return null;
        }
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId || "2efde78b-7de0-4a84-bae0-1cdcd927c3e3";
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
          console.log('Expo Push Token retrieved successfully.');
        } catch (e) {
          console.error("Error retrieving Expo Push Token:", e);
        }
      } else {
        console.log('Must use physical device for Push Notifications');
      }

      return token;
    })();

    try {
      return await Promise.race([registrationPromise, timeoutPromise]);
    } catch (e) {
      console.warn("[NotificationService] registration timed out or failed:", e);
      return null;
    }
  },

  async sendLocalNotification(title: string, body: string, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
  },

  async sendRemotePushNotification(tokens: string[], title: string, body: string, data = {}) {
    if (!tokens || tokens.length === 0) return;

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      const result = await response.json();
      console.log("[NotificationService] Remote push sent to", tokens.length, "devices:", result);
    } catch (e) {
      console.error("[NotificationService] Remote push failed:", e);
    }
  }
};
