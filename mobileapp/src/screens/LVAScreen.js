/**
 * LVAScreen - LVA-Suche & Bewertungen
 * 1:1 Kopie der Website LVA-Seite
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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';
import { apiFetch, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

interface LVA {
  id;
  name;
  professor?;
  avg_effort;
  avg_difficulty;
  avg_rating;
  rating_count;
}

interface TopLVAs {
  best: LVA[];
  hardest: LVA[];
}

export default function LVAScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LVA[]>([]);
  const [topLVAs, setTopLVAs] = useState<TopLVAs>({ best: [], hardest: [] });
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLVA, setSelectedLVA] = useState<LVA | null>(null);

  useEffect(() => {
    fetchTopLVAs();
  }, []);

  const fetchTopLVAs = async () => {
    try {
      const data = await apiFetch<TopLVAs>(ENDPOINTS.LVAS_TOP);
      setTopLVAs(data);
    } catch (err) {
      console.error('Error fetching top LVAs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchLVAs = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const data = await apiFetch<LVA[]>(`${ENDPOINTS.LVAS}?search=${encodeURIComponent(query)}`);
      setSearchResults(data);
    } catch (err) {
      console.error('Error searching LVAs:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopLVAs();
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    searchLVAs(text);
  };

  const renderRating = (value, label) => (
    <View style={styles.ratingItem}>
      <Text style={styles.ratingValue}>{value.toFixed(1)}</Text>
      <Text style={styles.ratingLabel}>{label}</Text>
    </View>
  );

  const LVACard = ({ lva }: { lva: LVA }) => (
    <TouchableOpacity
      style={styles.lvaCard}
      onPress={() => setSelectedLVA(lva)}
    >
      <View style={styles.lvaHeader}>
        <Text style={styles.lvaName} numberOfLines={2}>{lva.name}</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeText}>{lva.avg_rating.toFixed(1)}</Text>
        </View>
      </View>
      {lva.professor && (
        <Text style={styles.lvaProfessor}>{lva.professor}</Text>
      )}
      <View style={styles.lvaRatings}>
        {renderRating(lva.avg_effort, t('lva.aufwand'))}
        {renderRating(lva.avg_difficulty, t('lva.schwierigkeit'))}
      </View>
      <Text style={styles.lvaRatingCount}>
        {t(lva.rating_count === 1 ? 'lva.ratingCount_one' : 'lva.ratingCount_other', { count: lva.rating_count })}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title={t('lva.title')} subtitle={t('lva.section')} showBack />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue500]} />
        }
      >
        {/* Description */}
        <Text style={styles.description}>{t('lva.desc')}</Text>

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={styles.howItWorksTitle}>{t('lva.howItWorks')}</Text>
          <View style={styles.howStep}>
            <Ionicons name="mail-outline" size={16} color={Colors.blue500} />
            <Text style={styles.howStepText}>{t('lva.howStep1')}</Text>
          </View>
          <View style={styles.howStep}>
            <Ionicons name="star-outline" size={16} color={Colors.blue500} />
            <Text style={styles.howStepText}>{t('lva.howStep2')}</Text>
          </View>
          <View style={styles.howStep}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.blue500} />
            <Text style={styles.howStepText}>{t('lva.howStep3')}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color={Colors.slate400} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder={t('lva.searchPh')}
              placeholderTextColor={Colors.slate400}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={20} color={Colors.slate400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suchergebnisse ({searchResults.length})</Text>
            {searching ? (
              <LoadingSpinner size="small" />
            ) : searchResults.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>{t('lva.noResults')}</Text>
              </View>
            ) : (
              searchResults.map((lva) => <LVACard key={lva.id} lva={lva} />)
            )}
          </View>
        )}

        {/* Top LVAs */}
        {searchQuery.length < 2 && !loading && (
          <>
            {/* Top Best */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: Colors.green50 }]}>
                  <Ionicons name="trophy" size={20} color={Colors.green500} />
                </View>
                <Text style={styles.sectionTitle}>{t('lva.topBest')}</Text>
              </View>
              {topLVAs.best.length === 0 ? (
                <Text style={styles.noDataText}>{t('lva.noRatings')}</Text>
              ) : (
                topLVAs.best.map((lva) => <LVACard key={lva.id} lva={lva} />)
              )}
            </View>

            {/* Top Hardest */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIcon, { backgroundColor: Colors.red50 }]}>
                  <Ionicons name="flame" size={20} color={Colors.red500} />
                </View>
                <Text style={styles.sectionTitle}>{t('lva.topHardest')}</Text>
              </View>
              {topLVAs.hardest.length === 0 ? (
                <Text style={styles.noDataText}>{t('lva.noRatings')}</Text>
              ) : (
                topLVAs.hardest.map((lva) => <LVACard key={lva.id} lva={lva} />)
              )}
            </View>
          </>
        )}

        {loading && <LoadingSpinner />}
      </ScrollView>

      {/* LVA Detail Modal */}
      <Modal
        visible={!!selectedLVA}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedLVA(null)}
      >
        {selectedLVA && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedLVA.name}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedLVA(null)}>
                <Ionicons name="close" size={24} color={Colors.slate700} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedLVA.professor && (
                <Text style={styles.modalProfessor}>{selectedLVA.professor}</Text>
              )}

              <View style={styles.modalRatings}>
                <View style={styles.modalRatingCard}>
                  <Text style={styles.modalRatingLabel}>{t('lva.gesamt')}</Text>
                  <Text style={styles.modalRatingValue}>{selectedLVA.avg_rating.toFixed(1)}</Text>
                </View>
                <View style={styles.modalRatingCard}>
                  <Text style={styles.modalRatingLabel}>{t('lva.aufwand')}</Text>
                  <Text style={styles.modalRatingValue}>{selectedLVA.avg_effort.toFixed(1)}</Text>
                </View>
                <View style={styles.modalRatingCard}>
                  <Text style={styles.modalRatingLabel}>{t('lva.schwierigkeit')}</Text>
                  <Text style={styles.modalRatingValue}>{selectedLVA.avg_difficulty.toFixed(1)}</Text>
                </View>
              </View>

              <Text style={styles.modalRatingCount}>
                {t(selectedLVA.rating_count === 1 ? 'lva.ratingCount_one' : 'lva.ratingCount_other', { count: selectedLVA.rating_count })}
              </Text>

              <TouchableOpacity style={styles.rateButton}>
                <Ionicons name="star" size={18} color={Colors.white} />
                <Text style={styles.rateButtonText}>{t('lva.rate')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
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
  howItWorks: {
    backgroundColor: Colors.blue50,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.blue100,
  },
  howItWorksTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate800,
    marginBottom: 12,
  },
  howStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  howStepText: {
    flex: 1,
    fontSize: 13,
    color: Colors.slate600,
    lineHeight: 18,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate50,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.slate900,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.slate700,
  },
  lvaCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  lvaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  lvaName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.slate900,
    paddingRight: 10,
  },
  ratingBadge: {
    backgroundColor: Colors.blue500,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  lvaProfessor: {
    fontSize: 13,
    color: Colors.slate500,
    marginBottom: 8,
  },
  lvaRatings: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  ratingItem: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.slate800,
  },
  ratingLabel: {
    fontSize: 11,
    color: Colors.slate400,
  },
  lvaRatingCount: {
    fontSize: 12,
    color: Colors.slate400,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.slate500,
  },
  noDataText: {
    fontSize: 13,
    color: Colors.slate400,
    fontStyle: 'italic',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.slate900,
    paddingRight: 16,
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalProfessor: {
    fontSize: 15,
    color: Colors.slate500,
    marginBottom: 20,
  },
  modalRatings: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modalRatingCard: {
    flex: 1,
    backgroundColor: Colors.slate50,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalRatingLabel: {
    fontSize: 11,
    color: Colors.slate500,
    marginBottom: 4,
  },
  modalRatingValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.slate900,
  },
  modalRatingCount: {
    fontSize: 14,
    color: Colors.slate500,
    marginBottom: 24,
    textAlign: 'center',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  rateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
