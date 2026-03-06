/**
 * StudiumScreen - Studiengänge & Updates
 * 1:1 Kopie der Website Studium-Seite
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

interface Category {
  id: number;
  display_name: string;
}

interface UpdateGroup {
  name: string;
  items: { title: string; description: string; date: string }[];
}

export default function StudiumScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [updates, setUpdates] = useState<UpdateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesData, updatesData] = await Promise.all([
        apiFetch<Category[]>(ENDPOINTS.STUDY_CATEGORIES),
        apiFetch<UpdateGroup[]>(ENDPOINTS.STUDY_UPDATES).catch(() => []),
      ]);
      setCategories(categoriesData);
      setUpdates(updatesData);
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

  const categoryColors = ['blue', 'gold', 'blue', 'gold'];

  return (
    <View style={styles.container}>
      <Header title={t('studium.title')} subtitle={t('studium.section')} showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue500]} />
        }
      >
        {/* Description */}
        <Text style={styles.description}>{t('studium.desc')}</Text>

        {/* Studienplaner CTA */}
        <TouchableOpacity
          style={styles.plannerCard}
          onPress={() => navigation.navigate('Studienplaner')}
        >
          <View style={styles.plannerIcon}>
            <Ionicons name="map-outline" size={24} color={Colors.blue500} />
          </View>
          <View style={styles.plannerContent}>
            <Text style={styles.plannerTitle}>{t('studium.planner')}</Text>
            <Text style={styles.plannerDesc}>{t('studium.plannerDesc')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.blue500} />
        </TouchableOpacity>

        {/* Categories */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Studiengänge</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat, index) => {
                const color = categoryColors[index % categoryColors.length];
                return (
                  <View
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      { borderColor: color === 'blue' ? Colors.blue100 : Colors.gold100 },
                    ]}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: color === 'blue' ? Colors.blue50 : Colors.gold50 },
                      ]}
                    >
                      <Ionicons
                        name="school"
                        size={24}
                        color={color === 'blue' ? Colors.blue500 : Colors.gold500}
                      />
                    </View>
                    <Text style={styles.categoryName}>{cat.display_name}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Updates */}
        {updates.length > 0 && (
          <View style={styles.updatesSection}>
            <Text style={styles.sectionTitle}>{t('studium.updatesTitle')}</Text>
            <Text style={styles.sectionSubtitle}>{t('studium.updatesSub')}</Text>
            
            {updates.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.updateGroup}>
                <Text style={styles.updateGroupTitle}>{group.name}</Text>
                {group.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.updateItem}>
                    <View style={styles.updateDot} />
                    <View style={styles.updateContent}>
                      <Text style={styles.updateTitle}>{item.title}</Text>
                      <Text style={styles.updateDesc}>{item.description}</Text>
                      <Text style={styles.updateDate}>{item.date}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {updates.length === 0 && !loading && (
          <View style={styles.noUpdates}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.slate300} />
            <Text style={styles.noUpdatesText}>{t('studium.noUpdates')}</Text>
          </View>
        )}
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
  plannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue50,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.blue100,
  },
  plannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  plannerContent: {
    flex: 1,
  },
  plannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 2,
  },
  plannerDesc: {
    fontSize: 13,
    color: Colors.slate500,
  },
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.slate500,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
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
  updatesSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: Colors.slate50,
    marginTop: 8,
  },
  updateGroup: {
    marginBottom: 20,
  },
  updateGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate800,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate200,
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate800,
    marginBottom: 2,
  },
  updateDesc: {
    fontSize: 13,
    color: Colors.slate500,
    marginBottom: 4,
  },
  updateDate: {
    fontSize: 11,
    color: Colors.slate400,
  },
  noUpdates: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.slate50,
    margin: 16,
    borderRadius: 16,
  },
  noUpdatesText: {
    fontSize: 14,
    color: Colors.slate500,
    marginTop: 12,
  },
});
