/**
 * HomeScreen - Startseite der ÖH Wirtschaft App
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

import { Colors } from '../constants/Colors';
import { apiFetch, ENDPOINTS } from '../constants/Api';
import SectionHeader from '../components/SectionHeader';
import { QuickLinkCard, StatCard, CtaCard } from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await apiFetch(ENDPOINTS.STUDY_CATEGORIES);
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openSocialLink = (url) => {
    Linking.openURL(url);
  };

  const quickLinks = [
    { icon: 'people-outline', title: t('home.cards.team.label'), subtitle: t('home.cards.team.sub'), accent: 'blue', screen: 'Team' },
    { icon: 'book-outline', title: t('home.cards.studium.label'), subtitle: t('home.cards.studium.sub'), accent: 'gold', screen: 'Studium' },
    { icon: 'chatbubble-outline', title: t('home.cards.kontakt.label'), subtitle: t('home.cards.kontakt.sub'), accent: 'blue', screen: 'Contact' },
    { icon: 'newspaper-outline', title: t('home.cards.magazine.label'), subtitle: t('home.cards.magazine.sub'), accent: 'gold', screen: 'Magazine' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue500]} />
      }
    >
      {/* Hero Section */}
      <View style={[styles.heroSection, { paddingTop: insets.top + 16 }]}>
        <View style={styles.heroContent}>
          <View style={styles.subtitleRow}>
            <View style={styles.subtitleDot} />
            <Text style={styles.subtitleText}>{t('home.subtitle')}</Text>
          </View>

          <Text style={styles.heroTitle}>
            {t('home.title')} <Text style={styles.heroHighlight}>{t('home.titleHighlight')}</Text>
          </Text>

          <Text style={styles.heroDescription}>{t('home.desc')}</Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={() => navigation.navigate('Team')}
            >
              <Text style={styles.ctaPrimaryText}>{t('home.ctaTeam')}</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => navigation.navigate('More', { screen: 'Contact' })}
            >
              <Text style={styles.ctaSecondaryText}>{t('home.ctaContact')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => openSocialLink('https://www.instagram.com/oeh_wirtschaft_wipaed/')}
            >
              <Ionicons name="logo-instagram" size={20} color={Colors.slate400} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => openSocialLink('http://linkedin.com/company/wirtschaft-wipaed')}
            >
              <Ionicons name="logo-linkedin" size={20} color={Colors.slate400} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialIcon}
              onPress={() => Linking.openURL('mailto:wirtschaft@oeh.jku.at')}
            >
              <Ionicons name="mail-outline" size={20} color={Colors.slate400} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quick Links Section */}
      <View style={styles.section}>
        <SectionHeader title={t('home.quickLinks')} />
        {quickLinks.map((link, index) => (
          <QuickLinkCard
            key={index}
            icon={link.icon}
            title={link.title}
            subtitle={link.subtitle}
            accent={link.accent}
            onPress={() => {
              if (link.screen === 'Team') {
                navigation.navigate('Team');
              } else {
                navigation.navigate('More', { screen: link.screen });
              }
            }}
          />
        ))}
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <SectionHeader section={t('home.about')} title={t('home.aboutTitle')} />
        <Text style={styles.bodyText}>{t('home.aboutP1')}</Text>
        <Text style={[styles.bodyText, { marginTop: 8 }]}>{t('home.aboutP2')}</Text>

        <View style={styles.statsGrid}>
          <StatCard value="3500+" label={t('home.stats.students')} accent="blue" />
          <StatCard value="30+" label={t('home.stats.members')} accent="gold" />
        </View>
        <View style={[styles.statsGrid, { marginTop: 8 }]}>
          <StatCard value="20+" label={t('home.stats.programs')} accent="blue" />
          <StatCard value="1" label={t('home.stats.mission')} accent="gold" />
        </View>
      </View>

      {/* LVA Banner */}
      <TouchableOpacity
        style={styles.lvaBanner}
        onPress={() => navigation.navigate('More', { screen: 'LVA' })}
      >
        <View style={styles.lvaBannerIcon}>
          <Ionicons name="trending-up" size={28} color={Colors.blue500} />
        </View>
        <View style={styles.lvaBannerContent}>
          <Text style={styles.lvaBannerTitle}>{t('home.lvaBanner')}</Text>
          <Text style={styles.lvaBannerSubtitle}>{t('home.lvaBannerSub')}</Text>
        </View>
        <View style={styles.lvaBannerButton}>
          <Text style={styles.lvaBannerButtonText}>{t('home.lvaBannerBtn')}</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.white} />
        </View>
      </TouchableOpacity>

      {/* Programs Section */}
      <View style={styles.section}>
        <SectionHeader section={t('home.programs')} title={t('home.programsTitle')} />
        <Text style={styles.bodyText}>{t('home.programsSub')}</Text>

        {loading ? (
          <LoadingSpinner size="small" />
        ) : (
          <View style={styles.categoriesGrid}>
            {categories.map((cat, index) => (
              <View
                key={cat.id || index}
                style={[
                  styles.categoryCard,
                  { borderColor: index % 2 === 0 ? Colors.blue100 : Colors.gold100 },
                ]}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: index % 2 === 0 ? Colors.blue50 : Colors.gold50 },
                  ]}
                >
                  <Ionicons
                    name="school"
                    size={24}
                    color={index % 2 === 0 ? Colors.blue500 : Colors.gold500}
                  />
                </View>
                <Text style={styles.categoryName}>{cat.display_name}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => navigation.navigate('More', { screen: 'Studium' })}
        >
          <Text style={styles.moreButtonText}>{t('home.programsMore')}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <CtaCard
          title={t('home.ctaTitle')}
          description={t('home.ctaDesc')}
          buttonText={t('home.ctaBtn')}
          onPress={() => navigation.navigate('More', { screen: 'Contact' })}
          variant="blue"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: Colors.white,
  },
  heroContent: {},
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtitleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold500,
    marginRight: 8,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.slate500,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.slate900,
    lineHeight: 38,
    marginBottom: 12,
  },
  heroHighlight: {
    color: Colors.blue500,
  },
  heroDescription: {
    fontSize: 15,
    color: Colors.slate500,
    lineHeight: 24,
    marginBottom: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginRight: 8,
  },
  ctaPrimaryText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
  ctaSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.slate200,
  },
  ctaSecondaryText: {
    color: Colors.slate700,
    fontWeight: '600',
    fontSize: 14,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialIcon: {
    padding: 8,
    marginRight: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: Colors.slate50,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.slate500,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 16,
  },
  lvaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  lvaBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lvaBannerContent: {
    flex: 1,
  },
  lvaBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 2,
  },
  lvaBannerSubtitle: {
    fontSize: 12,
    color: Colors.slate500,
  },
  lvaBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  lvaBannerButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginRight: '2%',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate900,
    textAlign: 'center',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 16,
    alignSelf: 'center',
  },
  moreButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  ctaSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
});
