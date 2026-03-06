/**
 * ContactScreen - Kontakt & FAQ
 * 1:1 Kopie der Website Contact-Seite
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';
import { API_URL, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';

// FAQ Data
const faqData = [
  { q: 'Welchen Taschenrechner brauche ich?', a: 'Für dein Studium reicht ein einfacher, wissenschaftlicher Taschenrechner (kein programmierbarer Grafikrechner). Viele Studierende verwenden z.B. den Texas Instruments TI-30Xa.' },
  { q: 'Wie borge ich ein Buch aus?', a: 'Als JKU-Studierender kannst du ganz einfach Bücher in der Universitätsbibliothek ausleihen. Deine JKU Card ist zugleich deine Bibliothekskarte.' },
  { q: 'Gibt es eine kostenfreie Lizenz für Microsoft 365?', a: 'Ja! Als JKU-Studierende:r bekommst du Microsoft Office 365 gratis. Du kannst die Software auf bis zu 5 Geräten gleichzeitig installieren.' },
  { q: 'Wie funktioniert ein Auslandssemester?', a: 'Ein Auslandssemester planst du am besten über die Austauschprogramme der JKU. Die JKU hat rund 200 Partneruniversitäten weltweit.' },
];

export default function ContactScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [sending, setSending] = useState(false);

  const openEmail = () => {
    Linking.openURL('mailto:wirtschaft@oeh.jku.at');
  };

  const openSprechstunde = () => {
    Linking.openURL('https://zeeg.me/wirtschaft');
  };

  const openSocialLink = (url: string) => {
    Linking.openURL(url);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus.');
      return;
    }

    setSending(true);
    try {
      const body = new FormData();
      body.append('name', formData.name);
      body.append('email', formData.email);
      body.append('anliegen', 'Sonstiges');
      body.append('beschreibung', formData.message);
      body.append('studium', 'Nicht angegeben');

      const response = await fetch(`${API_URL}${ENDPOINTS.CONTACT}`, {
        method: 'POST',
        body,
      });

      if (response.ok) {
        Alert.alert('Erfolg', t('contact.success'));
        setFormData({ name: '', email: '', message: '' });
      } else {
        throw new Error('Fehler beim Senden');
      }
    } catch (err) {
      Alert.alert('Fehler', t('contact.errorSend'));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('contact.title')} subtitle={t('contact.section')} showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <Text style={styles.description}>{t('contact.desc')}</Text>

          {/* Direct Contact Card */}
          <View style={styles.contactCard}>
            <Text style={styles.contactCardTitle}>{t('contact.directContact')}</Text>
            
            <TouchableOpacity style={styles.contactRow} onPress={openEmail}>
              <Ionicons name="mail-outline" size={18} color={Colors.blue100} />
              <Text style={styles.contactText}>wirtschaft@oeh.jku.at</Text>
            </TouchableOpacity>
            
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={18} color={Colors.blue100} />
              <Text style={styles.contactText}>Keplergebäude, JKU Linz</Text>
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('https://www.instagram.com/oeh_wirtschaft_wipaed/')}
              >
                <Ionicons name="logo-instagram" size={18} color={Colors.white} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('http://linkedin.com/company/wirtschaft-wipaed')}
              >
                <Ionicons name="logo-linkedin" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sprechstunden */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="time-outline" size={24} color={Colors.blue500} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{t('contact.sprechstunden')}</Text>
                <Text style={styles.sectionSubtitle}>{t('contact.sprechstundenSub')}</Text>
              </View>
            </View>

            <Text style={styles.sectionText}>
              {t('contact.sprechstundenDesc1')}
            </Text>

            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={16} color={Colors.gold600} />
              <Text style={styles.warningText}>{t('contact.sprechstundenWarning')}</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={openSprechstunde}>
              <Ionicons name="calendar-outline" size={18} color={Colors.white} />
              <Text style={styles.primaryButtonText}>{t('contact.sprechstundenBtn')}</Text>
            </TouchableOpacity>
          </View>

          {/* WhatsApp */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: Colors.green50 }]}>
                <Ionicons name="chatbubbles-outline" size={24} color={Colors.green500} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{t('contact.whatsapp')}</Text>
                <Text style={styles.sectionSubtitle}>{t('contact.whatsappSub')}</Text>
              </View>
            </View>

            <Text style={styles.sectionText}>
              {t('contact.whatsappDesc1')}
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>{t('contact.whatsappJoinTitle')}</Text>
              <Text style={styles.infoBoxText}>{t('contact.whatsappJoinDesc')}</Text>
            </View>
          </View>

          {/* FAQ */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="help-circle-outline" size={24} color={Colors.blue500} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{t('contact.faq')}</Text>
                <Text style={styles.sectionSubtitle}>{t('contact.faqSub')}</Text>
              </View>
            </View>

            {faqData.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <Ionicons
                    name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.slate400}
                  />
                </View>
                {expandedFaq === index && (
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Contact Form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('contact.formTitle')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('contact.name')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t('contact.namePh')}
                placeholderTextColor={Colors.slate400}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('contact.email')} *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder={t('contact.emailPh')}
                placeholderTextColor={Colors.slate400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('contact.nachricht')} *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                placeholder={t('contact.nachrichtPh')}
                placeholderTextColor={Colors.slate400}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, sending && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={sending}
            >
              <Ionicons name="send-outline" size={18} color={Colors.white} />
              <Text style={styles.submitButtonText}>
                {sending ? t('contact.sending') : t('contact.submit')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  contactCard: {
    backgroundColor: Colors.blue500,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  contactCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 14,
    color: Colors.blue100,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    marginBottom: 8,
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.blue50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.slate900,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.slate500,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.slate600,
    lineHeight: 20,
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.gold50,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold200,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gold700,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  infoBox: {
    backgroundColor: Colors.slate50,
    padding: 12,
    borderRadius: 12,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.slate700,
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 12,
    color: Colors.slate500,
  },
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate100,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.slate800,
    paddingRight: 12,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.slate500,
    lineHeight: 20,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.slate700,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.slate900,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.slate300,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
