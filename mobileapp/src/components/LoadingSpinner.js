/**
 * LoadingSpinner Component
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export default function LoadingSpinner({ size = 'large', color }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color || Colors.blue500} />
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
});
