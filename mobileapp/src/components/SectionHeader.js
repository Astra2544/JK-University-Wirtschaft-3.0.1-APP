/**
 * Section Header Component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface SectionHeaderProps {
  title;
  subtitle?;
  accent?: 'blue' | 'gold';
  action?: {
    label;
    onPress: () => void;
  };
}

export default function SectionHeader({ 
  title, 
  subtitle, 
  accent = 'blue',
  action 
}: SectionHeaderProps) {
  const accentColor = accent === 'blue' ? Colors.blue500 : Colors.gold500;
  
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {action && (
          <TouchableOpacity style={styles.action} onPress={action.onPress}>
            <Text style={styles.actionText}>{action.label}</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.blue500} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accentBar: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.slate900,
    letterSpacing: -0.3,
    flex: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.blue500,
  },
});
