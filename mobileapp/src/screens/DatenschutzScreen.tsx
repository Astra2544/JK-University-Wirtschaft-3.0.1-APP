/**
 * DatenschutzScreen - Datenschutz
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';
import Header from '../components/Header';

export default function DatenschutzScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Header title="Datenschutz" subtitle="Rechtliches" showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.iconRow}>
              <View style={styles.icon}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.blue500} />
              </View>
            </View>

            <Text style={styles.paragraph}>
              Der Schutz deiner persönlichen Daten ist uns ein wichtiges Anliegen. Da wir eng mit
              der Hochschüler_innenschaft an der JKU (ÖH JKU) kooperieren bzw. Teil deren
              Infrastruktur sind, gilt für unser Angebot die zentrale Datenschutzerklärung der ÖH JKU.
            </Text>

            <Text style={styles.paragraph}>
              In dieser Erklärung erfährst du im Detail, wie mit deinen Daten umgegangen wird,
              welche Rechte du hast und wie du unsere Datenschutzbeauftragten kontaktieren kannst.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datenschutzerklärung</Text>
            <Text style={styles.paragraph}>
              Die vollständige Datenschutzerklärung findest du hier:
            </Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL('https://oeh.jku.at/datenschutz')}
            >
              <Ionicons name="open-outline" size={18} color={Colors.white} />
              <Text style={styles.linkButtonText}>ÖH JKU Datenschutz</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.blue600} />
            <Text style={styles.infoText}>
              Durch die Nutzung dieser App erklärst du dich mit der Datenverarbeitung gemäß der
              oben verlinkten Richtlinie einverstanden.
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
  iconRow: {
    marginBottom: 16,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 14,
    color: Colors.slate600,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.slate800,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.blue50,
    padding: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.blue100,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.blue700,
    lineHeight: 18,
  },
});
