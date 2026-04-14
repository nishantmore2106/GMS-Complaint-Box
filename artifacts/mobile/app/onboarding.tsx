import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SoftButton } from "@/components/SoftButton";

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = {
  founder: [
    {
      title: "Consolidated Command",
      desc: "Manage multiple companies, sites, and personnel from a single unified high-fidelity dashboard.",
      icon: "shield",
      color: "#6366F1", // Indigo
      secondaryColor: "#818CF8"
    },
    {
      title: "Operational Intelligence",
      desc: "Monitor live site health, supervisor performance metrics, and critical incident logs in real-time.",
      icon: "activity",
      color: "#F59E0B", // Amber
      secondaryColor: "#FBBF24"
    },
    {
      title: "Personnel Logistics",
      desc: "Seamlessly provision supervisors and clients, assigning them to designated sites with precision.",
      icon: "users",
      color: "#EC4899", // Pink
      secondaryColor: "#F472B6"
    }
  ],
  supervisor: [
    {
      title: "Ops Control Center",
      desc: "Welcome to your Field Dashboard. Track your total load of pending, active, and completed tasks at a glance.",
      icon: "airplay",
      color: "#6366F1",
      secondaryColor: "#818CF8"
    },
    {
      title: "Urgent Response",
      desc: "High-priority incidents are highlighted in your 'Urgent Mission' card for immediate commencement.",
      icon: "zap",
      color: "#EF4444",
      secondaryColor: "#F87171"
    },
    {
      title: "Workflow Intelligence",
      desc: "Use the 'Next Best Action' feature to efficiently route to your oldest pending tasks and optimize your day.",
      icon: "map",
      color: "#3B82F6",
      secondaryColor: "#60A5FA"
    },
    {
      title: "Progress Tracking",
      desc: "Monitor your 'Today's Workload' bar to visualize your daily completion percentage and field efficiency.",
      icon: "trending-up",
      color: "#10B981",
      secondaryColor: "#34D399"
    },
    {
      title: "Managed Logistics",
      desc: "Access your 'Managed Sites' overview to identify locations requiring critical attention or regular maintenance.",
      icon: "box",
      color: "#8B5CF6",
      secondaryColor: "#A78BFA"
    }
  ],
  client: [
    {
      title: "The Status Room",
      desc: "Your dedicated portal for site health. Monitor every maintenance incident from reporting to resolution.",
      icon: "shield",
      color: "#6366F1",
      secondaryColor: "#818CF8"
    },
    {
      title: "Instant Reporting",
      desc: "Encounter an issue? Use the 'Report Issue' portal to instantly log complaints with photo evidence.",
      icon: "plus-circle",
      color: "#EF4444",
      secondaryColor: "#F87171"
    },
    {
      title: "Real-Time Tracking",
      desc: "Watch your issues move from 'Pending' to 'In Progress' with real-time countdowns and status updates.",
      icon: "clock",
      color: "#F59E0B",
      secondaryColor: "#FBBF24"
    },
    {
      title: "Direct Support",
      desc: "Access the 'My Supervisor' portal to instantly see your assigned manager's credentials for direct coordination.",
      icon: "user",
      color: "#10B981",
      secondaryColor: "#34D399"
    },
    {
      title: "Site Analytics",
      desc: "Review your weekly resolution metrics to ensure your properties are receiving elite-level maintenance care.",
      icon: "pie-chart",
      color: "#8B5CF6",
      secondaryColor: "#A78BFA"
    }
  ]
};

export default function OnboardingScreen() {
  const { currentUser, completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const role = currentUser?.role || "client";
  const slides = ONBOARDING_DATA[role as keyof typeof ONBOARDING_DATA] || ONBOARDING_DATA.client;
  const currentSlide = slides[step];

  useEffect(() => {
    runAnimation();
  }, [step]);

  const runAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.8);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
      router.replace("/(tabs)");
    }
  };

  const handleBack = async () => {
    if (step > 0) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step - 1);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient 
        colors={['#FFFFFF', '#F0F9FF', '#FDF2F8']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Decorative background elements */}
      <View style={[styles.decorCircle, { top: -100, right: -50, backgroundColor: currentSlide.color + '10' }]} />
      <View style={[styles.decorCircle, { bottom: -50, left: -50, width: 300, height: 300, backgroundColor: currentSlide.secondaryColor + '10' }]} />

      <View style={[styles.container, { paddingTop: insets.top + (height > 700 ? 60 : 20), paddingBottom: insets.bottom + 40 }]}>
        
        <Animated.View style={[
          styles.mainContent, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
          }
        ]}>
           <View style={styles.cardWrapper}>
             <LinearGradient
               colors={['#FFFFFF', '#F8FAFC']}
               style={styles.premiumCard}
             >
                <View style={styles.iconStage}>
                   <View style={[styles.iconInnerCircle, { backgroundColor: currentSlide.color + '15' }]}>
                      <View style={[styles.iconCore, { backgroundColor: currentSlide.color }]}>
                         <Feather name={currentSlide.icon as any} size={48} color="white" />
                      </View>
                   </View>
                   {/* Orbiting dots */}
                   <View style={[styles.orbit, { borderColor: currentSlide.color + '20' }]} />
                </View>

                <View style={styles.textContent}>
                   <View style={styles.badgeRow}>
                      <View style={[styles.roleLabel, { backgroundColor: currentSlide.color + '15' }]}>
                        <Text style={[styles.roleLabelText, { color: currentSlide.color }]}>
                          {role.toUpperCase()} PREVIEW
                        </Text>
                      </View>
                      <Text style={styles.stepCounter}>
                        {step + 1} / {slides.length}
                      </Text>
                   </View>
                   <Text style={styles.title}>{currentSlide.title}</Text>
                   <Text style={styles.desc}>{currentSlide.desc}</Text>
                </View>
             </LinearGradient>
           </View>
        </Animated.View>

        <View style={styles.footer}>
          <View style={styles.paginationBox}>
             {slides.map((_, i) => {
               const active = i === step;
               return (
                 <View key={i} style={styles.dotContainer}>
                   <View style={[
                     styles.dot,
                     active ? { backgroundColor: currentSlide.color, width: 24 } : { backgroundColor: '#E2E8F0', width: 8 }
                   ]} />
                 </View>
               );
             })}
          </View>

          <View style={styles.buttonRow}>
            {step > 0 && (
              <Pressable onPress={handleBack} style={styles.backButton}>
                 <Feather name="chevron-left" size={28} color="#64748B" />
              </Pressable>
            )}
            <Pressable 
              onPress={handleNext} 
              style={[styles.nextButton, { backgroundColor: currentSlide.color }]}
            >
               <Text style={styles.nextText}>
                 {step === slides.length - 1 ? "Start Experience" : "Continue"}
               </Text>
               <Feather name="arrow-right" size={20} color="white" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  decorCircle: { position: 'absolute', width: 400, height: 400, borderRadius: 200, zIndex: 0 },
  mainContent: { flex: 1, justifyContent: 'center', zIndex: 1 },
  cardWrapper: {
    ...Platform.select({
      web: { boxShadow: '0 30px 60px -12px rgba(0,0,0,0.12)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10
      }
    })
  },
  premiumCard: {
    padding: 32,
    borderRadius: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  iconStage: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconInnerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  iconCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 10px 20px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      }
    })
  },
  orbit: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  textContent: { alignItems: 'center', width: '100%' },
  badgeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    width: '100%',
    marginBottom: 20
  },
  roleLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  roleLabelText: {
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 1,
  },
  stepCounter: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#94A3B8',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter_900Black',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 16,
    letterSpacing: -1,
  },
  desc: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: { gap: 32 },
  paginationBox: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dotContainer: { height: 8, justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  backButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  nextButton: {
    flex: 1,
    height: 72,
    borderRadius: 36,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0 12px 24px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8
      }
    })
  },
  nextText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Inter_800ExtraBold',
  }
});
