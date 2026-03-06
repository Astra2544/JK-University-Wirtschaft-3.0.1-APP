/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CONTACT PAGE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Kontaktseite mit Formular, FAQ und Sprechstunden-Buchung.
 *  Ermoeglicht direkte Kontaktaufnahme mit der OeH Wirtschaft.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { RevealOnScroll } from '../components/Animations';
import {
  Mail, MapPin, Clock, Send, CheckCircle, AlertCircle,
  Instagram, Linkedin, ExternalLink, MessageCircle, Calendar,
  ArrowUpRight, Building, ChevronDown, HelpCircle, Upload, X,
  FileText, Image as ImageIcon, Info
} from 'lucide-react';
import Marquee from '../components/Marquee';

const pv = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const STUDIUM_OPTIONS = [
  { group: 'Allgemein', items: ['Noch kein Studium', 'Studium bereits abgeschlossen'] },
  { group: 'Bachelor', items: [
    'BSc. Wirtschaftswissenschaften',
    'BSc. Betriebswirtschaftslehre',
    'BSc. International Business Administration',
    'BSc. (CE) Finance, Banking und Digitalisierung',
  ]},
  { group: 'Master', items: [
    'MSc. Digital Business Management',
    'MSc. Economic and Business Analytics',
    'MSc. Economics',
    'MSc. Finance and Accounting',
    'MSc. Management',
    'MSc. General Management',
    'MSc. Global Business',
    'MSc. Leading Innovative Organizations',
  ]},
  { group: 'MBA', items: [
    'MBA Global Executive MBA',
    'MBA Executive MBA Management & Leadership',
    'MBA Management und Leadership für Frauen',
    'MBA Health Care Management',
  ]},
  { group: 'Universitätslehrgänge', items: [
    'ULG Versicherungswirtschaft',
    'ULG Tourismusmanagement',
    'ULG Applied Business Excellence',
  ]},
];

// ─── FAQ DATEN ─────────────────────────────────────────────────────────────
const faq = [
  { q: 'Welchen Taschenrechner brauche ich?', a: 'Für dein Studium reicht ein einfacher, wissenschaftlicher Taschenrechner (kein programmierbarer Grafikrechner). Viele Studierende verwenden z.\u00A0B. den Texas Instruments TI-30Xa. Wichtig ist, dass der Taschenrechner nicht programmierbar ist \u2013 in Prüfungen sind meist nur solche Modelle als Hilfsmittel erlaubt. Modelle wie der TI-30Xa oder vergleichbare von Casio (z.\u00A0B. fx-82-Serie) erfüllen die Anforderungen problemlos. (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Wie borge ich ein Buch aus?', a: 'Als JKU-Studierender kannst du ganz einfach Bücher in der Universitätsbibliothek ausleihen. Deine JKU Card (Studierendenausweis) ist zugleich deine Bibliothekskarte. Du suchst dir das Buch im Regal (oder im Online-Katalog \u201ELISSS\u201C) und nimmst es heraus. Dann gehst du entweder zur Leihstelle (Schalter) oder nutzt die Selbstverbuchungsgeräte (Self-Check) vor Ort, um das Buch mit deiner Karte auszuborgen. Die Standard-Leihfrist beträgt 1 Monat und du kannst als Studierender bis zu 25 Bücher gleichzeitig entlehnen. Verlängern oder Vormerken von Büchern geht online über dein Bibliothekskonto. (Tipp: Zeitschriften und Zeitungen kann man nur vor Ort lesen, nicht ausborgen.) (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Wo bekomme ich Uni-Bücher zum Kaufen?', a: 'Die erste Adresse für den Kauf von Lehrbüchern und Skripten ist der ÖH JKU Shop am Campus. Dort bekommst du Studienliteratur oft vergünstigt \u2013 viele Bücher gibt\u2019s für Studierende mit etwa 20\u00A0% Rabatt. Der ÖH-Shop hat meist alle gängigen Skripten und Lehrbücher für deine Kurse lagernd oder kann sie bestellen. Alternativ kannst du natürlich auch in regulären Buchhandlungen oder online schauen, aber im ÖH-Shop sparst du Geld und unterstützt die Studierendenvertretung. (Infos zum Shop findest du auf oeh-jku-shop.myshopify.com) (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Wo kann ich meine alten Bücher verkaufen?', a: 'Dafür gibt es an der JKU die ÖH Bücherbörse. Dort kannst du gebrauchte Studienbücher, Skripten etc. von der ÖH für dich verkaufen lassen. Du bringst dein Buch einfach zur Bücherbörse (neben dem ÖH-Shop am Campus) und legst einen Preis fest \u2013 die ÖH bietet es dann vor Ort und online zum Verkauf an. Sobald ein:e Käufer:in dein Buch gekauft hat, wirst du benachrichtigt und bekommst den Verkaufserlös ausgezahlt. Genauso kannst du selbst günstig gebrauchte Bücher kaufen: Schau einfach in der Bücherbörse vorbei oder online in deren Verzeichnis. (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Kann ich meine Bachelorarbeit überall schreiben? Was ist zu beachten?', a: 'Deine Bachelorarbeit kannst du themenmäßig nicht völlig frei und \u201Eüberall\u201C schreiben, sondern sie muss im Rahmen einer Lehrveranstaltung deines Studiums erfolgen. In der Praxis heißt das: Im Curriculum ist vorgesehen, in welchem Seminar oder bei welcher Betreuung du die Arbeit verfasst. Du meldest dich also für die entsprechende LV an und sprichst mit der Betreuerin/dem Betreuer ein Thema ab. Örtlich bist du aber nicht gebunden \u2013 du kannst natürlich zu Hause, in der Bibliothek oder auch extern (z.\u00A0B. in Kooperation mit einer Firma) schreiben. Wichtig ist, dass du die formalen Schritte beachtest: Das Thema muss offiziell beim Prüfungsservice angemeldet werden (mit Formular und Unterschrift deines Betreuers), und du musst während der Bearbeitung als Student:in inskribiert sein. Fazit: Grundsätzlich kannst du deine Bachelorarbeit überall schreiben, solange eine JKU-Betreuung dahintersteht und die Regeln der guten wissenschaftlichen Praxis eingehalten werden. (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Prüfungsantritte: Was zählt?', a: 'Du hast für jede Prüfung an der Uni mehrere Versuche, allerdings sind diese begrenzt. Generell sind maximal 5 Antritte pro Prüfung zulässig (das heißt vier Wiederholungen) \u2013 bei STEOP-Prüfungen sogar nur 4 Antritte. Nur Prüfungen, zu denen du auch wirklich antrittst, zählen als Verbrauch eines Versuchs. Meldest du dich rechtzeitig ab oder erscheinst nicht, ist das kein offizieller Antritt (du wirst aber bei Nicht-Abmeldung für den nächsten Termin gesperrt). Jeder negative Antritt (Nicht Genügend) zählt als verbrauchter Versuch. Bei positiver Note brauchst du nicht nochmal anzutreten \u2013 du kannst aber innerhalb von 12 Monaten freiwillig einmal zur Notenverbesserung nochmals antreten (in dem Fall wird die neue Note gezählt, selbst wenn sie schlechter ausfällt). Beachte: Wenn du die maximale Anzahl an Antritten ausgeschöpft hast und die Prüfung endgültig nicht bestanden ist, darfst du dieses Studium nicht weiterführen. (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Was ist die Studienbeihilfe? Habe ich Anspruch darauf?', a: 'Die Studienbeihilfe ist eine staatliche Unterstützung für Studierende, die finanziell Unterstützung brauchen. Ob du Anspruch hast, hängt von mehreren Kriterien ab: Staatsbürgerschaft (Österreicher:innen und Gleichgestellte), soziale Bedürftigkeit (Einkommen der Eltern, Familiengröße etc.) und ein \u201Egünstiger Studienerfolg\u201C (du musst nach den ersten zwei Semestern eine gewisse Zahl an ECTS nachweisen). Außerdem musst du dein Studium rechtzeitig begonnen haben (in der Regel vor dem 33. Geburtstag; für Selbsterhalter:innen und Studierende mit Kind gibt\u2019s Ausnahmen bis 38). Du darfst noch keinen gleichwertigen Abschluss haben und musst im vorgeschriebenen Zeitrahmen studieren (Mindeststudienzeit + Toleranzsemester). Antragsstellung: Du musst die Studienbeihilfe jedes Jahr beantragen (online auf stipendium.at oder per Formular). Die Fristen sind jedes Semester von 20. September bis 15. Dezember bzw. 20. Februar bis 15. Mai. Wenn du Fragen hast oder Hilfe beim Antrag brauchst, kannst du dich auch an die ÖH-Sozialberatung wenden. (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Was sind freie Studienleistungen?', a: '\u201EFreie Studienleistungen\u201C sind frei wählbare Lehrveranstaltungen in deinem Studium. Im Curriculum ist meist eine gewisse ECTS-Anzahl dafür vorgesehen, die du nach deinen eigenen Interessen füllen kannst. Das Tolle: Nach Abschluss der STEOP kannst du dafür aus dem gesamten LV-Angebot der Uni wählen \u2013 also auch Kurse aus anderen Studienrichtungen, Fremdsprachenkurse, etc., sofern du die eventuellen Voraussetzungen erfüllst. Diese freien Wahlfächer dienen dazu, über den Tellerrand deines eigentlichen Studiums hinaus zusätzliche Kenntnisse zu erwerben. Sie zählen ganz normal zu deinem Studienabschluss dazu und ermöglichen es dir, dein Studium individueller zu gestalten. (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Was sind USI-Kurse?', a: 'USI-Kurse sind die Sportkurse des Universitätssportinstituts (USI). Das USI bietet jedes Semester ein breites Sport- und Bewegungsprogramm mit über 200 Kursen an \u2013 von Aerobic und Yoga über Ballsportarten bis Klettern und mehr. Mitmachen können alle Studierenden; die Kurse kosten nur einen geringen Beitrag. Die Anmeldung läuft online über usi.jku.at, dort findest du das Kursprogramm. USI-Kurse sind eine tolle Gelegenheit, Ausgleich zum Studienalltag zu schaffen und neue Sportarten auszuprobieren. Außerdem gibt es an der JKU ein eigenes Fitnessstudio (im Kepler Hall). (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Wie funktioniert ein Auslandssemester?', a: 'Ein Auslandssemester planst du am besten über die Austauschprogramme der JKU. Die JKU hat rund 200 Partneruniversitäten weltweit für Studierendenaustausch. Typischerweise bewirbst du dich ein Jahr im Voraus beim Auslandsbüro der JKU für ein Programm wie Erasmus+ (in Europa) oder andere Austauschprogramme. Voraussetzungen sind u.\u00A0a., dass du an der JKU ordentlich inskribiert bist und schon genug studiert hast \u2013 mindestens 2 Semester und die STEOP abgeschlossen (ca. 40 ECTS), bevor du ins Ausland gehst. Ein Auslandsstudium dauert in der Regel ein Semester (bis maximal ein Jahr). Während des Auslandssemesters zahlst du keine Studiengebühren an der Gastuni, musst aber weiterhin an der JKU gemeldet sein. Oft bekommst du auch ein Stipendium bzw. Zuschüsse (z.\u00A0B. Erasmus-Stipendium). Wichtig ist, vorab ein Learning Agreement zu machen, damit dir die im Ausland absolvierten Kurse daheim an der JKU anerkannt werden. (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Gibt es eine kostenfreie Lizenz für Microsoft 365?', a: 'Ja! Als JKU-Studierende:r bekommst du Microsoft Office 365 gratis. Die Uni stellt in Zusammenarbeit mit der ÖH allen Studierenden das Office-Paket kostenlos zur Verfügung \u2013 das umfasst Word, Excel, PowerPoint, OneNote, Outlook etc. Du kannst die Software auf bis zu 5 Geräten gleichzeitig installieren (PC, Laptop, Tablets, Smartphones) \u2013 Updates inklusive. Dazu gehört auch 1\u00A0TB Cloud-Speicher via OneDrive. Um die Gratis-Lizenz zu bekommen, musst du dich einmalig im JKU Moodle für den entsprechenden Office-365-Kurs registrieren; dort findest du genaue Anleitungen. (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Gibt es eine kostenfreie Lizenz für Zoom?', a: 'Ja, die JKU stellt auch für Zoom (durch Initiative der ÖH eingeführt) eine Campuslizenz bereit. Als Student:in kannst du dich unter jku.zoom.us mit deinem JKU/KUSSS-Login anmelden und damit einen vollwertigen Zoom-Account nutzen. Damit entfallen die Begrenzungen der kostenlosen Basisversion (z.\u00A0B. Meetings ohne 40-Minuten-Limit). Dieses Angebot ist besonders praktisch, wenn du z.\u00A0B. für deine Bachelorarbeit Interviews über Zoom führen möchtest. Verwende zum Login immer den JKU-Login über das Zoom-Portal der Uni. (Zuletzt aktualisiert: 07.2025)' },
  { q: 'Wie komme ich am besten in die Universität? Wo kann ich parken?', a: 'Am JKU Campus gibt es mehrere Parkmöglichkeiten \u2013 unter anderem ein Parkhaus und eine Tiefgarage unter dem Science Park mit insgesamt rund 1.700 Stellplätzen. Als Student:in kannst du dort zu vergünstigten Tarifen parken. Allerdings sind die Parkplätze zu Studienzeiten oft sehr ausgelastet und das innere Campusgebiet ist autofrei. Daher empfiehlt die Uni, lieber öffentliche Verkehrsmittel zu nutzen. Am bequemsten erreichst du den Campus mit der Straßenbahnlinie 1 oder 2: beide fahren von Linz Innenstadt/Hauptbahnhof direkt bis zur Haltestelle \u201EUniversität\u201C (Fahrzeit ca. 25 Minuten). Zudem verbinden Buslinien die Uni mit verschiedenen Stadtteilen. Für umweltfreundliche Anreise gibt es auch gute Fahrradwege und viele Fahrradständer am Campus. Weitere Infos: jku.at/campus/der-jku-campus/anfahrt/. (Zuletzt aktualisiert: 07.2025)' },
];

function FaqAcc({ q, a, testId }) {
  const [open, setOpen] = useState(false);
  return (
    <div data-testid={testId} className="border-b border-slate-100 last:border-b-0">
      <button onClick={() => setOpen(!open)} data-testid={`${testId}-toggle`} className="w-full flex items-center justify-between py-4 text-left group">
        <span className="text-[15px] font-medium text-slate-800 pr-4 group-hover:text-blue-500 transition-colors">{q}</span>
        <ChevronDown className={`text-slate-300 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} size={16}/>
      </button>
      <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
        <div className="pb-5"><p className="text-sm text-slate-500 leading-relaxed">{a}</p></div>
      </motion.div>
    </div>
  );
}

const inputCls = 'w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm';
const selectCls = (has) => `${inputCls} appearance-none bg-white ${has ? 'text-slate-900' : 'text-slate-400'}`;

function SelectWrap({ children }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

export default function Contact() {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [fd, setFd] = useState({
    name: '', email: '', studium: '', anliegen: '',
    semester: '', nachricht: '', lvName: '', beschreibung: '',
    lehrpersonName: '', lehrveranstaltung: '', datenschutz: false,
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState({});

  const anliegenOptions = t('contact.anliegenOptions', { returnObjects: true });
  const semesterOptions = t('contact.semesterOptions', { returnObjects: true });

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setFd(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setTouched(p => ({ ...p, [name]: true }));
  };

  const setAnliegen = (e) => {
    setFd(p => ({
      ...p, anliegen: e.target.value,
      semester: '', nachricht: '', lvName: '', beschreibung: '',
      lehrpersonName: '', lehrveranstaltung: '',
    }));
    setFile(null);
    setFileError('');
    setTouched(p => ({ ...p, anliegen: true }));
  };

  const onFile = (e) => {
    const f = e.target.files[0];
    setFileError('');
    if (!f) { setFile(null); return; }
    if (!['application/pdf','image/jpeg','image/png'].includes(f.type)) {
      setFileError(t('contact.fileErrorType'));
      setFile(null); return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileError(t('contact.fileErrorSize'));
      setFile(null); return;
    }
    setFile(f);
  };

  const clearFile = () => {
    setFile(null); setFileError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const validateAndSetFile = (f) => {
    setFileError('');
    if (!f) { setFile(null); return; }
    if (!['application/pdf','image/jpeg','image/png'].includes(f.type)) {
      setFileError(t('contact.fileErrorType'));
      setFile(null); return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileError(t('contact.fileErrorSize'));
      setFile(null); return;
    }
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const isMitmachen = fd.anliegen === anliegenOptions[0];
  const isWhatsApp = fd.anliegen === anliegenOptions[1];
  const isFrageLV = fd.anliegen === anliegenOptions[2];
  const isProblemLV = fd.anliegen === anliegenOptions[3];
  const isProblemLehrende = fd.anliegen === anliegenOptions[4];
  const isProblemBewertung = fd.anliegen === anliegenOptions[5];
  const isFragePlaner = fd.anliegen === anliegenOptions[6];
  const isSonstiges = fd.anliegen === anliegenOptions[7];
  const needsLvName = isFrageLV || isProblemLV;
  const needsDesc = isFrageLV || isProblemLV || isProblemLehrende || isProblemBewertung || isFragePlaner || isSonstiges;

  const valid = () => {
    if (!fd.name.trim() || !fd.email.trim() || !fd.studium || !fd.anliegen || !fd.datenschutz) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email)) return false;
    if (isMitmachen && !fd.semester) return false;
    if (isWhatsApp && !file) return false;
    if (needsLvName && !fd.lvName.trim()) return false;
    if (isProblemLehrende && !fd.lehrpersonName.trim()) return false;
    if (needsDesc && !fd.beschreibung.trim()) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid()) return;
    setSending(true);
    setStatus({ type: '', message: '' });
    try {
      const body = new FormData();
      body.append('name', fd.name.trim());
      body.append('email', fd.email.trim());
      body.append('studium', fd.studium);
      body.append('anliegen', fd.anliegen);
      if (isMitmachen) {
        body.append('semester', fd.semester);
        if (fd.nachricht.trim()) body.append('nachricht', fd.nachricht.trim());
      }
      if (isWhatsApp && file) body.append('file', file);
      if (needsLvName) body.append('lv_name', fd.lvName.trim());
      if (isProblemLehrende) {
        body.append('lehrperson_name', fd.lehrpersonName.trim());
        if (fd.lehrveranstaltung.trim()) body.append('lehrveranstaltung', fd.lehrveranstaltung.trim());
      }
      if (needsDesc) body.append('beschreibung', fd.beschreibung.trim());

      const res = await fetch(`${BACKEND_URL}/api/contact`, { method: 'POST', body });
      const data = await res.json();
      if (res.ok) {
        setStatus({ type: 'success', message: t('contact.success') });
        setFd({ name:'', email:'', studium:'', anliegen:'', semester:'', nachricht:'',
          lvName:'', beschreibung:'', lehrpersonName:'', lehrveranstaltung:'', datenschutz:false });
        setFile(null); setTouched({});
        if (fileRef.current) fileRef.current.value = '';
      } else {
        throw new Error(data.detail || t('contact.errorSend'));
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || t('contact.errorGeneric') });
    } finally { setSending(false); }
  };

  const descLabel = (isProblemLV || isProblemBewertung || isFragePlaner) ? t('contact.placeholders.problemLabel') : t('contact.placeholders.descLabel');
  const descPlaceholder =
    isProblemLV ? t('contact.placeholders.problemLV')
    : isProblemLehrende ? t('contact.placeholders.problemLehrende')
    : isProblemBewertung ? t('contact.placeholders.problemBewertung')
    : isFragePlaner ? t('contact.placeholders.problemPlaner')
    : isFrageLV ? t('contact.placeholders.frageLV')
    : t('contact.placeholders.sonstiges');

  return (
    <motion.div variants={pv} initial="initial" animate="animate" exit="exit">

      {/* Header */}
      <section className="pt-28 pb-12 md:pt-40 md:pb-16 px-5 relative overflow-hidden">
        <div className="absolute top-10 -right-40 w-[500px] h-[500px] rounded-full bg-blue-50 blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] rounded-full bg-gold-50 blur-3xl opacity-50" />

        <div className="absolute top-[60%] right-[15%] sm:top-[58%] sm:right-[20%] md:right-[18%] lg:right-[22%] -translate-y-1/2 pointer-events-none z-[1]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -top-4 -left-4 w-2 h-2 rounded-full bg-gold-500/50" />
            <div className="absolute -bottom-3 -right-3 w-1.5 h-1.5 rounded-full bg-blue-500/40" />
            <div className="absolute top-1/2 -right-6 w-8 h-[1px] bg-gradient-to-r from-blue-500/20 to-transparent" />

            <div className="relative w-[96px] h-[96px] sm:w-[90px] sm:h-[90px] md:w-[110px] md:h-[110px] lg:w-[135px] lg:h-[135px]">
              <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-xl shadow-slate-200/30" />

              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-[50px] h-[50px] sm:w-[48px] sm:h-[48px] md:w-[58px] md:h-[58px] lg:w-[70px] lg:h-[70px]" viewBox="0 0 80 80" fill="none">
                  <rect x="10" y="22" width="60" height="40" rx="4" fill="#3B82F6" fillOpacity="0.1" stroke="#3B82F6" strokeWidth="1.5" />
                  <path d="M10 26L40 45L70 26" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 62L30 42" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.3" />
                  <path d="M70 62L50 42" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.3" />
                  <circle cx="62" cy="26" r="8" fill="#EAB308" fillOpacity="0.2" stroke="#EAB308" strokeWidth="1.2" />
                  <path d="M59 26L61.5 28.5L65.5 23.5" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 md:right-3 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gold-500/80" />
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-1.5 h-1.5 rounded-full bg-blue-400/50" />
            </div>

            <div className="absolute -top-2 -right-2 w-4 h-4 md:w-5 md:h-5 rounded-full border border-dashed border-gold-500/30" />
          </motion.div>
        </div>

        <div className="max-w-[1120px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[3px] rounded-full bg-blue-500" />
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('contact.section')}</p>
            </div>
            <h1 data-testid="contact-page-title" className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              {t('contact.title')}
            </h1>
            <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
              {t('contact.desc')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-5">
        <div className="max-w-[1120px] mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-12">

            {/* ═══ NEW CONTACT FORM ═══ */}
            <RevealOnScroll className="lg:col-span-3">
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 h-full">
                <h2 className="text-xl font-bold text-slate-900 mb-1">{t('contact.formTitle')}</h2>
                <p className="text-sm text-slate-500 mb-6">{t('contact.formDesc')}</p>

                {status.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-2 p-4 rounded-xl mb-6 text-sm ${
                      status.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
                    <span>{status.message}</span>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.name')} <span className="text-red-500">*</span></label>
                      <input type="text" name="name" value={fd.name} onChange={set} className={inputCls} placeholder={t('contact.namePh')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.email')} <span className="text-red-500">*</span></label>
                      <input type="email" name="email" value={fd.email} onChange={set} className={inputCls} placeholder={t('contact.emailPh')} />
                      {touched.email && fd.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email) && (
                        <p className="text-xs text-red-500 mt-1">{t('contact.emailError')}</p>
                      )}
                    </div>
                  </div>

                  {/* Studium */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.studium')} <span className="text-red-500">*</span></label>
                    <SelectWrap>
                      <select name="studium" value={fd.studium} onChange={set} className={selectCls(fd.studium)}>
                        <option value="" disabled>{t('contact.studiumPh')}</option>
                        {STUDIUM_OPTIONS.map(g => (
                          <optgroup key={g.group} label={t(`contact.studiumGroups.${g.group === 'Allgemein' ? 'allgemein' : g.group === 'Bachelor' ? 'bachelor' : g.group === 'Master' ? 'master' : g.group === 'MBA' ? 'mba' : 'universitaetslehrgaenge'}`)}>
                            {g.items.map(i => <option key={i} value={i}>{i}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </SelectWrap>
                  </div>

                  {/* Anliegen */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.anliegen')} <span className="text-red-500">*</span></label>
                    <SelectWrap>
                      <select name="anliegen" value={fd.anliegen} onChange={setAnliegen} className={selectCls(fd.anliegen)}>
                        <option value="" disabled>{t('contact.anliegenPh')}</option>
                        {anliegenOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </SelectWrap>
                  </div>

                  {/* Conditional sub-fields */}
                  {fd.anliegen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-100"
                    >
                      {/* Mitmachen */}
                      {isMitmachen && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.semester')} <span className="text-red-500">*</span></label>
                            <SelectWrap>
                              <select name="semester" value={fd.semester} onChange={set} className={selectCls(fd.semester)}>
                                <option value="" disabled>{t('contact.semesterPh')}</option>
                                {semesterOptions.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </SelectWrap>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.nachricht')} <span className="text-slate-400 font-normal">{t('contact.nachrichtOpt')}</span></label>
                            <textarea name="nachricht" value={fd.nachricht} onChange={set} rows={4}
                              className={`${inputCls} resize-none`} placeholder={t('contact.nachrichtPh')} />
                          </div>
                        </>
                      )}

                      {/* WhatsApp */}
                      {isWhatsApp && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.studienbestätigung')} <span className="text-red-500">*</span></label>
                          <p className="text-xs text-slate-500 mb-2">{t('contact.fileUploadDesc')}</p>
                          <div
                            onClick={() => !file && fileRef.current?.click()}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                              file ? 'border-green-300 bg-green-50'
                              : dragging ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                              : fileError ? 'border-red-300 bg-red-50'
                              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                            }`}
                          >
                            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onFile} className="hidden" />
                            {file ? (
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-green-700 min-w-0">
                                  {file.type === 'application/pdf' ? <FileText size={20} /> : <ImageIcon size={20} />}
                                  <span className="text-sm font-medium truncate">{file.name}</span>
                                  <span className="text-xs text-green-500 shrink-0">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                                </div>
                                <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }}
                                  className="p-1 rounded-lg hover:bg-green-100 text-green-600 transition-colors shrink-0">
                                  <X size={18} />
                                </button>
                              </div>
                            ) : (
                              <div className="text-slate-400">
                                <Upload size={24} className="mx-auto mb-2" />
                                <p className="text-sm font-medium">{t('contact.fileSelect')}</p>
                                <p className="text-xs mt-1">{t('contact.fileFormats')}</p>
                              </div>
                            )}
                          </div>
                          {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
                        </div>
                      )}

                      {/* LV Name field */}
                      {needsLvName && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.lvName')} <span className="text-red-500">*</span></label>
                          <input type="text" name="lvName" value={fd.lvName} onChange={set} className={inputCls} placeholder={t('contact.lvNamePh')} />
                        </div>
                      )}

                      {/* Problem mit Lehrenden */}
                      {isProblemLehrende && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.lehrpersonName')} <span className="text-red-500">*</span></label>
                            <input type="text" name="lehrpersonName" value={fd.lehrpersonName} onChange={set} className={inputCls} placeholder={t('contact.lehrpersonNamePh')} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('contact.lehrveranstaltung')} <span className="text-slate-400 font-normal">{t('contact.nachrichtOpt')}</span></label>
                            <input type="text" name="lehrveranstaltung" value={fd.lehrveranstaltung} onChange={set} className={inputCls} placeholder={t('contact.lehrveranstaltungPh')} />
                          </div>
                        </>
                      )}

                      {/* Description / Problem description */}
                      {needsDesc && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">{descLabel} <span className="text-red-500">*</span></label>
                          <textarea name="beschreibung" value={fd.beschreibung} onChange={set} rows={5}
                            className={`${inputCls} resize-none`} placeholder={descPlaceholder} />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Datenschutz */}
                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" name="datenschutz" checked={fd.datenschutz} onChange={set}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500 focus:ring-2 cursor-pointer" />
                      <span className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors">
                        {t('contact.datenschutz')} <span className="text-red-500">*</span>
                      </span>
                    </label>
                  </div>

                  {/* Processing info */}
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-600 leading-relaxed">
                      {t('contact.processingInfo')}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !valid()}
                    data-testid="contact-submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    {sending ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        {t('contact.sending')}
                      </>
                    ) : (
                      <><Send size={18} /> {t('contact.submit')}</>
                    )}
                  </button>
                </form>
              </div>
            </RevealOnScroll>

            {/* Contact Info Sidebar */}
            <RevealOnScroll delay={0.1} className="lg:col-span-2">
              <div className="space-y-4">

                {/* Quick Contact */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                  <h3 className="font-bold text-lg mb-4">{t('contact.directContact')}</h3>
                  <div className="space-y-3">
                    <a href="mailto:wirtschaft@oeh.jku.at" className="flex items-center gap-3 text-blue-100 hover:text-white transition-colors">
                      <Mail size={18} />
                      <span className="text-sm">wirtschaft@oeh.jku.at</span>
                    </a>
                    <div className="flex items-center gap-3 text-blue-100">
                      <MapPin size={18} />
                      <span className="text-sm">{t('contact.location')}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-white/20">
                    <p className="text-xs text-blue-200 uppercase tracking-wider mb-3">Social Media</p>
                    <div className="flex gap-3">
                      <a href="https://www.instagram.com/oeh_wirtschaft_wipaed/" target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <Instagram size={18} />
                      </a>
                      <a href="http://linkedin.com/company/wirtschaft-wipaed" target="_blank" rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <Linkedin size={18} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* ÖH JKU Link */}
                <a href="https://oeh.jku.at" target="_blank" rel="noopener noreferrer"
                  className="block bg-white rounded-2xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <Building size={18} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">ÖH JKU</p>
                        <p className="text-xs text-slate-400">{t('contact.hauptvertretung')}</p>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </a>

              </div>
            </RevealOnScroll>
          </div>

          {/* Sprechstunden Section */}
          <RevealOnScroll>
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Clock size={24} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{t('contact.sprechstunden')}</h2>
                  <p className="text-sm text-slate-500">{t('contact.sprechstundenSub')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[15px] text-slate-600 leading-relaxed mb-4">
                    {t('contact.sprechstundenDesc1')}
                  </p>
                  <p className="text-[15px] text-slate-600 leading-relaxed mb-4">
                    {t('contact.sprechstundenDesc2')}
                  </p>
                  <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 mb-5">
                    <p className="text-sm text-gold-700 font-medium flex items-center gap-2">
                      <AlertCircle size={16} />
                      {t('contact.sprechstundenWarning')}
                    </p>
                  </div>
                  <a
                    href="https://zeeg.me/wirtschaft"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="sprechstunde-btn"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-full transition-all hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    <Calendar size={16} /> {t('contact.sprechstundenBtn')} <ArrowUpRight size={14} />
                  </a>
                </div>

                <div className="bg-slate-50 rounded-xl p-5">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageCircle size={18} className="text-blue-500" />
                    {t('contact.whatWeCanDo')}
                  </h4>
                  <ul className="space-y-2.5">
                    {t('contact.servicesList', { returnObjects: true }).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          {/* WhatsApp Community */}
          <RevealOnScroll delay={0.05}>
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <MessageCircle size={24} className="text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{t('contact.whatsapp')}</h2>
                  <p className="text-sm text-slate-500">{t('contact.whatsappSub')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[15px] text-slate-600 leading-relaxed mb-3">
                    {t('contact.whatsappDesc1')}
                  </p>
                  <p className="text-[15px] text-slate-600 leading-relaxed">
                    {t('contact.whatsappDesc2')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t('contact.whatsappJoinTitle')}</p>
                    <p className="text-xs text-slate-500">
                      {t('contact.whatsappJoinDesc')}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-1">{t('contact.whatsappFreshmenTitle')}</p>
                    <p className="text-xs text-slate-500">
                      {t('contact.whatsappFreshmenDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>

          <Marquee
            items={t('contact.marquee', { returnObjects: true })}
            variant="subtle"
            speed={34}
            className="rounded-2xl mb-6"
          />

          {/* FAQ Section */}
          <RevealOnScroll delay={0.15}>
            <div data-testid="faq-section" className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <HelpCircle size={24} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{t('contact.faq')}</h2>
                  <p className="text-sm text-slate-500">{t('contact.faqSub')}</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {faq.map((item, i) => <FaqAcc key={i} q={item.q} a={item.a} testId={`faq-${i}`}/>)}
              </div>
            </div>
          </RevealOnScroll>

        </div>
      </section>

    </motion.div>
  );
}
