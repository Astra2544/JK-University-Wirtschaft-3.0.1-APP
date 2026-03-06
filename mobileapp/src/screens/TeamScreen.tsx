/**
 * TeamScreen - Team Mitglieder
 * 1:1 Kopie der Website Team-Seite
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { Colors } from '../constants/Colors';
import { API_URL, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';
import { CtaCard } from '../components/Card';

// Team Data - 1:1 von der Website
const vorsitzender = {
  name: 'Maximilian Pilsner',
  email: 'maximilian.pilsner@oeh.jku.at',
  role: 'Vorsitzender',
  assetKey: 'team/maximilian-pilsner',
};

const bereichsleiter = [
  { name: 'Lucia Schoisswohl', email: 'lucia.schoisswohl@oeh.jku.at', area: 'Medien', color: 'purple', icon: 'camera' },
  { name: 'Stefan Gstöttenmayer', email: 'wirtschaft@oeh.jku.at', area: 'Events', color: 'gold', icon: 'sparkles' },
  { name: 'Sebastian Jensen', email: 'sebastian.jensen@oeh.jku.at', area: 'Internationals', color: 'blue', icon: 'globe' },
  { name: 'Carolina Götsch', email: 'wirtschaft@oeh.jku.at', area: 'Social Media', color: 'pink', icon: 'camera' },
];

const stellvertreter = [
  { name: 'Simon Plangger', email: 'simon.plangger@oeh.jku.at', role: '1. Stv. SoWi-Fakultätsvorsitzender' },
  { name: 'Matej Kromka', email: 'wirtschaft@oeh.jku.at', role: 'Internationals' },
  { name: 'Florian Zimmermann', email: 'wirtschaft@oeh.jku.at', role: 'Events' },
  { name: 'Maxim Tafincev', email: 'wirtschaft@oeh.jku.at', role: 'Events' },
  { name: 'Simon Reisinger', email: 'wirtschaft@oeh.jku.at', role: 'Events' },
  { name: 'Paul Mairleitner', email: 'wirtschaft@oeh.jku.at', role: 'Chefredakteur Ceteris Paribus' },
  { name: 'Sarika Bimanaviona', email: 'wirtschaft@oeh.jku.at', role: 'Global' },
  { name: 'Thomas Kreilinger', email: 'wirtschaft@oeh.jku.at', role: 'Medien' },
  { name: 'Lilli Huber', email: 'lilli.huber@oeh.jku.at', role: 'ÖH WiPäd-Vorsitzende' },
  { name: 'Theresa Kloibhofer', email: 'theresa.kloibhofer@oeh.jku.at', role: 'ÖH Wirtschaft' },
];

const weitereMitglieder = [
  { name: 'Louis Jacquemain', role: 'Internationals' },
  { name: 'Leon Avant', role: 'Internationals' },
  { name: 'Nicolas Kaufman', role: 'ÖH Wirtschaft' },
  { name: 'Matthias Pilz', role: 'ÖH Wirtschaft' },
  { name: 'Moritz Siebert', role: 'ÖH Wirtschaft' },
  { name: 'Lukas Gutmann', role: 'ÖH Wirtschaft' },
  { name: 'Moritz Strachon', role: 'ÖH Wirtschaft' },
  { name: 'Ioana Vasilache', role: 'ÖH Wirtschaft' },
  { name: 'Anna Schaur', role: 'ÖH Wirtschaft' },
  { name: 'Melanie Derntl', role: 'ÖH Wirtschaft' },
];

const colorStyles: Record<string, { bg: string; text: string; badge: string }> = {
  purple: { bg: Colors.purple50, text: Colors.purple500, badge: Colors.purple500 },
  blue: { bg: Colors.blue50, text: Colors.blue500, badge: Colors.blue500 },
  gold: { bg: Colors.gold50, text: Colors.gold500, badge: Colors.gold500 },
  pink: { bg: Colors.pink50, text: Colors.pink500, badge: Colors.pink500 },
};

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('');
}

export default function TeamScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const sendEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={styles.container}>
      <Header title={t('team.title')} subtitle={t('team.section')} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue500]} />
        }
      >
        {/* Description */}
        <Text style={styles.description}>{t('team.desc')}</Text>

        {/* Vorsitzender */}
        <View style={styles.vorsitzenderCard}>
          <View style={styles.vorsitzenderAvatar}>
            <Text style={styles.vorsitzenderInitials}>{getInitials(vorsitzender.name)}</Text>
          </View>
          <View style={styles.vorsitzenderContent}>
            <Text style={styles.vorsitzenderRole}>{vorsitzender.role}</Text>
            <Text style={styles.vorsitzenderName}>{vorsitzender.name}</Text>
            <TouchableOpacity
              style={styles.emailRow}
              onPress={() => sendEmail(vorsitzender.email)}
            >
              <Ionicons name="mail-outline" size={14} color={Colors.blue100} />
              <Text style={styles.vorsitzenderEmail}>{vorsitzender.email}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bereichsleiter */}
        <View style={styles.section}>
          <View style={styles.bereichsleiterGrid}>
            {bereichsleiter.map((person, index) => {
              const style = colorStyles[person.color] || colorStyles.blue;
              return (
                <View key={person.name} style={[styles.bereichsleiterCard, { backgroundColor: style.bg }]}>
                  <View style={[styles.bereichsleiterBadge, { backgroundColor: style.badge }]}>
                    <Ionicons
                      name={person.icon === 'camera' ? 'camera' : person.icon === 'globe' ? 'globe' : 'sparkles'}
                      size={10}
                      color={Colors.white}
                    />
                    <Text style={styles.bereichsleiterArea}>{person.area}</Text>
                  </View>
                  <Text style={styles.bereichsleiterName}>{person.name}</Text>
                  <TouchableOpacity onPress={() => sendEmail(person.email)}>
                    <Text style={styles.bereichsleiterEmail}>{person.email}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stellvertreter */}
        <View style={styles.section}>
          <View style={styles.stellvertreterGrid}>
            {stellvertreter.map((person, index) => (
              <View key={person.name} style={styles.stellvertreterCard}>
                <View style={[styles.avatar, { backgroundColor: index % 3 === 0 ? Colors.blue100 : index % 3 === 1 ? Colors.gold100 : Colors.purple100 }]}>
                  <Text style={[styles.avatarText, { color: index % 3 === 0 ? Colors.blue600 : index % 3 === 1 ? Colors.gold600 : Colors.purple500 }]}>
                    {getInitials(person.name)}
                  </Text>
                </View>
                <View style={styles.stellvertreterContent}>
                  <Text style={styles.stellvertreterName}>{person.name}</Text>
                  <Text style={styles.stellvertreterRole}>{person.role}</Text>
                  <TouchableOpacity onPress={() => sendEmail(person.email)}>
                    <Text style={styles.stellvertreterEmail}>{person.email}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Weitere Mitglieder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weitere Mitglieder</Text>
          <View style={styles.weitereMitgliederGrid}>
            {weitereMitglieder.map((person, index) => (
              <View key={person.name} style={styles.kleineMitgliederCard}>
                <View style={styles.kleineAvatar}>
                  <Text style={styles.kleineAvatarText}>{getInitials(person.name)}</Text>
                </View>
                <View style={styles.kleineMitgliederContent}>
                  <Text style={styles.kleineMitgliederName}>{person.name}</Text>
                  <Text style={styles.kleineMitgliederRole}>{person.role}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* "Und du?" CTA */}
        <View style={styles.undDuCard}>
          <View style={styles.undDuIcon}>
            <Ionicons name="person-add" size={32} color={Colors.gold600} />
          </View>
          <Text style={styles.undDuTitle}>{t('team.andYou')}</Text>
          <Text style={styles.undDuDesc}>{t('team.andYouDesc')}</Text>
          <TouchableOpacity
            style={styles.undDuButton}
            onPress={() => navigation.navigate('More', { screen: 'Contact' })}
          >
            <Text style={styles.undDuButtonText}>{t('team.joinNow')}</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Why Join Section */}
        <View style={styles.whyJoinSection}>
          <Text style={styles.whyJoinSubtitle}>{t('team.whyJoin')}</Text>
          <Text style={styles.whyJoinTitle}>{t('team.whyJoinTitle')}</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('More', { screen: 'Contact' })}
          >
            <Text style={styles.contactButtonText}>{t('team.contactBtn')}</Text>
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
    paddingBottom: 12,
  },
  // Vorsitzender
  vorsitzenderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue500,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  vorsitzenderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vorsitzenderInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  vorsitzenderContent: {
    flex: 1,
  },
  vorsitzenderRole: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold400,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  vorsitzenderName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vorsitzenderEmail: {
    fontSize: 13,
    color: Colors.blue100,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // Bereichsleiter
  bereichsleiterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bereichsleiterCard: {
    width: '48.5%',
    padding: 16,
    borderRadius: 16,
  },
  bereichsleiterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  bereichsleiterArea: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
  },
  bereichsleiterName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 2,
  },
  bereichsleiterEmail: {
    fontSize: 11,
    color: Colors.slate400,
  },
  // Stellvertreter
  stellvertreterGrid: {
    gap: 8,
  },
  stellvertreterCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.slate100,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stellvertreterContent: {
    flex: 1,
  },
  stellvertreterName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate900,
    marginBottom: 2,
  },
  stellvertreterRole: {
    fontSize: 12,
    color: Colors.slate500,
    marginBottom: 2,
  },
  stellvertreterEmail: {
    fontSize: 11,
    color: Colors.slate300,
  },
  // Weitere Mitglieder
  weitereMitgliederGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kleineMitgliederCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48.5%',
    backgroundColor: Colors.slate50,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.slate100,
    gap: 10,
  },
  kleineAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kleineAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate500,
  },
  kleineMitgliederContent: {
    flex: 1,
  },
  kleineMitgliederName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.slate700,
  },
  kleineMitgliederRole: {
    fontSize: 10,
    color: Colors.slate400,
  },
  // Und du?
  undDuCard: {
    backgroundColor: Colors.gold50,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gold200,
    alignItems: 'center',
  },
  undDuIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gold300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  undDuTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 8,
  },
  undDuDesc: {
    fontSize: 14,
    color: Colors.slate600,
    textAlign: 'center',
    marginBottom: 16,
  },
  undDuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold500,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 6,
  },
  undDuButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  // Why Join
  whyJoinSection: {
    backgroundColor: Colors.slate50,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
  },
  whyJoinSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  whyJoinTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 16,
    lineHeight: 26,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 6,
    alignSelf: 'flex-start',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
