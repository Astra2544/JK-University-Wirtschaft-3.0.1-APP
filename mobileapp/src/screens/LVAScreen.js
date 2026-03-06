/**
 * LVAScreen - LVA-Suche & Bewertungen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';
import { apiFetch, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

function RatingStars({ rating }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Ionicons key={i} name="star" size={14} color={Colors.gold500} />);
    } else if (i === fullStars && hasHalf) {
      stars.push(<Ionicons key={i} name="star-half" size={14} color={Colors.gold500} />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={14} color={Colors.slate300} />);
    }
  }

  return <View style={styles.starsContainer}>{stars}</View>;
}

function LVACard({ lva, type }) {
  const isTop = type === 'best';
  
  return (
    <View style={[styles.lvaCard, isTop && styles.lvaCardTop]}>
      <View style={styles.lvaHeader}>
        <Text style={styles.lvaName} numberOfLines={2}>{lva.name}</Text>
        {lva.professor && (
          <Text style={styles.lvaProfessor}>{lva.professor}</Text>
        )}
      </View>
      
      <View style={styles.lvaStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{type === 'best' ? 'Bewertung' : 'Schwierigkeit'}</Text>
          <View style={styles.statValue}>
            <RatingStars rating={type === 'best' ? lva.avg_rating : lva.avg_difficulty} />
            <Text style={styles.statNumber}>
              {(type === 'best' ? lva.avg_rating : lva.avg_difficulty)?.toFixed(1) || '-'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Aufwand</Text>
          <Text style={[styles.statNumber, { color: Colors.slate600 }]}>
            {lva.avg_effort?.toFixed(1) || '-'}/5
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Bewertungen</Text>
          <Text style={[styles.statNumber, { color: Colors.slate600 }]}>
            {lva.rating_count || 0}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function LVAScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topLVAs, setTopLVAs] = useState({ best: [], hardest: [] });
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTopLVAs();
  }, []);

  const fetchTopLVAs = async () => {
    try {
      const data = await apiFetch(ENDPOINTS.LVAS_TOP);
      setTopLVAs(data || { best: [], hardest: [] });
    } catch (err) {
      console.error('Error fetching top LVAs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopLVAs();
  };

  const searchLVAs = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const data = await apiFetch(`${ENDPOINTS.LVAS}?search=${encodeURIComponent(query)}`);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error searching LVAs:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchLVAs(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <Header title={t('lva.title')} subtitle={t('lva.section')} showBack />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.slate400} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('lva.searchPlaceholder')}
            placeholderTextColor={Colors.slate400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.slate400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
          {/* Search Results */}
          {searchQuery.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('lva.results')} ({searchResults.length})
              </Text>
              {searching ? (
                <LoadingSpinner size="small" />
              ) : searchResults.length === 0 ? (
                <EmptyState icon="search-outline" title={t('lva.noResults')} />
              ) : (
                searchResults.map((lva) => (
                  <LVACard key={lva.id} lva={lva} type="search" />
                ))
              )}
            </View>
          ) : (
            <>
              {/* Top 5 Best */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={20} color={Colors.gold500} />
                  <Text style={styles.sectionTitle}>{t('lva.topBest')}</Text>
                </View>
                {topLVAs.best?.slice(0, 5).map((lva, index) => (
                  <View key={lva.id || index} style={styles.rankContainer}>
                    <View style={[styles.rankBadge, index < 3 && styles.rankBadgeTop]}>
                      <Text style={[styles.rankText, index < 3 && styles.rankTextTop]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.rankCard}>
                      <LVACard lva={lva} type="best" />
                    </View>
                  </View>
                ))}
              </View>

              {/* Top 5 Hardest */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="fitness" size={20} color={Colors.red500} />
                  <Text style={styles.sectionTitle}>{t('lva.topHardest')}</Text>
                </View>
                {topLVAs.hardest?.slice(0, 5).map((lva, index) => (
                  <View key={lva.id || index} style={styles.rankContainer}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.rankCard}>
                      <LVACard lva={lva} type="hardest" />
                    </View>
                  </View>
                ))}
              </View>
            </>
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
  searchContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.slate900,
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    marginLeft: 8,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.slate200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 16,
  },
  rankBadgeTop: {
    backgroundColor: Colors.gold500,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate600,
  },
  rankTextTop: {
    color: Colors.white,
  },
  rankCard: {
    flex: 1,
  },
  lvaCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  lvaCardTop: {
    borderColor: Colors.gold100,
  },
  lvaHeader: {
    marginBottom: 12,
  },
  lvaName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.slate900,
  },
  lvaProfessor: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 4,
  },
  lvaStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.slate500,
    marginBottom: 4,
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold600,
  },
});
