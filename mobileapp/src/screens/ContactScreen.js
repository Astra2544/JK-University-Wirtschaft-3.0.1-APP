/**
 * ContactScreen - Kontakt & FAQ
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';
import { apiFetch, ENDPOINTS } from '../constants/Api';
import Header from '../components/Header';

export default function ContactScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    name: '',
    email: '',
    studium: '',
    anliegen: '',
    nachricht: '',
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.nachricht) {
      Alert.alert('Fehler', 'Bitte fülle alle Pflichtfelder aus.');
      return;
    }

    setSending(true);
    try {
      await apiFetch(ENDPOINTS.CONTACT, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      Alert.alert('Erfolg', t('contact.success'));
      setForm({ name: '', email: '', studium: '', anliegen: '', nachricht: '' });
    } catch (err) {
      Alert.alert('Fehler', t('contact.errorSend'));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={t('contact.title')} subtitle={t('contact.section')} showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.introText}>{t('contact.desc')}</Text>

        {/* Direct Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contact.directContact')}</Text>
          
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL('mailto:wirtschaft@oeh.jku.at')}
          >
            <View style={[styles.contactIcon, { backgroundColor: Colors.blue50 }]}>
              <Ionicons name="mail" size={24} color={Colors.blue500} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>E-Mail</Text>
              <Text style={styles.contactValue}>wirtschaft@oeh.jku.at</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.slate300} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Linking.openURL('https://oeh.jku.at/wirtschaft')}
          >
            <View style={[styles.contactIcon, { backgroundColor: Colors.gold50 }]}>
              <Ionicons name="globe" size={24} color={Colors.gold500} />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Website</Text>
              <Text style={styles.contactValue}>oeh.jku.at/wirtschaft</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.slate300} />
          </TouchableOpacity>
        </View>

        {/* Office Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contact.sprechstunden')}</Text>
          <View style={styles.infoCard}>
            <Ionicons name="calendar-outline" size={20} color={Colors.blue500} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{t('contact.sprechstundenSub')}</Text>
              <Text style={styles.infoDesc}>{t('contact.sprechstundenDesc1')}</Text>
              <Text style={styles.warningText}>{t('contact.sprechstundenWarning')}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL('https://calendly.com/oeh-wirtschaft')}
          >
            <Text style={styles.actionButtonText}>{t('contact.sprechstundenBtn')}</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* WhatsApp */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contact.whatsapp')}</Text>
          <View style={styles.infoCard}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{t('contact.whatsappSub')}</Text>
              <Text style={styles.infoDesc}>{t('contact.whatsappDesc1')}</Text>
              <Text style={styles.joinTitle}>{t('contact.whatsappJoinTitle')}</Text>
              <Text style={styles.infoDesc}>{t('contact.whatsappJoinDesc')}</Text>
            </View>
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contact.formTitle')}</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('contact.name')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('contact.namePh')}
              placeholderTextColor={Colors.slate400}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('contact.email')} *</Text>
            <TextInput
              style={styles.input}
              placeholder={t('contact.emailPh')}
              placeholderTextColor={Colors.slate400}
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('contact.nachricht')} *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder={t('contact.nachrichtPh')}
              placeholderTextColor={Colors.slate400}
              multiline
              numberOfLines={4}
              value={form.nachricht}
              onChangeText={(text) => setForm({ ...form, nachricht: text })}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, sending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={sending}
          >
            <Text style={styles.submitButtonText}>
              {sending ? t('contact.sending') : t('contact.submit')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.slate900,
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate900,
  },
  contactValue: {
    fontSize: 13,
    color: Colors.slate500,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.slate100,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.slate900,
    marginBottom: 8,
  },
  infoDesc: {
    fontSize: 14,
    color: Colors.slate600,
    lineHeight: 20,
  },
  warningText: {
    fontSize: 13,
    color: Colors.red500,
    marginTop: 8,
    fontWeight: '500',
  },
  joinTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate900,
    marginTop: 12,
    marginBottom: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.blue500,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
    marginRight: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.slate900,
    borderWidth: 1,
    borderColor: Colors.slate200,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.blue500,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.slate300,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
