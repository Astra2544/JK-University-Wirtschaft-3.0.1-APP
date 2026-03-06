/**
 * MagazineScreen - Ceteris Paribus
 * 1:1 Kopie der Website Magazine-Seite
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

export default function MagazineScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const openSubmitForm = () => {
    navigation.navigate('Contact');
  };

  return (
    <View style={styles.container}>
      <Header title={t('magazine.title')} subtitle={t('magazine.section')} showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Description */}
        <Text style={styles.description}>{t('magazine.desc')}</Text>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.purple50 }]}>
              <Ionicons name="newspaper" size={24} color={Colors.purple500} />
            </View>
            <Text style={styles.sectionTitle}>{t('magazine.about')}</Text>
          </View>
          <Text style={styles.sectionText}>{t('magazine.aboutP1')}</Text>
        </View>

        {/* How to Contribute */}
        <View style={styles.contributeSection}>
          <Text style={styles.contributeTitle}>{t('magazine.contribute')}</Text>
          <Text style={styles.contributeSubtitle}>{t('magazine.contributeSub')}</Text>

          <View style={styles.contributeGrid}>
            <View style={styles.contributeCard}>
              <View style={[styles.contributeIcon, { backgroundColor: Colors.blue50 }]}>
                <Ionicons name="people" size={20} color={Colors.blue500} />
              </View>
              <Text style={styles.contributeCardTitle}>{t('magazine.who')}</Text>
              <Text style={styles.contributeCardDesc}>{t('magazine.whoDesc')}</Text>
            </View>

            <View style={styles.contributeCard}>
              <View style={[styles.contributeIcon, { backgroundColor: Colors.gold50 }]}>
                <Ionicons name="document-text" size={20} color={Colors.gold500} />
              </View>
              <Text style={styles.contributeCardTitle}>{t('magazine.what')}</Text>
              <Text style={styles.contributeCardDesc}>{t('magazine.whatDesc')}</Text>
            </View>

            <View style={styles.contributeCard}>
              <View style={[styles.contributeIcon, { backgroundColor: Colors.green50 }]}>
                <Ionicons name="send" size={20} color={Colors.green500} />
              </View>
              <Text style={styles.contributeCardTitle}>{t('magazine.how')}</Text>
              <Text style={styles.contributeCardDesc}>{t('magazine.howDesc')}</Text>
            </View>
          </View>
        </View>

        {/* Files & Materials */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.blue50 }]}>
              <Ionicons name="folder-open" size={24} color={Colors.blue500} />
            </View>
            <Text style={styles.sectionTitle}>{t('magazine.files')}</Text>
          </View>
          <Text style={styles.sectionText}>{t('magazine.filesDesc')}</Text>
        </View>

        {/* Rights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: Colors.slate100 }]}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.slate600} />
            </View>
            <Text style={styles.sectionTitle}>{t('magazine.rights')}</Text>
          </View>
          <Text style={styles.sectionText}>{t('magazine.rightsDesc')}</Text>
        </View>

        {/* Submit CTA */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.submitButton} onPress={openSubmitForm}>
            <Ionicons name="create-outline" size={20} color={Colors.white} />
            <Text style={styles.submitButtonText}>{t('magazine.submitBtn')}</Text>
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
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.slate900,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.slate600,
    lineHeight: 20,
  },
  contributeSection: {
    backgroundColor: Colors.purple50,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.purple100,
  },
  contributeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 4,
  },
  contributeSubtitle: {
    fontSize: 14,
    color: Colors.slate600,
    marginBottom: 16,
  },
  contributeGrid: {
    gap: 12,
  },
  contributeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
  },
  contributeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contributeCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate800,
    marginBottom: 4,
  },
  contributeCardDesc: {
    fontSize: 13,
    color: Colors.slate500,
    lineHeight: 18,
  },
  ctaSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.purple500,
    paddingVertical: 16,
    borderRadius: 24,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
