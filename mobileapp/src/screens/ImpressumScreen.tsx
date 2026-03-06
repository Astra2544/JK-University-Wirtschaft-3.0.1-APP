/**
 * ImpressumScreen - Impressum
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';
import Header from '../components/Header';

export default function ImpressumScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Header title="Impressum" subtitle="Rechtliches" showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.orgHeader}>
              <View style={styles.orgIcon}>
                <Ionicons name="business" size={24} color={Colors.blue500} />
              </View>
              <Text style={styles.orgName}>
                Hochschülerinnen- und Hochschülerschaft an der Johannes-Kepler-Universität Linz
              </Text>
            </View>

            <Text style={styles.orgSubtitle}>Studienvertretung Wirtschaftswissenschaften</Text>

            <Text style={styles.paragraph}>
              Die Studienvertretung „ÖH Wirtschaft" ist ein Organ der Hochschülerinnen- und
              Hochschülerschaft an der Johannes-Kepler-Universität Linz.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kontakt</Text>
            
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.slate500} />
              <TouchableOpacity onPress={() => Linking.openURL('mailto:wirtschaft@oeh.jku.at')}>
                <Text style={styles.contactText}>wirtschaft@oeh.jku.at</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={18} color={Colors.slate500} />
              <Text style={styles.contactText}>Keplergebäude, Johannes Kepler Universität Linz</Text>
            </View>

            <View style={styles.contactRow}>
              <Ionicons name="globe-outline" size={18} color={Colors.slate500} />
              <TouchableOpacity onPress={() => Linking.openURL('https://oeh.jku.at/wirtschaft')}>
                <Text style={[styles.contactText, styles.link]}>oeh.jku.at/wirtschaft</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rechtlich verantwortlich</Text>
            <Text style={styles.paragraph}>
              Der Vorsitzende der Studienvertretung Wirtschaftswissenschaften
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  orgIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
    lineHeight: 22,
  },
  orgSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.blue500,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.slate600,
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate800,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: Colors.slate600,
  },
  link: {
    color: Colors.blue500,
    textDecorationLine: 'underline',
  },
});
