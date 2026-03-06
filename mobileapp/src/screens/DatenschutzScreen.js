/**
 * DatenschutzScreen - Datenschutzerklärung
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

export default function DatenschutzScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Header title={t('datenschutz.title')} showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datenschutzerklärung</Text>
          <Text style={styles.bodyText}>
            Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. 
            Wir verarbeiten Ihre Daten daher ausschließlich auf Grundlage der 
            gesetzlichen Bestimmungen (DSGVO, TKG 2003).
          </Text>

          <Text style={styles.sectionTitle}>Kontakt</Text>
          <Text style={styles.bodyText}>
            Bei Fragen zum Datenschutz erreichen Sie uns unter:{'\n'}
            wirtschaft@oeh.jku.at
          </Text>

          <Text style={styles.sectionTitle}>Erhobene Daten</Text>
          <Text style={styles.bodyText}>
            Diese App erhebt keine personenbezogenen Daten ohne Ihre ausdrückliche 
            Zustimmung. Bei der Nutzung des Kontaktformulars werden die von Ihnen 
            eingegebenen Daten zur Bearbeitung Ihrer Anfrage gespeichert.
          </Text>

          <Text style={styles.sectionTitle}>Ihre Rechte</Text>
          <Text style={styles.bodyText}>
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung und 
            Einschränkung der Verarbeitung Ihrer Daten. Bei Fragen wenden Sie 
            sich bitte an wirtschaft@oeh.jku.at.
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
