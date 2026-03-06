/**
 * KalenderScreen - Events & Termine
 * 1:1 Kopie der Website Kalender-Seite
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { Colors, EventColorMap } from '../constants/Colors';
import { API_URL, apiFetch, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

interface Event {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  all_day: boolean;
  color: string;
  tags?: string;
  registration_required?: boolean;
  registration_count?: number;
  max_participants?: number;
  registration_open?: boolean;
}

export default function KalenderScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const monthNames = t('kalender.months', { returnObjects: true }) as string[];
  const dayNames = t('kalender.days', { returnObjects: true }) as string[];

  useEffect(() => {
    fetchEvents();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const fetchEvents = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const data = await apiFetch<Event[]>(`${ENDPOINTS.EVENTS}?month=${month}&year=${year}`);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const dateLocale = i18n.language === 'en' ? 'en-GB' : 'de-DE';

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(dateLocale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [events]);

  const getColorConfig = (color: string) => {
    return EventColorMap[color as keyof typeof EventColorMap] || EventColorMap.blue;
  };

  return (
    <View style={styles.container}>
      <Header title={t('kalender.title')} subtitle={t('kalender.section')} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue500]} />
        }
      >
        {/* Description */}
        <Text style={styles.description}>{t('kalender.desc')}</Text>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(-1)}>
            <Ionicons name="chevron-back" size={20} color={Colors.slate700} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(1)}>
            <Ionicons name="chevron-forward" size={20} color={Colors.slate700} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayText}>{t('kalender.today')}</Text>
          </TouchableOpacity>
        </View>

        {/* Events List */}
        {loading ? (
          <LoadingSpinner />
        ) : sortedEvents.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={t('kalender.noEvents')}
          />
        ) : (
          <View style={styles.eventsList}>
            {sortedEvents.map((event) => {
              const colorConfig = getColorConfig(event.color);
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.eventCard, { borderLeftColor: colorConfig.dot }]}
                  onPress={() => setSelectedEvent(event)}
                >
                  <View style={[styles.eventDot, { backgroundColor: colorConfig.dot }]} />
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      {event.registration_required && (
                        <View style={styles.registrationBadge}>
                          <Ionicons name="person-add" size={10} color={Colors.blue600} />
                        </View>
                      )}
                    </View>
                    <View style={styles.eventMeta}>
                      <Ionicons name="time-outline" size={14} color={Colors.slate400} />
                      <Text style={styles.eventMetaText}>
                        {event.all_day ? t('kalender.allDay') : formatTime(event.start_date)}
                      </Text>
                      <Text style={styles.eventDate}>{formatDate(event.start_date)}</Text>
                    </View>
                    {event.location && (
                      <View style={styles.eventMeta}>
                        <Ionicons name="location-outline" size={14} color={Colors.slate400} />
                        <Text style={styles.eventMetaText}>{event.location}</Text>
                      </View>
                    )}
                    {event.registration_required && (
                      <View style={styles.eventMeta}>
                        <Ionicons name="people-outline" size={14} color={Colors.slate400} />
                        <Text style={styles.eventMetaText}>
                          {event.registration_count || 0}
                          {event.max_participants ? `/${event.max_participants}` : ''} Teilnehmer
                        </Text>
                      </View>
                    )}
                    {event.tags && (
                      <View style={styles.tagsRow}>
                        {event.tags.split(',').map((tag, i) => (
                          <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>{tag.trim()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal
        visible={!!selectedEvent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEvent(null)}
      >
        {selectedEvent && (
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { backgroundColor: getColorConfig(selectedEvent.color).bg }]}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                <Text style={styles.modalDate}>{formatDate(selectedEvent.start_date)}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedEvent(null)}>
                <Ionicons name="close" size={20} color={Colors.slate700} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <View style={styles.modalRow}>
                  <Ionicons name="time-outline" size={18} color={Colors.slate400} />
                  <Text style={styles.modalText}>
                    {selectedEvent.all_day
                      ? t('kalender.allDay')
                      : `${formatTime(selectedEvent.start_date)}${selectedEvent.end_date ? ` - ${formatTime(selectedEvent.end_date)}` : ''}`}
                  </Text>
                </View>

                {selectedEvent.location && (
                  <View style={styles.modalRow}>
                    <Ionicons name="location-outline" size={18} color={Colors.slate400} />
                    <Text style={styles.modalText}>{selectedEvent.location}</Text>
                  </View>
                )}

                {selectedEvent.registration_required && (
                  <View style={styles.modalRow}>
                    <Ionicons name="people-outline" size={18} color={Colors.slate400} />
                    <Text style={styles.modalText}>
                      {selectedEvent.registration_count || 0}
                      {selectedEvent.max_participants ? ` / ${selectedEvent.max_participants}` : ''} Teilnehmer
                    </Text>
                  </View>
                )}

                {selectedEvent.description && (
                  <Text style={styles.modalDescription}>{selectedEvent.description}</Text>
                )}

                {selectedEvent.tags && (
                  <View style={styles.modalTags}>
                    {selectedEvent.tags.split(',').map((tag, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{tag.trim()}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.calendarButton}>
                <Ionicons name="download-outline" size={18} color={Colors.white} />
                <Text style={styles.calendarButtonText}>{t('kalender.saveToCalendar')}</Text>
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.slate200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    textAlign: 'center',
  },
  todayButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.blue50,
    borderRadius: 12,
  },
  todayText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.blue600,
  },
  eventsList: {
    padding: 16,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
    borderLeftWidth: 4,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.slate900,
    flex: 1,
  },
  registrationBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.blue100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eventMetaText: {
    fontSize: 13,
    color: Colors.slate500,
  },
  eventDate: {
    fontSize: 12,
    color: Colors.slate400,
    marginLeft: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: Colors.slate100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: Colors.slate600,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 60,
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 14,
    color: Colors.slate600,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 15,
    color: Colors.slate600,
  },
  modalDescription: {
    fontSize: 15,
    color: Colors.slate600,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  calendarButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
