/**
 * SectionHeader Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export default function SectionHeader({ section, title, description }) {
  return (
    <View style={styles.container}>
      {section && (
        <View style={styles.sectionRow}>
          <View style={styles.sectionBar} />
          <Text style={styles.section}>{section}</Text>
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionBar: {
    width: 4,
    height: 16,
    backgroundColor: Colors.blue500,
    borderRadius: 2,
    marginRight: 10,
  },
  section: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.blue500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.slate600,
    lineHeight: 22,
  },
});
