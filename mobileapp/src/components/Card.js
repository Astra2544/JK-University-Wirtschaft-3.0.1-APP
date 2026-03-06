/**
 * Card Components - Reusable card styles
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export function QuickLinkCard({ icon, title, subtitle, accent, onPress }) {
  const accentColor = accent === 'blue' ? Colors.blue500 : Colors.gold500;
  
  return (
    <TouchableOpacity style={styles.quickLinkCard} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={accentColor} style={styles.quickLinkIcon} />
      <Text style={styles.quickLinkTitle}>{title}</Text>
      <Text style={styles.quickLinkSubtitle}>{subtitle}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.slate300} style={styles.quickLinkArrow} />
    </TouchableOpacity>
  );
}

export function StatCard({ value, label, accent }) {
  const textColor = accent === 'blue' ? Colors.blue500 : Colors.gold500;
  
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function InfoCard({ children, style }) {
  return (
    <View style={[styles.infoCard, style]}>
      {children}
    </View>
  );
}

export function CtaCard({ title, description, buttonText, onPress, variant }) {
  const isGold = variant === 'gold';
  
  return (
    <View style={[styles.ctaCard, isGold && styles.ctaCardGold]}>
      <Text style={[styles.ctaTitle, isGold && styles.ctaTextGold]}>{title}</Text>
      <Text style={[styles.ctaDescription, isGold && styles.ctaTextGold]}>{description}</Text>
      <TouchableOpacity 
        style={[styles.ctaButton, isGold && styles.ctaButtonGold]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.ctaButtonText, isGold && styles.ctaButtonTextGold]}>{buttonText}</Text>
        <Ionicons name="arrow-forward" size={16} color={isGold ? Colors.gold700 : Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  quickLinkCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.slate100,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickLinkIcon: {
    marginRight: 12,
  },
  quickLinkTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.slate900,
  },
  quickLinkSubtitle: {
    fontSize: 13,
    color: Colors.slate500,
    marginRight: 8,
  },
  quickLinkArrow: {
    marginLeft: 4,
  },
  statCard: {
    backgroundColor: Colors.slate50,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.slate600,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  ctaCard: {
    backgroundColor: Colors.blue500,
    borderRadius: 20,
    padding: 24,
    marginVertical: 8,
  },
  ctaCardGold: {
    backgroundColor: Colors.gold100,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 15,
    color: Colors.blue100,
    marginBottom: 16,
    lineHeight: 22,
  },
  ctaTextGold: {
    color: Colors.gold900,
  },
  ctaButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  ctaButtonGold: {
    backgroundColor: Colors.gold200,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.blue600,
    marginRight: 8,
  },
  ctaButtonTextGold: {
    color: Colors.gold700,
  },
});
