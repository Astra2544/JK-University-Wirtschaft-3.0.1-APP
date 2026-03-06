/**
 * KalenderScreen - Events & Termine
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { Colors } from '../constants/Colors';
import { apiFetch, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function KalenderScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  useEffect(() => {
    fetchEvents();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const fetchEvents = async () => {
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const data = await apiFetch(`${ENDPOINTS.EVENTS}?month=${month}&year=${year}`);
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

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
    setLoading(true);
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, events: [] });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.start_date);
        return eventDate.getDate() === day && eventDate.getMonth() === month;
      });
      days.push({ day, events: dayEvents });
    }

    return days;
  }, [currentDate, events]);

  const formatEventTime = (event) => {
    if (event.all_day) return t('kalender.allDay');
    const start = new Date(event.start_date);
    return start.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <Header title={t('kalender.title')} subtitle={t('kalender.section')} />

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.slate700} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={Colors.slate700} />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.dayHeaders}>
        {dayNames.map((day, index) => (
          <Text key={index} style={styles.dayHeader}>{day}</Text>
        ))}
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.blue500]} />
          }
        >
          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((item, index) => (
              <View key={index} style={styles.dayCell}>
                {item.day && (
                  <>
                    <Text style={[
                      styles.dayNumber,
                      new Date().getDate() === item.day && 
                      new Date().getMonth() === currentDate.getMonth() && 
                      styles.today
                    ]}>
                      {item.day}
                    </Text>
                    {item.events.slice(0, 2).map((event, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.eventDot, { backgroundColor: event.color || Colors.blue500 }]}
                        onPress={() => setSelectedEvent(event)}
                      >
                        <Text style={styles.eventDotText} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {item.events.length > 2 && (
                      <Text style={styles.moreEvents}>+{item.events.length - 2}</Text>
                    )}
                  </>
                )}
              </View>
            ))}
          </View>

          {/* Upcoming Events List */}
          <View style={styles.upcomingSection}>
            <Text style={styles.sectionTitle}>{t('kalender.upcoming')}</Text>
            {events.length === 0 ? (
              <EmptyState icon="calendar-outline" title={t('kalender.noEvents')} />
            ) : (
              events.slice(0, 5).map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() => setSelectedEvent(event)}
                >
                  <View style={[styles.eventColor, { backgroundColor: event.color || Colors.blue500 }]} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>
                      {new Date(event.start_date).toLocaleDateString('de-AT')} • {formatEventTime(event)}
                    </Text>
                    {event.location && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color={Colors.slate400} />
                        <Text style={styles.eventLocation}>{event.location}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.slate300} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Event Detail Modal */}
      <Modal visible={!!selectedEvent} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEvent && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalColor, { backgroundColor: selectedEvent.color || Colors.blue500 }]} />
                  <TouchableOpacity onPress={() => setSelectedEvent(null)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={Colors.slate700} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                <View style={styles.modalInfo}>
                  <Ionicons name="calendar-outline" size={18} color={Colors.slate500} />
                  <Text style={styles.modalInfoText}>
                    {new Date(selectedEvent.start_date).toLocaleDateString('de-AT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.modalInfo}>
                  <Ionicons name="time-outline" size={18} color={Colors.slate500} />
                  <Text style={styles.modalInfoText}>{formatEventTime(selectedEvent)}</Text>
                </View>
                {selectedEvent.location && (
                  <View style={styles.modalInfo}>
                    <Ionicons name="location-outline" size={18} color={Colors.slate500} />
                    <Text style={styles.modalInfoText}>{selectedEvent.location}</Text>
                  </View>
                )}
                {selectedEvent.description && (
                  <Text style={styles.modalDescription}>{selectedEvent.description}</Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
  },
  dayHeaders: {
    flexDirection: 'row',
    backgroundColor: Colors.slate50,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate500,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
  },
  dayCell: {
    width: '14.28%',
    minHeight: 80,
    padding: 4,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.slate100,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.slate700,
    marginBottom: 4,
  },
  today: {
    backgroundColor: Colors.blue500,
    color: Colors.white,
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  eventDot: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  eventDotText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: '500',
  },
  moreEvents: {
    fontSize: 10,
    color: Colors.slate400,
    fontWeight: '500',
  },
  upcomingSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  eventColor: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    minHeight: 48,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.slate900,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 13,
    color: Colors.slate500,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 13,
    color: Colors.slate400,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalColor: {
    width: 48,
    height: 6,
    borderRadius: 3,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 16,
  },
  modalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 15,
    color: Colors.slate600,
    marginLeft: 12,
  },
  modalDescription: {
    fontSize: 15,
    color: Colors.slate600,
    lineHeight: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
  },
});
