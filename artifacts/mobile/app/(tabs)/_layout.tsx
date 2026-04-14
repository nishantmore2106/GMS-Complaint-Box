import { Feather } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";
import React from "react";
import { Platform, View, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";

import { Redirect } from 'expo-router';

export default function TabLayout() {
  const { currentUser, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return null;
  }

  // Fail-safe redirect if session is lost
  if (!currentUser) {
    return <Redirect href="/" />;
  }

  const role = currentUser.role;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.navBg,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 24 : 0,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.navActive,
        tabBarInactiveTintColor: Colors.navInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Feather name="home" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              {/* Using a bulb or activity icon to match the reference look for the second slot */}
              <Feather name="zap" size={24} color={color} />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="action"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
               <Feather name="bar-chart-2" size={24} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Feather name="user" size={24} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="sites"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButtonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === "android" ? 0 : 4,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

