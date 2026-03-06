/**
 * StudienplanerScreen - Studienplaner Links
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';
import Header from '../components/Header';

const planerLinks = [
  {
    id: 'wiwi',
    name: 'Wirtschaftswissenschaften',
    url: 'https://studienplaner.oehwirtschaft.at/wiwi',
    color: Colors.blue500,
    bg: Colors.blue50,
  },
  {
    id: 'bwl',
    name: 'Betriebswirtschaftslehre',
    url: 'https://studienplaner.oehwirtschaft.at/bwl',
    color: Colors.gold500,
    bg: Colors.gold50,
  },
  {
    id: 'iba',
    name: 'International Business Administration',
    url: 'https://studienplaner.oehwirtschaft.at/iba',
    color: '#10B981',
    bg: '#ECFDF5',
  },
];

export default function StudienplanerScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const openPlaner = (url) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Header title={t('studienplaner.title')} subtitle={t('studienplaner.section')} showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <Text style={styles.introText}>{t('studienplaner.intro')}</Text>

        {/* Planer Cards */}
        {planerLinks.map((planer) => (
          <TouchableOpacity
            key={planer.id}
            style={[styles.planerCard, { borderColor: planer.color }]}
            onPress={() => openPlaner(planer.url)}
          >
            <View style={[styles.planerIcon, { backgroundColor: planer.bg }]}>
              <Ionicons name="calendar" size={28} color={planer.color} />
            </View>
            <View style={styles.planerContent}>
              <Text style={styles.planerName}>{planer.name}</Text>
              <Text style={styles.planerUrl}>{planer.url.replace('https://', '')}</Text>
            </View>
            <View style={[styles.openButton, { backgroundColor: planer.color }]}>
              <Ionicons name="open-outline" size={18} color={Colors.white} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.blue500} />
          <Text style={styles.infoText}>{t('studienplaner.info')}</Text>
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
  introText: {
    fontSize: 15,
    color: Colors.slate600,
    lineHeight: 24,
    marginBottom: 24,
  },
  planerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  planerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planerContent: {
    flex: 1,
  },
  planerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
  },
  planerUrl: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 4,
  },
  openButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.blue50,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.blue700,
    lineHeight: 20,
    marginLeft: 12,
  },
});
