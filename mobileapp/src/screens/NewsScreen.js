/**
 * NewsScreen - News & Ankündigungen
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
import { Ionicons } from '@expo/vector-icons';

import { Colors, PriorityColors } from '../constants/Colors';
import { apiFetch, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const priorityIcons = {
  urgent: 'alert-circle',
  high: 'warning',
  medium: 'notifications',
  low: 'information-circle',
};

function formatDate(dateString, t) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('news.justNow');
  if (diffMins < 60) return t('news.minAgo', { count: diffMins });
  if (diffHours < 24) return t('news.hoursAgo', { count: diffHours });
  if (diffDays < 7) return t('news.daysAgo', { count: diffDays });

  return date.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function NewsCard({ item, t }) {
  const [expanded, setExpanded] = useState(false);
  const priorityConfig = PriorityColors[item.priority] || PriorityColors.medium;
  const priorityIcon = priorityIcons[item.priority] || priorityIcons.medium;

  const priorityLabels = {
    urgent: t('news.urgent'),
    high: t('news.important'),
    medium: t('news.normal'),
    low: t('news.info'),
  };

  return (
    <View style={[styles.newsCard, item.is_pinned && styles.pinnedCard]}>
      <View style={[styles.accentBar, { backgroundColor: priorityConfig.text }]} />

      <View style={styles.cardHeader}>
        <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bg }]}>
          <Ionicons name={priorityIcon} size={14} color={priorityConfig.text} />
          <Text style={[styles.priorityText, { color: priorityConfig.text }]}>
            {priorityLabels[item.priority]}
          </Text>
        </View>
        {item.is_pinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={12} color={Colors.gold500} />
            <Text style={styles.pinnedText}>{t('news.pinned')}</Text>
          </View>
        )}
      </View>

      <Text style={styles.newsTitle}>{item.title}</Text>
      
      <TouchableOpacity onPress={() => setExpanded(!expanded)}>
        <Text style={styles.newsContent} numberOfLines={expanded ? undefined : 3}>
          {item.content || item.excerpt}
        </Text>
        <Text style={styles.readMore}>
          {expanded ? t('news.readLess') : t('news.readMore')}
        </Text>
      </TouchableOpacity>

      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          {formatDate(item.published_at || item.created_at, t)}
        </Text>
        {item.author_name && (
          <Text style={styles.footerText}> • {item.author_name}</Text>
        )}
        {item.views > 0 && (
          <Text style={styles.footerText}> • {item.views} {t('news.views')}</Text>
        )}
      </View>
    </View>
  );
}

export default function NewsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await apiFetch(ENDPOINTS.NEWS);
      setNews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setNews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  const filters = [
    { key: 'all', label: t('news.filters.all') },
    { key: 'urgent', label: t('news.filters.urgent') },
    { key: 'high', label: t('news.filters.important') },
    { key: 'medium', label: t('news.filters.normal') },
    { key: 'low', label: t('news.filters.info') },
  ];

  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(item => item.priority === filter);

  const pinnedNews = filteredNews.filter(item => item.is_pinned);
  const regularNews = filteredNews.filter(item => !item.is_pinned);

  return (
    <View style={styles.container}>
      <Header title={t('news.title')} subtitle={t('news.section')} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <LoadingSpinner />
      ) : filteredNews.length === 0 ? (
        <EmptyState icon="newspaper-outline" title={t('news.empty')} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue500]} />
          }
        >
          {pinnedNews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('news.pinnedSection')}</Text>
              {pinnedNews.map((item) => (
                <NewsCard key={item.id} item={item} t={t} />
              ))}
            </View>
          )}

          {regularNews.length > 0 && (
            <View style={styles.section}>
              {pinnedNews.length > 0 && (
                <Text style={styles.sectionTitle}>{t('news.latestSection')}</Text>
              )}
              {regularNews.map((item) => (
                <NewsCard key={item.id} item={item} t={t} />
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
  filterScroll: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  filterContainer: {
    padding: 12,
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.slate100,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.blue500,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate600,
  },
  filterTextActive: {
    color: Colors.white,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate500,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  newsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  pinnedCard: {
    borderColor: Colors.gold200,
    borderWidth: 2,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gold600,
    marginLeft: 4,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  newsContent: {
    fontSize: 14,
    color: Colors.slate600,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  readMore: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.blue500,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: Colors.slate400,
  },
});
