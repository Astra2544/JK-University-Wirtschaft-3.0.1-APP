/**
 * MagazineScreen - Ceteris Paribus Magazin
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

export default function MagazineScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const contributeSteps = [
    { icon: 'person-outline', title: t('magazine.who'), desc: t('magazine.whoDesc') },
    { icon: 'document-text-outline', title: t('magazine.what'), desc: t('magazine.whatDesc') },
    { icon: 'send-outline', title: t('magazine.how'), desc: t('magazine.howDesc') },
  ];

  return (
    <View style={styles.container}>
      <Header title={t('magazine.title')} subtitle={t('magazine.section')} showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('magazine.about')}</Text>
          <Text style={styles.bodyText}>{t('magazine.aboutP1')}</Text>
        </View>

        {/* Magazine Preview */}
        <View style={styles.magazineCard}>
          <View style={styles.magazineIcon}>
            <Ionicons name="newspaper" size={48} color={Colors.blue500} />
          </View>
          <Text style={styles.magazineTitle}>Ceteris Paribus</Text>
          <Text style={styles.magazineSubtitle}>{t('magazine.desc')}</Text>
        </View>

        {/* Contribute Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('magazine.contribute')}</Text>
          <Text style={styles.bodyText}>{t('magazine.contributeSub')}</Text>

          {contributeSteps.map((step, index) => (
            <View key={index} style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon} size={24} color={Colors.blue500} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Files & Materials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('magazine.files')}</Text>
          <View style={styles.infoCard}>
            <Ionicons name="folder-outline" size={20} color={Colors.slate600} />
            <Text style={styles.infoText}>{t('magazine.filesDesc')}</Text>
          </View>
        </View>

        {/* Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('magazine.rights')}</Text>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.slate600} />
            <Text style={styles.infoText}>{t('magazine.rightsDesc')}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => Linking.openURL('mailto:wirtschaft@oeh.jku.at?subject=Artikel für Ceteris Paribus')}
        >
          <Text style={styles.submitButtonText}>{t('magazine.submitBtn')}</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    color: Colors.slate600,
    lineHeight: 24,
  },
  magazineCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.blue100,
  },
  magazineIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: Colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  magazineTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 8,
  },
  magazineSubtitle: {
    fontSize: 15,
    color: Colors.slate500,
    textAlign: 'center',
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.slate900,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.slate600,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.slate600,
    lineHeight: 20,
    marginLeft: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginRight: 8,
  },
});
