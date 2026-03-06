/**
 * StudienplanerScreen - Studienplaner
 * 1:1 Kopie der Website Studienplaner-Seite
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';
import Header from '../components/Header';

const planners = [
  {
    key: 'wiwi',
    title: 'Wirtschaftswissenschaften (BSc.)',
    color: 'blue',
    url: 'https://oeh.jku.at/wirtschaft/studienplaner/wiwi',
  },
  {
    key: 'bwl',
    title: 'Betriebswirtschaftslehre (BSc.)',
    color: 'gold',
    url: 'https://oeh.jku.at/wirtschaft/studienplaner/bwl',
  },
  {
    key: 'iba',
    title: 'International Business Administration (BSc.)',
    color: 'blue',
    url: 'https://oeh.jku.at/wirtschaft/studienplaner/iba',
  },
];

export default function StudienplanerScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const openPlanner = (url) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Header title={t('studienplaner.title')} subtitle={t('studienplaner.section')} showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <Text style={styles.description}>{t('studienplaner.desc')}</Text>

        {/* Planners List */}
        <View style={styles.plannersList}>
          {planners.map((planner) => {
            const isBlue = planner.color === 'blue';
            return (
              <TouchableOpacity
                key={planner.key}
                style={[
                  styles.plannerCard,
                  { borderColor: isBlue ? Colors.blue100 : Colors.gold100 },
                ]}
                onPress={() => openPlanner(planner.url)}
              >
                <View
                  style={[
                    styles.plannerIcon,
                    { backgroundColor: isBlue ? Colors.blue50 : Colors.gold50 },
                  ]}
                >
                  <Ionicons
                    name="map"
                    size={24}
                    color={isBlue ? Colors.blue500 : Colors.gold500}
                  />
                </View>
                <View style={styles.plannerContent}>
                  <Text style={styles.plannerTitle}>{planner.title}</Text>
                  <Text style={styles.plannerDesc}>
                    {t(`studienplaner.descriptions.${planner.key}`)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.openButton,
                    { backgroundColor: isBlue ? Colors.blue500 : Colors.gold500 },
                  ]}
                  onPress={() => openPlanner(planner.url)}
                >
                  <Text style={styles.openButtonText}>{t('studienplaner.openBtn')}</Text>
                  <Ionicons name="open-outline" size={14} color={Colors.white} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="print-outline" size={24} color={Colors.slate500} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Gedruckte Versionen verfügbar</Text>
            <Text style={styles.infoText}>
              Gedruckte Versionen der Studienplaner gibt es bei unseren Sprechstunden oder am
              ÖH-Broschürenständer im Keplergebäude. Komm einfach vorbei!
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Fragen zum Studium?</Text>
          <Text style={styles.ctaDesc}>Wir helfen dir gerne bei der Planung deines Studiums.</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Contact')}
          >
            <Text style={styles.ctaButtonText}>Kontakt aufnehmen</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
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
  description: {
    fontSize: 15,
    color: Colors.slate500,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  plannersList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  plannerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  plannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  plannerContent: {
    marginBottom: 12,
  },
  plannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 4,
  },
  plannerDesc: {
    fontSize: 13,
    color: Colors.slate500,
    lineHeight: 18,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.slate50,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate700,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.slate500,
    lineHeight: 18,
  },
  ctaCard: {
    backgroundColor: Colors.blue500,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  ctaDesc: {
    fontSize: 14,
    color: Colors.blue100,
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold500,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 6,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
