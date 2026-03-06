/**
 * NewsScreen - News & Ankündigungen
 * 1:1 Kopie der Website News-Seite
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
import { API_URL, apiFetch, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  color: string;
  is_pinned: boolean;
  views: number;
  author_name: string;
  published_at: string;
  created_at: string;
}

const priorityIcons = {
  urgent: 'alert-circle',
  high: 'warning',
  medium: 'notifications',
  low: 'information-circle',
} as const;

function formatDate(dateString: string, t: any): string {
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

function NewsCard({ item, t }: { item: NewsItem; t: any }) {
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
      {/* Color Accent Bar */}
      <View style={[styles.accentBar, { backgroundColor: priorityConfig.text }]} />

      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          {item.is_pinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={10} color={Colors.gold600} />
              <Text style={styles.pinnedText}>{t('news.pinned')}</Text>
            </View>
          )}
          <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.badge }]}>
            <Ionicons name={priorityIcon} size={10} color={priorityConfig.text} />
            <Text style={[styles.priorityText, { color: priorityConfig.text }]}>
              {priorityLabels[item.priority]}
            </Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="eye-outline" size={12} color={Colors.slate400} />
          <Text style={styles.metaText}>{item.views}</Text>
          <Ionicons name="time-outline" size={12} color={Colors.slate400} style={{ marginLeft: 8 }} />
          <Text style={styles.metaText}>{formatDate(item.published_at || item.created_at, t)}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.newsTitle}>{item.title}</Text>

      {/* Content */}
      <Text style={styles.newsContent} numberOfLines={expanded ? undefined : 3}>
        {expanded ? item.content : item.excerpt || item.content}
      </Text>

      {/* Expand Button */}
      {item.content.length > 200 && (
        <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.expandText}>
            {expanded ? t('news.showLess') : t('news.readMore')}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={Colors.blue500}
          />
        </TouchableOpacity>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Ionicons name="person-outline" size={14} color={Colors.slate400} />
        <Text style={styles.authorText}>{item.author_name}</Text>
      </View>
    </View>
  );
}

export default function NewsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const data = await apiFetch<NewsItem[]>(ENDPOINTS.NEWS);
      setNews(data);
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

  const filteredNews = filter === 'all' ? news : news.filter((n) => n.priority === filter);
  const pinnedNews = filteredNews.filter((n) => n.is_pinned);
  const regularNews = filteredNews.filter((n) => !n.is_pinned);

  const filters = [
    { value: 'all', label: t('news.all') },
    { value: 'urgent', label: t('news.urgent') },
    { value: 'high', label: t('news.important') },
    { value: 'medium', label: t('news.normal') },
    { value: 'low', label: t('news.info') },
  ];

  return (
    <View style={styles.container}>
      <Header title={t('news.title')} subtitle={t('news.section')} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue500]} />
        }
      >
        {/* Description */}
        <Text style={styles.description}>{t('news.desc')}</Text>

        {/* Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <Text style={styles.filterLabel}>{t('news.filter')}</Text>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterButton, filter === f.value && styles.filterButtonActive]}
              onPress={() => setFilter(f.value)}
            >
              <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        {loading ? (
          <LoadingSpinner />
        ) : news.length === 0 ? (
          <EmptyState
            icon="megaphone-outline"
            title={t('news.noNews')}
            description={t('news.noNewsSub')}
          />
        ) : (
          <View style={styles.newsContainer}>
            {/* Pinned News */}
            {pinnedNews.length > 0 && (
              <View style={styles.pinnedSection}>
                <View style={styles.sectionLabel}>
                  <Ionicons name="pin" size={14} color={Colors.gold500} />
                  <Text style={styles.sectionLabelText}>{t('news.pinnedPosts')}</Text>
                </View>
                {pinnedNews.map((item) => (
                  <NewsCard key={item.id} item={item} t={t} />
                ))}
              </View>
            )}

            {/* Regular News */}
            {regularNews.length > 0 && (
              <View style={styles.regularSection}>
                {pinnedNews.length > 0 && (
                  <Text style={styles.sectionLabelText}>{t('news.moreNews')}</Text>
                )}
                {regularNews.map((item) => (
                  <NewsCard key={item.id} item={item} t={t} />
                ))}
              </View>
            )}
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.slate500,
    marginRight: 4,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.slate100,
  },
  filterButtonActive: {
    backgroundColor: Colors.blue500,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate600,
  },
  filterTextActive: {
    color: Colors.white,
  },
  newsContainer: {
    padding: 16,
  },
  pinnedSection: {
    marginBottom: 16,
  },
  regularSection: {},
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  newsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.slate100,
    overflow: 'hidden',
  },
  pinnedCard: {
    borderColor: Colors.gold200,
    borderWidth: 2,
  },
  accentBar: {
    height: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gold50,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pinnedText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.gold600,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: Colors.slate400,
    marginLeft: 4,
  },
  newsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.slate900,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  newsContent: {
    fontSize: 14,
    color: Colors.slate500,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.blue500,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  authorText: {
    fontSize: 12,
    color: Colors.slate400,
  },
});
