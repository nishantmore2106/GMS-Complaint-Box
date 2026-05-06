import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export type ComplaintPhase = 'reported' | 'arrived' | 'checking_issue' | 'solving' | 'resolved';

interface PhaseStep {
  id: ComplaintPhase;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}

const PHASES: PhaseStep[] = [
  { id: 'reported', label: 'Reported', icon: 'edit-3', description: 'Complaint successfully logged' },
  { id: 'arrived', label: 'Starting Work', icon: 'play-circle', description: 'Supervisor is on-site' },
  { id: 'checking_issue', label: 'Checking Issue', icon: 'search', description: 'Technical inspection' },
  { id: 'solving', label: 'Solving', icon: 'tool', description: 'Resolving the problem' },
  { id: 'resolved', label: 'Resolved', icon: 'check-circle', description: 'Fully resolved' },
];

interface Props {
  currentPhase: string;
  isDarkMode: boolean;
  history?: { phase: string, timestamp: string }[];
}

export function PhaseTracker({ currentPhase, isDarkMode, history = [] }: Props) {
  const currentIdx = PHASES.findIndex(p => p.id === currentPhase);

  return (
    <View style={styles.container}>
      {PHASES.map((phase, index) => {
        const isCompleted = index < currentIdx || currentPhase === 'resolved';
        const isCurrent = currentPhase === phase.id;
        const isLast = index === PHASES.length - 1;
        
        const timestamp = history.find(h => h.phase === phase.id)?.timestamp;
        const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        return (
          <View key={phase.id} style={styles.phaseContainer}>
            {/* Step Indicator */}
            <View style={styles.indicatorCol}>
              <View 
                style={[
                  styles.dot, 
                  isCompleted && styles.dotCompleted,
                  isCurrent && styles.dotCurrent,
                  isDarkMode && !isCompleted && !isCurrent && styles.dotDark
                ]}
              >
                {isCompleted ? (
                  <Feather name="check" size={12} color="white" />
                ) : (
                  <Feather 
                    name={phase.icon} 
                    size={12} 
                    color={isCurrent ? 'white' : (isDarkMode ? '#64748B' : '#94A3B8')} 
                  />
                )}
              </View>
              {!isLast && (
                <View 
                  style={[
                    styles.line, 
                    isCompleted && styles.lineCompleted,
                    isDarkMode && styles.lineDark
                  ]} 
                />
              )}
            </View>

            {/* Step Content */}
            <View style={styles.contentCol}>
              <View style={styles.labelRow}>
                <Text 
                  style={[
                    styles.label, 
                    isCurrent && styles.labelCurrent,
                    isDarkMode && { color: isCurrent ? Colors.primary : Colors.dark.text }
                  ]}
                >
                  {phase.label}
                </Text>
                {!!timeStr && (
                  <Text style={[styles.time, isDarkMode && { color: Colors.dark.textMuted }]}>
                    {timeStr}
                  </Text>
                )}
              </View>
              <Text 
                style={[
                  styles.description, 
                  isDarkMode && { color: Colors.dark.textSub }
                ]}
              >
                {phase.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  phaseContainer: {
    flexDirection: 'row',
    minHeight: 70,
  },
  indicatorCol: {
    width: 36,
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    zIndex: 2,
  },
  dotDark: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
  },
  dotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#D1FAE5',
  },
  dotCurrent: {
    backgroundColor: '#4F46E5',
    borderColor: '#EEF2FF',
    transform: [{ scale: 1.1 }],
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  lineDark: {
    backgroundColor: '#1E293B',
  },
  lineCompleted: {
    backgroundColor: '#10B981',
  },
  contentCol: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#64748B',
  },
  labelCurrent: {
    color: '#1E293B',
    fontSize: 15,
    fontFamily: 'Inter_900Black',
  },
  description: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#94A3B8',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
});

