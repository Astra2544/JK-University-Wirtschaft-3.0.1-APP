/**
 * Header Component - Page headers with optional back button
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';

export default function Header({ 
  title, 
  subtitle, 
  showBack = false, 
  rightComponent,
  transparent = false 
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[
      styles.container, 
      { paddingTop: insets.top + 8 },
      transparent && styles.transparent
    ]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        {showBack && (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.slate700} />
          </TouchableOpacity>
        )}
        <View style={[styles.titleContainer, showBack && styles.titleWithBack]}>
          {subtitle && (
            <View style={styles.subtitleRow}>
              <View style={styles.subtitleDot} />
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          )}
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
        {rightComponent && (
          <View style={styles.rightComponent}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  titleWithBack: {
    marginLeft: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subtitleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.blue500,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.blue500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.slate900,
  },
  rightComponent: {
    marginLeft: 16,
  },
});
