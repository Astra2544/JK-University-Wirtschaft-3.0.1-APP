/**
 * StudiumScreen - Studiengänge & Updates
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';
import { apiFetch, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StudiumScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesData, updatesData] = await Promise.all([
        apiFetch(ENDPOINTS.STUDY_CATEGORIES),
        apiFetch(ENDPOINTS.STUDY_UPDATES).catch(() => []),
      ]);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setUpdates(Array.isArray(updatesData) ? updatesData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={styles.container}>
      <Header title={t('studium.title')} subtitle={t('studium.section')} showBack />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue500]} />
          }
        >
          {/* Intro */}
          <Text style={styles.introText}>{t('studium.intro')}</Text>

          {/* Studienplaner CTA */}
          <TouchableOpacity
            style={styles.ctaBanner}
            onPress={() => navigation.navigate('Studienplaner')}
          >
            <View style={styles.ctaIcon}>
              <Ionicons name="calendar" size={28} color={Colors.blue500} />
            </View>
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>{t('studium.planerTitle')}</Text>
              <Text style={styles.ctaSubtitle}>{t('studium.planerSub')}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.blue500} />
          </TouchableOpacity>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('studium.programs')}</Text>
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
          </View>

          {/* Updates */}
          {updates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('studium.updates')}</Text>
              {updates.map((group, groupIndex) => (
                <View key={groupIndex} style={styles.updateGroup}>
                  <Text style={styles.updateGroupName}>{group.name}</Text>
                  {group.items?.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.updateItem}>
                      <View style={styles.updateDot} />
                      <View style={styles.updateContent}>
                        <Text style={styles.updateTitle}>{item.title}</Text>
                        {item.description && (
                          <Text style={styles.updateDesc}>{item.description}</Text>
                        )}
                        {item.date && (
                          <Text style={styles.updateDate}>{item.date}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
    marginBottom: 20,
  },
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.blue100,
  },
  ctaIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  updateGroup: {
    marginBottom: 16,
  },
  updateGroupName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.blue500,
    marginBottom: 12,
  },
  updateItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.blue500,
    marginTop: 6,
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.slate900,
  },
  updateDesc: {
    fontSize: 14,
    color: Colors.slate600,
    marginTop: 4,
    lineHeight: 20,
  },
  updateDate: {
    fontSize: 12,
    color: Colors.slate400,
    marginTop: 4,
  },
});
