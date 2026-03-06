/**
 * EmptyState Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

export default function EmptyState({ icon, title, message }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon || 'alert-circle-outline'} size={48} color={Colors.slate300} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.slate700,
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Colors.slate500,
    marginTop: 8,
    textAlign: 'center',
  },
});
