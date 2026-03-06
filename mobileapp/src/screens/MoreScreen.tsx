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

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  accent?: 'blue' | 'gold' | 'green' | 'purple';
}

function MenuItem({ icon, title, subtitle, onPress, accent = 'blue' }: MenuItemProps) {
  const accentColors = {
    blue: { bg: Colors.blue50, icon: Colors.blue500 },
    gold: { bg: Colors.gold50, icon: Colors.gold500 },
    green: { bg: Colors.green50, icon: Colors.green500 },
    purple: { bg: Colors.purple50, icon: Colors.purple500 },
  };
  const colors = accentColors[accent];

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
  const navigation = useNavigation<any>();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(nextLang);
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Header title={t('nav.mehr')} subtitle="Navigation" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Pages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seiten</Text>
          
          <MenuItem
            icon="chatbubble-outline"
            title={t('nav.kontakt')}
            subtitle="Sprechstunden, FAQ, Kontaktformular"
            onPress={() => navigation.navigate('Contact')}
            accent="blue"
          />
          <MenuItem
            icon="school-outline"
            title={t('nav.studium')}
            subtitle="Studiengänge & Updates"
            onPress={() => navigation.navigate('Studium')}
            accent="gold"
          />
          <MenuItem
            icon="trending-up-outline"
            title={t('nav.lva')}
            subtitle="LVA-Suche & Bewertungen"
            onPress={() => navigation.navigate('LVA')}
            accent="blue"
          />
          <MenuItem
            icon="map-outline"
            title={t('nav.studienplaner')}
            subtitle="Studienplaner für alle Studiengänge"
            onPress={() => navigation.navigate('Studienplaner')}
            accent="gold"
          />
          <MenuItem
            icon="newspaper-outline"
            title={t('nav.magazine')}
            subtitle="Ceteris Paribus Zeitschrift"
            onPress={() => navigation.navigate('Magazine')}
            accent="purple"
          />
        </View>

        {/* External Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Externe Links</Text>
          
          <MenuItem
            icon="logo-instagram"
            title="Instagram"
            subtitle="@oeh_wirtschaft_wipaed"
            onPress={() => openExternalLink('https://www.instagram.com/oeh_wirtschaft_wipaed/')}
            accent="purple"
          />
          <MenuItem
            icon="logo-linkedin"
            title="LinkedIn"
            subtitle="ÖH Wirtschaft"
            onPress={() => openExternalLink('http://linkedin.com/company/wirtschaft-wipaed')}
            accent="blue"
          />
          <MenuItem
            icon="globe-outline"
            title="ÖH JKU"
            subtitle="Hauptseite der ÖH"
            onPress={() => openExternalLink('https://oeh.jku.at')}
            accent="gold"
          />
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rechtliches</Text>
          
          <MenuItem
            icon="document-text-outline"
            title="Impressum"
            onPress={() => navigation.navigate('Impressum')}
            accent="blue"
          />
          <MenuItem
            icon="shield-checkmark-outline"
            title="Datenschutz"
            onPress={() => navigation.navigate('Datenschutz')}
            accent="blue"
          />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Einstellungen</Text>
          
          <TouchableOpacity style={styles.languageSwitch} onPress={toggleLanguage}>
            <View style={[styles.menuIcon, { backgroundColor: Colors.blue50 }]}>
              <Ionicons name="language-outline" size={22} color={Colors.blue500} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Sprache / Language</Text>
              <Text style={styles.menuSubtitle}>
                {i18n.language === 'de' ? 'Deutsch' : 'English'}
              </Text>
            </View>
            <View style={styles.langToggle}>
              <Text style={[styles.langOption, i18n.language === 'de' && styles.langOptionActive]}>DE</Text>
              <Text style={[styles.langOption, i18n.language === 'en' && styles.langOptionActive]}>EN</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>ÖH Wirtschaft</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2025 ÖH JKU Linz</Text>
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
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
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
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.slate900,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.slate400,
  },
  languageSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  langToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.slate100,
    borderRadius: 20,
    padding: 4,
  },
  langOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate500,
    borderRadius: 16,
  },
  langOptionActive: {
    backgroundColor: Colors.blue500,
    color: Colors.white,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    color: Colors.slate400,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: Colors.slate300,
  },
});
