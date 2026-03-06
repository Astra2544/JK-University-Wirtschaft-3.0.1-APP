/**
 * Card Components - Reusable card styles
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface QuickLinkCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title;
  subtitle;
  accent: 'blue' | 'gold';
  onPress: () => void;
}

export function QuickLinkCard({ icon, title, subtitle, accent, onPress }: QuickLinkCardProps) {
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

interface StatCardProps {
  value;
  label;
  accent: 'blue' | 'gold';
}

export function StatCard({ value, label, accent }: StatCardProps) {
  const textColor = accent === 'blue' ? Colors.blue500 : Colors.gold500;
  
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

interface InfoCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function InfoCard({ children, style }: InfoCardProps) {
  return (
    <View style={[styles.infoCard, style]}>
      {children}
    </View>
  );
}

interface CtaCardProps {
  title;
  description;
  buttonText;
  onPress: () => void;
  variant?: 'blue' | 'gold';
}

export function CtaCard({ title, description, buttonText, onPress, variant = 'blue' }: CtaCardProps) {
  const bgColor = variant === 'blue' 
    ? { backgroundColor: Colors.blue500 } 
    : { backgroundColor: Colors.gold500 };
  const btnBg = variant === 'blue' ? Colors.gold500 : Colors.white;
  const btnText = variant === 'blue' ? Colors.blue700 : Colors.gold600;
  
  return (
    <View style={[styles.ctaCard, bgColor]}>
      <Text style={styles.ctaTitle}>{title}</Text>
      <Text style={styles.ctaDescription}>{description}</Text>
      <TouchableOpacity 
        style={[styles.ctaButton, { backgroundColor: btnBg }]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={[styles.ctaButtonText, { color: btnText }]}>{buttonText}</Text>
        <Ionicons name="arrow-forward" size={16} color={btnText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Quick Link Card
  quickLinkCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
    flex: 1,
  },
  quickLinkIcon: {
    marginBottom: 12,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.slate900,
    marginBottom: 2,
  },
  quickLinkSubtitle: {
    fontSize: 12,
    color: Colors.slate400,
  },
  quickLinkArrow: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  
  // Stat Card
  statCard: {
    backgroundColor: Colors.slate50,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.slate100,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    color: Colors.slate400,
    textAlign: 'center',
  },
  
  // Info Card
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  
  // CTA Card
  ctaCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 6,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
