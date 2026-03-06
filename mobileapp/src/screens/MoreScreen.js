/**
 * MoreScreen - Navigation zu weiteren Seiten
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

function MenuItem({ icon, title, subtitle, onPress, accent = 'blue' }) {
  const accentColors = {
    blue: { bg: Colors.blue50, icon: Colors.blue500 },
    gold: { bg: Colors.gold50, icon: Colors.gold500 },
    green: { bg: '#ECFDF5', icon: '#10B981' },
    purple: { bg: '#F3E8FF', icon: '#9333EA' },
  };
  const colors = accentColors[accent] || accentColors.blue;

  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: colors.bg }]}>
        <Ionicons name={icon} size={22} color={colors.icon} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.slate300} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(nextLang);
  };

  const menuItems = [
    { icon: 'chatbubble-outline', title: t('more.contact'), subtitle: t('more.contactSub'), screen: 'Contact', accent: 'blue' },
    { icon: 'book-outline', title: t('more.studium'), subtitle: t('more.studiumSub'), screen: 'Studium', accent: 'gold' },
    { icon: 'trending-up', title: t('more.lva'), subtitle: t('more.lvaSub'), screen: 'LVA', accent: 'green' },
    { icon: 'newspaper-outline', title: t('more.magazine'), subtitle: t('more.magazineSub'), screen: 'Magazine', accent: 'purple' },
    { icon: 'calendar-outline', title: t('more.studienplaner'), subtitle: t('more.studienplanerSub'), screen: 'Studienplaner', accent: 'blue' },
  ];

  const legalItems = [
    { icon: 'document-text-outline', title: t('more.impressum'), screen: 'Impressum' },
    { icon: 'shield-checkmark-outline', title: t('more.datenschutz'), screen: 'Datenschutz' },
  ];

  return (
    <View style={styles.container}>
      <Header title={t('more.title')} subtitle={t('more.section')} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('more.services')}</Text>
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              accent={item.accent}
              onPress={() => navigation.navigate(item.screen)}
            />
          ))}
        </View>

        {/* External Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('more.external')}</Text>
          <MenuItem
            icon="globe-outline"
            title="ÖH JKU"
            subtitle="oeh.jku.at/wirtschaft"
            accent="blue"
            onPress={() => Linking.openURL('https://oeh.jku.at/wirtschaft')}
          />
          <MenuItem
            icon="logo-instagram"
            title="Instagram"
            subtitle="@oeh_wirtschaft_wipaed"
            accent="purple"
            onPress={() => Linking.openURL('https://www.instagram.com/oeh_wirtschaft_wipaed/')}
          />
          <MenuItem
            icon="logo-linkedin"
            title="LinkedIn"
            subtitle="wirtschaft-wipaed"
            accent="blue"
            onPress={() => Linking.openURL('http://linkedin.com/company/wirtschaft-wipaed')}
          />
        </View>

        {/* Language Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('more.settings')}</Text>
          <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
            <View style={styles.languageIcon}>
              <Ionicons name="language" size={22} color={Colors.blue500} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{t('more.language')}</Text>
              <Text style={styles.menuSubtitle}>
                {i18n.language === 'de' ? 'Deutsch' : 'English'}
              </Text>
            </View>
            <View style={styles.languageBadge}>
              <Text style={styles.languageBadgeText}>{i18n.language.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('more.legal')}</Text>
          {legalItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              title={item.title}
              accent="blue"
              onPress={() => navigation.navigate(item.screen)}
            />
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>ÖH Wirtschaft</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
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
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.slate900,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 2,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  languageIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  languageBadge: {
    backgroundColor: Colors.blue500,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.slate700,
  },
  appVersion: {
    fontSize: 13,
    color: Colors.slate400,
    marginTop: 4,
  },
});
