/**
 * ImpressumScreen - Impressum
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Colors } from '../constants/Colors';
import Header from '../components/Header';

export default function ImpressumScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Header title={t('impressum.title')} showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Medieninhaber</Text>
          <Text style={styles.bodyText}>
            ÖH Wirtschaft JKU{'\n'}
            Johannes Kepler Universität Linz{'\n'}
            Altenberger Straße 69{'\n'}
            4040 Linz, Österreich
          </Text>

          <Text style={styles.sectionTitle}>Kontakt</Text>
          <Text style={styles.bodyText}>
            E-Mail: wirtschaft@oeh.jku.at{'\n'}
            Website: oeh.jku.at/wirtschaft
          </Text>

          <Text style={styles.sectionTitle}>Vertretungsbefugt</Text>
          <Text style={styles.bodyText}>
            Maximilian Pilsner (Vorsitzender)
          </Text>

          <Text style={styles.sectionTitle}>Grundlegende Richtung</Text>
          <Text style={styles.bodyText}>
            Information und Service für Studierende der wirtschaftswissenschaftlichen 
            Studiengänge an der Johannes Kepler Universität Linz.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate50,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
    marginTop: 20,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 15,
    color: Colors.slate600,
    lineHeight: 24,
  },
});
