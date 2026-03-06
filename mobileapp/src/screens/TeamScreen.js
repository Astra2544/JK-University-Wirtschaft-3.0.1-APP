/**
 * TeamScreen - Team Mitglieder
 */

import React, { useState } from 'react';
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

import { Colors } from '../constants/Colors';
import Header from '../components/Header';
import { CtaCard } from '../components/Card';

const vorsitzender = {
  name: 'Maximilian Pilsner',
  email: 'maximilian.pilsner@oeh.jku.at',
  role: 'Vorsitzender',
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

const colorStyles = {
  purple: { bg: '#F3E8FF', text: '#9333EA', badge: '#9333EA' },
  blue: { bg: Colors.blue50, text: Colors.blue500, badge: Colors.blue500 },
  gold: { bg: Colors.gold50, text: Colors.gold500, badge: Colors.gold500 },
  pink: { bg: '#FCE7F3', text: '#EC4899', badge: '#EC4899' },
};

function getInitials(name) {
  return name.split(' ').map((n) => n[0]).join('');
}

export default function TeamScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const sendEmail = (email) => {
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
        {/* Vorsitzender */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('team.vorsitz')}</Text>
          <View style={styles.vorsitzCard}>
            <View style={styles.vorsitzAvatar}>
              <Text style={styles.vorsitzInitials}>{getInitials(vorsitzender.name)}</Text>
            </View>
            <View style={styles.vorsitzInfo}>
              <Text style={styles.vorsitzName}>{vorsitzender.name}</Text>
              <Text style={styles.vorsitzRole}>{vorsitzender.role}</Text>
              <TouchableOpacity
                style={styles.emailButton}
                onPress={() => sendEmail(vorsitzender.email)}
              >
                <Ionicons name="mail-outline" size={16} color={Colors.blue500} />
                <Text style={styles.emailText}>{t('team.email')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bereichsleiter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('team.bereichsleiter')}</Text>
          <View style={styles.bereichsGrid}>
            {bereichsleiter.map((member, index) => {
              const colors = colorStyles[member.color] || colorStyles.blue;
              return (
                <View key={index} style={[styles.bereichCard, { backgroundColor: colors.bg }]}>
                  <View style={[styles.bereichIcon, { backgroundColor: colors.badge }]}>
                    <Ionicons name={member.icon} size={20} color={Colors.white} />
                  </View>
                  <Text style={styles.bereichArea}>{member.area}</Text>
                  <Text style={styles.bereichName}>{member.name}</Text>
                  <TouchableOpacity onPress={() => sendEmail(member.email)}>
                    <Ionicons name="mail-outline" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stellvertreter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('team.stellvertreter')}</Text>
          {stellvertreter.map((member, index) => (
            <View key={index} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitials}>{getInitials(member.name)}</Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              <TouchableOpacity onPress={() => sendEmail(member.email)}>
                <Ionicons name="mail-outline" size={20} color={Colors.slate400} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Weitere Mitglieder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('team.weitere')}</Text>
          <View style={styles.weitereGrid}>
            {weitereMitglieder.map((member, index) => (
              <View key={index} style={styles.weitereCard}>
                <View style={styles.weitereAvatar}>
                  <Text style={styles.weitereInitials}>{getInitials(member.name)}</Text>
                </View>
                <Text style={styles.weitereName}>{member.name}</Text>
                <Text style={styles.weitereRole}>{member.role}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <CtaCard
            title={t('team.ctaTitle')}
            description={t('team.ctaDesc')}
            buttonText={t('team.ctaBtn')}
            onPress={() => navigation.navigate('More', { screen: 'Contact' })}
            variant="gold"
          />
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 16,
  },
  vorsitzCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.blue100,
  },
  vorsitzAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.blue500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vorsitzInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  vorsitzInfo: {
    flex: 1,
  },
  vorsitzName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 4,
  },
  vorsitzRole: {
    fontSize: 14,
    color: Colors.blue500,
    fontWeight: '600',
    marginBottom: 12,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  emailText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.blue500,
    marginLeft: 6,
  },
  bereichsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  bereichCard: {
    width: '48%',
    margin: '1%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  bereichIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  bereichArea: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bereichName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate900,
    textAlign: 'center',
    marginBottom: 12,
  },
  memberCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.slate200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate600,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.slate900,
  },
  memberRole: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 2,
  },
  weitereGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weitereCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: '2%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  weitereAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  weitereInitials: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate500,
  },
  weitereName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate900,
    textAlign: 'center',
  },
  weitereRole: {
    fontSize: 11,
    color: Colors.slate500,
    textAlign: 'center',
    marginTop: 2,
  },
  ctaSection: {
    padding: 16,
  },
});
