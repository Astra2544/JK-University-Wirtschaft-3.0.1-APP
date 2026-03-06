/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  OEHLI KNOWLEDGE BASE | OeH Wirtschaft Website
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  BESCHREIBUNG:
 *  Wissensdatenbank fuer den OEHli Chatbot.
 *  Enthaelt alle Antworten, Keywords und Buttons.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ═══════════════════════════════════════════════════════════════════════════
 */

const knowledge = {
  greeting: {
    keywords: ['hallo', 'hi', 'hey', 'servus', 'moin', 'grüß', 'guten tag', 'guten morgen', 'guten abend', 'grüezi', 'howdy', 'hello'],
    response: 'Hallo! Ich bin ÖHli, dein digitaler Assistent der ÖH Wirtschaft. Wie kann ich dir helfen?',
    buttons: [
      { label: 'Was ist die ÖH Wirtschaft?', query: 'was ist die öh wirtschaft' },
      { label: 'Studiengänge', query: 'welche studiengänge' },
      { label: 'Kontakt', query: 'kontakt' },
    ],
  },

  categories: [
    {
      id: 'about',
      keywords: ['öh wirtschaft', 'studienvertretung', 'stv', 'wer seid ihr', 'was macht ihr', 'was ist die öh', 'über euch', 'über uns', 'was seid ihr', 'was tut ihr', 'wer sind', 'organisation'],
      response: 'Die ÖH Wirtschaft ist deine offiziell gewählte Studienvertretung für alle wirtschaftlichen Studiengänge an der JKU Linz. Wir setzen uns für deine Interessen ein, vertreten dich gegenüber Professor:innen und der Uni-Leitung, und bieten dir zahlreiche Services wie Studienberatung, Studienplaner und Veranstaltungen. Unser Team besteht aus über 14 ehrenamtlichen Mitgliedern.',
      buttons: [
        { label: 'Team ansehen', link: '/team' },
        { label: 'Services', query: 'welche services' },
        { label: 'Mitmachen', query: 'mitmachen' },
      ],
    },
    {
      id: 'team',
      keywords: ['team', 'mitglieder', 'wer ist im team', 'vorsitzender', 'vorstand', 'leitung', 'pilsner', 'maximilian'],
      response: 'Unser Team wird von Maximilian Pilsner als Vorsitzendem geleitet. Die Bereichsleitung besteht aus: Lucia Schoisswohl (Medien), Stefan Gstöttenmayer (Events), Sebastian Jensen (Internationals) und Carolina Götsch (Social Media). Insgesamt sind wir über 30 engagierte Studierende, die sich ehrenamtlich für dich einsetzen!',
      buttons: [
        { label: 'Team-Seite', link: '/team' },
        { label: 'Mitmachen', query: 'mitmachen' },
        { label: 'Kontakt', query: 'kontakt' },
      ],
    },
    {
      id: 'join',
      keywords: ['mitmachen', 'beitreten', 'teil des teams', 'mitglied werden', 'engagement', 'ehrenamt', 'mitarbeiten', 'dabei sein'],
      response: 'Du willst mitmachen? Das freut uns! Als Teil unseres Teams bekommst du: ECTS pro aktivem Semester, darfst bei Curricula und Prüfungsregelungen mitreden, kannst eigene Projekte mit Budget umsetzen, erhältst einen Karriere-Boost für deinen CV und baust echte Skills auf. Schreib uns einfach über das Kontaktformular!',
      buttons: [
        { label: 'Kontaktformular', link: '/contact' },
        { label: 'Team ansehen', link: '/team' },
        { label: 'Vorteile', query: 'vorteile mitmachen' },
      ],
    },
    {
      id: 'join_benefits',
      keywords: ['vorteile mitmachen', 'warum mitmachen', 'ects ehrenamt', 'vorteile öh'],
      response: 'Vorteile als ÖH-Mitglied:\n\n- ECTS pro aktivem Semester (ohne Klausur!)\n- Mitsprache bei Curricula und Prüfungsregelungen\n- Eigene Projekte mit Budget umsetzen\n- Karriere-Plus: Tätigkeitsbericht für CV/LinkedIn\n- Skills: Projektmanagement, Verhandeln, Teamführung\n- ÖH E-Mail-Adresse, Zugang zu Räumen und Ressourcen\n- Flexible Arbeit, Prüfungsphasen werden berücksichtigt\n\nFun Fact: Ehrenamtliche erhalten 45% mehr Interview-Rückmeldungen!',
      buttons: [
        { label: 'Jetzt mitmachen', link: '/contact' },
        { label: 'Team ansehen', link: '/team' },
      ],
    },
    {
      id: 'programs',
      keywords: ['studiengänge', 'studiengang', 'programme', 'studium', 'bachelor', 'master', 'was kann ich studieren', 'welche studien', 'studienangebot', 'studienrichtung'],
      response: 'Die ÖH Wirtschaft vertritt folgende Studiengänge:\n\nBachelor:\n- BSc. Wirtschaftswissenschaften (WiWi)\n- BSc. Betriebswirtschaftslehre (BWL)\n- BSc. International Business Administration (IBA)\n- BSc. (CE) Finance Banking und Digitalisierung\n\nMaster:\n- MSc. Digital Business Management\n- MSc. Economic and Business Analytics\n- MSc. Economics\n- MSc. Finance and Accounting\n- MSc. Management\n- MSc. General Management (Double Degree)\n- MSc. Global Business\n- MSc. Leadership and Innovation in Organizations\n\nDazu kommen MBA-Programme und Universitätslehrgänge.',
      buttons: [
        { label: 'Studium-Seite', link: '/studium' },
        { label: 'Studienplaner', link: '/studienplaner' },
        { label: 'MBA & ULG', query: 'mba ulg' },
      ],
    },
    {
      id: 'mba_ulg',
      keywords: ['mba', 'ulg', 'universitätslehrgang', 'executive', 'weiterbildung', 'health care'],
      response: 'Neben Bachelor- und Masterprogrammen vertreten wir auch:\n\nMBA:\n- MBA Global Executive MBA\n- MBA Executive MBA Management & Leadership\n- MBA Management und Leadership für Frauen\n- MBA Health Care Management\n\nUniversitätslehrgänge:\n- ULG Versicherungswirtschaft\n- ULG Tourismusmanagement\n- ULG Applied Business Excellence',
      buttons: [
        { label: 'Studium-Seite', link: '/studium' },
        { label: 'Alle Studiengänge', query: 'studiengänge' },
      ],
    },
    {
      id: 'studienplaner',
      keywords: ['studienplaner', 'planer', 'curriculum', 'studienplan', 'pflichtfächer', 'spezialisierung', 'ects'],
      response: 'Wir haben drei Studienplaner als digitale Flip-Books erstellt:\n\n1. Wirtschaftswissenschaften (WiWi) -- Alle Pflichtfächer, Spezialisierungen und ECTS-Infos\n2. Betriebswirtschaftslehre (BWL) -- Von den Grundlagen bis zur Spezialisierung\n3. International Business Administration (IBA) -- Internationales Management und globale Perspektiven\n\nGedruckte Versionen gibt es bei unseren Sprechstunden oder am ÖH-Broschürenständer im Keplergebäude.',
      buttons: [
        { label: 'Studienplaner öffnen', link: '/studienplaner' },
        { label: 'Sprechstunden', query: 'sprechstunden' },
      ],
    },
    {
      id: 'contact',
      keywords: ['kontakt', 'erreichen', 'schreiben', 'email', 'e-mail', 'mail', 'ansprechpartner', 'erreichbarkeit'],
      response: 'Du kannst uns so erreichen:\n\n- E-Mail: wirtschaft@oeh.jku.at\n- Instagram: @oeh_wirtschaft_wipaed\n- LinkedIn: linkedin.com/company/wirtschaft-wipaed\n- Standort: Keplergebäude, JKU Linz\n\nOder nutze unser Kontaktformular auf der Website. Die Bearbeitung dauert üblicherweise bis zu zwei Tage.',
      buttons: [
        { label: 'Kontaktformular', link: '/contact' },
        { label: 'Sprechstunden', query: 'sprechstunden' },
        { label: 'WhatsApp-Community', query: 'whatsapp' },
      ],
    },
    {
      id: 'sprechstunden',
      keywords: ['sprechstunde', 'sprechstunden', 'beratung', 'termin', 'buchen', 'persönlich', 'vor ort', 'beratungstermin'],
      response: 'Du kannst dir ganz bequem einen Termin für eine Sprechstunde buchen -- vor Ort im Keplergebäude oder online via Zoom. Buchung bis 24 Stunden vorher möglich. Die Beratung ist kostenlos, da wir alle ehrenamtlich arbeiten.\n\nWichtig: In der vorlesungsfreien Zeit finden keine Sprechstunden statt!',
      buttons: [
        { label: 'Kontakt-Seite', link: '/contact' },
        { label: 'Services', query: 'welche services' },
      ],
    },
    {
      id: 'services',
      keywords: ['services', 'service', 'hilfe', 'unterstützung', 'was bietet ihr', 'welche services', 'angebot', 'leistungen'],
      response: 'Was wir für dich tun können:\n\n- Fragen zu Prüfungen und Anmeldungen\n- Studienplanung und Kurswahl\n- Probleme mit Professor:innen\n- Anrechnungen und Studienwechsel\n- Stipendien und Förderungen\n- Allgemeine Studienberatung\n- WhatsApp-Community zum Vernetzen\n- Studienplaner für WiWi, BWL und IBA\n- LVA-Bewertungen (anonym)\n- Veranstaltungen und Events',
      buttons: [
        { label: 'Kontaktformular', link: '/contact' },
        { label: 'LVA-Bewertungen', link: '/lva' },
        { label: 'Kalender', link: '/kalender' },
      ],
    },
    {
      id: 'whatsapp',
      keywords: ['whatsapp', 'community', 'gruppe', 'chat', 'vernetzen', 'austausch', 'studiengruppe'],
      response: 'Wir betreiben eine WhatsApp-Community für alle wirtschaftswissenschaftlichen Studiengänge. Dort kannst du dich mit Kolleg:innen vernetzen, Fragen stellen und wichtige Infos zu Studium, Prüfungen und Events erhalten.\n\nBeitritt: Schreib eine kurze Nachricht an wirtschaft@oeh.jku.at mit deiner Inskriptionsbestätigung.\n\nErstsemestrige erhalten den Einladungslink automatisch per E-Mail vor Semesterbeginn.',
      buttons: [
        { label: 'Kontakt-Seite', link: '/contact' },
        { label: 'Kontakt per E-Mail', query: 'kontakt' },
      ],
    },
    {
      id: 'lva',
      keywords: ['lva', 'lehrveranstaltung', 'bewertung', 'bewerten', 'kurs bewerten', 'vorlesung', 'kurs rating', 'aufwand', 'schwierigkeit'],
      response: 'Mit unserem LVA-Bewertungstool kannst du Lehrveranstaltungen anonym bewerten und Bewertungen anderer einsehen. So funktioniert es:\n\n1. Verifiziere dich mit deiner @students.jku.at E-Mail\n2. Du erhältst einen 5-stelligen Code per Mail\n3. Bewerte Aufwand und Schwierigkeit (1-5)\n\nAlles ist 100% anonym -- deine E-Mail wird nicht gespeichert! Über 100 LVAs sind bereits im System. Fehlt eine? Melde dich bei wirtschaft@oeh.jku.at.',
      buttons: [
        { label: 'Zu den LVAs', link: '/lva' },
        { label: 'Top 10 LVAs', query: 'top lvas' },
      ],
    },
    {
      id: 'top_lvas',
      keywords: ['top lvas', 'beste lvas', 'beliebteste', 'empfehlung lva', 'welche lva'],
      response: 'Die Top 10 LVAs findest du direkt auf unserer LVA-Seite. Dort siehst du die am besten bewerteten Lehrveranstaltungen mit Durchschnittsnoten für Aufwand und Schwierigkeit. Nutze auch die Suchfunktion, um unter über 100 LVAs die richtige für dich zu finden!',
      buttons: [
        { label: 'LVA-Seite öffnen', link: '/lva' },
      ],
    },
    {
      id: 'news',
      keywords: ['news', 'neuigkeiten', 'ankündigungen', 'aktuell', 'was gibt es neues', 'neuig', 'update'],
      response: 'Auf unserer News-Seite findest du alle aktuellen Ankündigungen, wichtige Informationen und Neuigkeiten rund um dein Studium. Du kannst nach Priorität filtern: Dringend, Wichtig, Normal oder Info.',
      buttons: [
        { label: 'News lesen', link: '/news' },
        { label: 'Kalender', link: '/kalender' },
      ],
    },
    {
      id: 'kalender',
      keywords: ['kalender', 'events', 'veranstaltung', 'veranstaltungen', 'termine', 'event', 'wann', 'party', 'workshop'],
      response: 'In unserem Kalender findest du alle wichtigen Termine und Events der ÖH Wirtschaft. Du kannst nach Monat navigieren, Tags filtern und Events direkt anklicken für Details. Es gibt eine Monats- und eine Listenansicht.\n\nTipp: Du kannst unseren Kalender auch direkt abonnieren (Apple, Google, Outlook) -- so verpasst du kein Event mehr!',
      buttons: [
        { label: 'Kalender öffnen', link: '/kalender' },
        { label: 'Kalender abonnieren', query: 'kalender abonnieren' },
      ],
    },
    {
      id: 'calendar_subscribe',
      keywords: ['kalender abonnieren', 'kalender importieren', 'ical', 'kalender sync', 'google kalender', 'apple kalender'],
      response: 'Du kannst unseren ÖH Wirtschaft Kalender ganz einfach abonnieren für automatische Synchronisation:\n\n- Apple Kalender\n- Google Kalender\n- Outlook\n- Yahoo\n- Office 365\n\nDie Links dafür findest du auf unserer Kontakt-Seite unter "Kalender abonnieren".',
      buttons: [
        { label: 'Kontakt-Seite', link: '/contact' },
        { label: 'Kalender', link: '/kalender' },
      ],
    },
    {
      id: 'magazine',
      keywords: ['magazin', 'magazine', 'ceteris paribus', 'zeitschrift', 'journal', 'beitrag', 'artikel'],
      response: 'Ceteris Paribus ist unsere Zeitschrift, die Stimmen aus Studium, Forschung und Praxis der Wirtschaftswelt vereint. Du kannst auch selbst mitmachen!\n\nWer? Alle -- Studierende, Lehrende, Mitarbeitende, Partner. Kostenlos.\nWas? Analysen, Kommentare, Interviews, Kolumnen, ca. 3.000 Zeichen, Deutsch oder Englisch.\nWie? Per Formular einreichen. Rückmeldung innerhalb von 2 Wochen.\n\nDein Urheberrecht bleibt bei dir.',
      buttons: [
        { label: 'Magazin ansehen', link: '/magazine' },
        { label: 'Mitmachen', link: '/contact' },
      ],
    },
    {
      id: 'calculator',
      keywords: ['taschenrechner', 'rechner', 'prüfung hilfsmittel', 'welcher taschenrechner'],
      response: 'Für das Wirtschaftsstudium empfehlen wir den Texas Instruments TI-82 (oder TI-84). Grafikfähige Taschenrechner sind bei vielen Prüfungen erlaubt und sehr hilfreich, besonders in Mathematik, Statistik und quantitativen Fächern. Achte auf die Angaben der jeweiligen Lehrveranstaltung, welche Hilfsmittel erlaubt sind.',
      buttons: [
        { label: 'FAQ ansehen', link: '/contact' },
      ],
    },
    {
      id: 'books',
      keywords: ['bücher', 'buch', 'lehrbuch', 'skripten', 'skript', 'kaufen', 'ausleihen', 'bibliothek', 'bücherbörse'],
      response: 'Zum Thema Bücher und Skripten:\n\n- Bücher ausleihen: JKU Bibliothek (kostenlos mit Studierendenausweis)\n- Bücher kaufen: ÖH JKU Shop (oeh-jku-shop.myshopify.com)\n- Bücher verkaufen: ÖH Bücherbörse auf oeh.jku.at\n\nTipp: Viele Materialien findest du auch digital in der Bibliothek.',
      buttons: [
        { label: 'FAQ ansehen', link: '/contact' },
      ],
    },
    {
      id: 'thesis',
      keywords: ['bachelorarbeit', 'masterarbeit', 'abschlussarbeit', 'thesis', 'wissenschaftliche arbeit', 'diplomarbeit'],
      response: 'Informationen zur Bachelor-/Masterarbeit findest du in den Studienplanern und in den jeweiligen Studienrichtungscurricula. Bei konkreten Fragen zur Abschlussarbeit (z.B. Betreuer:innen-Wahl, Anmeldung, formale Anforderungen) helfen wir dir gerne in einer Sprechstunde oder per Kontaktformular weiter.',
      buttons: [
        { label: 'Studienplaner', link: '/studienplaner' },
        { label: 'Kontaktformular', link: '/contact' },
      ],
    },
    {
      id: 'exams',
      keywords: ['prüfung', 'prüfungen', 'prüfungsantritt', 'antritte', 'antritt', 'steop', 'durchgefallen', 'nicht bestanden', 'wiederholung', 'prüfungsordnung'],
      response: 'Wichtige Infos zu Prüfungen:\n\n- Du hast insgesamt 5 Prüfungsantritte pro Lehrveranstaltung\n- Bei STEOP-Fächern sind es max. 4 Antritte\n- Der 4. und 5. Antritt sind "kommissionell" (vor einer Prüfungskommission)\n- Melde dich rechtzeitig über KUSSS zu Prüfungen an und ab!\n\nBei Problemen mit Prüfungen oder Lehrenden kannst du dich jederzeit an uns wenden.',
      buttons: [
        { label: 'Kontaktformular', link: '/contact' },
        { label: 'FAQ ansehen', link: '/contact' },
      ],
    },
    {
      id: 'stipendium',
      keywords: ['stipendium', 'stipendien', 'studienbeihilfe', 'förderung', 'geld', 'finanzierung', 'beihilfe', 'soziales'],
      response: 'Zum Thema Stipendien und Förderungen:\n\n- Studienbeihilfe: Antrag bei der Studienbeihilfenbehörde (stipendium.at)\n- Leistungsstipendien der JKU\n- Förderungen durch die ÖH JKU (Sozialreferat)\n- Weitere Stipendien und Förderquellen\n\nBei Fragen zur Studienbeihilfe oder Förderungen empfehlen wir das Sozialreferat der ÖH JKU oder unsere Sprechstunden.',
      buttons: [
        { label: 'Kontakt', link: '/contact' },
        { label: 'ÖH JKU', query: 'öh jku' },
      ],
    },
    {
      id: 'electives',
      keywords: ['freie studienleistung', 'wahlfach', 'wahlfächer', 'freifach', 'freie wahlfächer', 'freie lv'],
      response: 'Freie Studienleistungen sind Lehrveranstaltungen, die du frei aus dem gesamten Angebot der JKU (und teilweise anderer Unis) wählen kannst. Sie geben dir die Möglichkeit, deinen Studienplan individuell zu gestalten -- z.B. Sprachen, Soft Skills oder fachfremde Kurse. Details findest du in deinem Curriculum und im Studienplaner.',
      buttons: [
        { label: 'Studienplaner', link: '/studienplaner' },
        { label: 'Studium-Seite', link: '/studium' },
      ],
    },
    {
      id: 'usi',
      keywords: ['usi', 'sport', 'unisport', 'sportkurs', 'fitness'],
      response: 'Die JKU bietet über das USI (Universitätssportinstitut) eine Vielzahl an Sportkursen an -- von Fitness über Yoga bis hin zu Ballsportarten. Die Kurse sind sehr günstig und ideal, um neben dem Studium aktiv zu bleiben. Anmeldung erfolgt über das USI-Portal zu Semesterbeginn. Tipp: Schnell sein, beliebte Kurse sind schnell voll!',
      buttons: [
        { label: 'FAQ ansehen', link: '/contact' },
      ],
    },
    {
      id: 'exchange',
      keywords: ['auslandssemester', 'ausland', 'erasmus', 'exchange', 'internationales', 'auslandsstudium', 'semester abroad'],
      response: 'Ein Auslandssemester ist eine tolle Möglichkeit! Über das JKU International Center kannst du dich für Programme wie Erasmus+ bewerben. Unser Bereichsleiter für Internationals, Sebastian Jensen, und sein Team unterstützen dich gerne bei Fragen rund um Auslandsaufenthalte in wirtschaftlichen Studiengängen.\n\nTipp: Informiere dich frühzeitig (mind. ein Semester vorher)!',
      buttons: [
        { label: 'Kontaktformular', link: '/contact' },
        { label: 'Team', link: '/team' },
      ],
    },
    {
      id: 'microsoft',
      keywords: ['microsoft', 'office', 'word', 'excel', 'powerpoint', 'microsoft 365', 'office 365', 'software', 'lizenz'],
      response: 'Als JKU-Studierende:r erhältst du Microsoft 365 kostenlos! Das beinhaltet Word, Excel, PowerPoint, OneNote, Teams und mehr. Aktiviere deinen Account über die JKU IT-Services mit deiner Studierenden-E-Mail.',
      buttons: [
        { label: 'FAQ ansehen', link: '/contact' },
      ],
    },
    {
      id: 'zoom',
      keywords: ['zoom', 'video', 'videokonferenz', 'online vorlesung'],
      response: 'Alle JKU-Studierenden haben Zugang zu einer kostenlosen Zoom-Campuslizenz. Damit kannst du an Online-Vorlesungen teilnehmen und eigene Meetings hosten. Zugang über die JKU IT-Services.',
      buttons: [
        { label: 'FAQ ansehen', link: '/contact' },
      ],
    },
    {
      id: 'campus',
      keywords: ['campus', 'anfahrt', 'weg zur jku', 'wie komme ich', 'bus', 'straßenbahn', 'parken', 'parkplatz', 'auto', 'fahrrad', 'öffis'],
      response: 'Die JKU liegt im Stadtteil Auhof in Linz:\n\nAdresse: Altenberger Straße 69, 4040 Linz\n\nAnfahrt:\n- Straßenbahn/Bus: Mehrere Linien fahren direkt zur JKU (Haltestelle "JKU/Universität")\n- Auto: Parkplätze am Campus verfügbar (teils kostenpflichtig)\n- Fahrrad: Fahrradstellplätze vorhanden\n\nAuf dem Campus sind alle wichtigen Gebäude nah beieinander -- kurze Wege garantiert!',
      buttons: [
        { label: 'FAQ ansehen', link: '/contact' },
        { label: 'JKU Info', query: 'was ist jku' },
      ],
    },
    {
      id: 'jku',
      keywords: ['jku', 'johannes kepler', 'universität linz', 'uni linz', 'was ist jku', 'über jku', 'kepler uni'],
      response: 'Die Johannes-Kepler-Universität Linz (JKU) ist eine öffentliche Universität in Linz, Oberösterreich. Sie bietet rund 100 Studienprogramme in den Bereichen Wirtschaft, Recht, Technik, Naturwissenschaften, Medizin, Sozialwissenschaften und mehr.\n\nCampus: JKU Campus Auhof (Hauptcampus) + JKU MED Campus\nAdresse: Altenberger Straße 69, 4040 Linz\nTelefon: +43 732 2468 0\n\nWichtige Systeme: KUSSS (Kursanmeldung), JKU Bibliothek, USI (Unisport)',
      buttons: [
        { label: 'JKU Studienangebot', query: 'jku studien' },
        { label: 'ÖH JKU', query: 'öh jku' },
        { label: 'Campus & Anfahrt', query: 'campus' },
      ],
    },
    {
      id: 'jku_programs',
      keywords: ['jku studien', 'jku studienangebot', 'alle studien jku', 'was kann man an jku studieren'],
      response: 'Die JKU bietet ein breites Studienangebot:\n\nBachelor: u.a. Artificial Intelligence, BWL, WiWi, IBA, Informatik, Wirtschaftsinformatik, Wirtschaftsrecht, Mechatronik, Maschinenbau, Statistik, Soziologie, Technische Mathematik, Humanmedizin, und viele mehr.\n\nMaster: u.a. Digital Business Management, Economics, Finance and Accounting, Management, Computer Science, AI, Global Business, Polymer Engineering, Psychologie, und viele weitere.\n\nPlus Diplomstudien, MBA-Programme, Universitätslehrgänge und Doktoratsprogramme.',
      buttons: [
        { label: 'Unsere Studiengänge', query: 'studiengänge' },
        { label: 'Studienplaner', link: '/studienplaner' },
      ],
    },
    {
      id: 'oeh_jku',
      keywords: ['öh jku', 'hochschülerschaft', 'hochschülerinnenschaft', 'öh linz', 'studentenvertretung jku'],
      response: 'Die ÖH JKU ist die Hochschüler:innenschaft an der Johannes-Kepler-Universität Linz -- die übergeordnete Studierendenvertretung.\n\nSie bietet:\n- Jobbörse, Wohnungsbörse, Bücherbörse\n- ÖH-Versicherung\n- Sozialreferat (finanzielle Unterstützung)\n- Beratung zu verschiedenen Themen\n- ÖH Shop für Merchandise und Materialien\n- Uni-Tutor Partnerprogramm\n\nKontakt: oeh@oeh.jku.at, Tel: 0732 2468 5950\nWebsite: oeh.jku.at\n\nWir als ÖH Wirtschaft sind die Studienvertretung für Wirtschaft innerhalb der ÖH JKU.',
      buttons: [
        { label: 'ÖH Wirtschaft', query: 'was ist die öh wirtschaft' },
        { label: 'Kontakt', query: 'kontakt' },
      ],
    },
    {
      id: 'kusss',
      keywords: ['kusss', 'kursanmeldung', 'anmeldung', 'inskription', 'einschreibung', 'registrierung'],
      response: 'KUSSS ist das zentrale Kurs- und Seminarverwaltungssystem der JKU. Darüber meldest du dich für Lehrveranstaltungen und Prüfungen an, siehst deine Noten und verwaltest deinen Studienstatus. Zugang über kusss.jku.at mit deinem JKU-Account.',
      buttons: [
        { label: 'Studienplaner', link: '/studienplaner' },
        { label: 'Prüfungen Info', query: 'prüfung' },
      ],
    },
    {
      id: 'mensa',
      keywords: ['mensa', 'essen', 'mittagessen', 'kantin', 'cafeteria', 'hunger'],
      response: 'Auf dem JKU Campus gibt es die Mensa und verschiedene Cafeterien, wo du günstig essen kannst. Mit dem Studierendenausweis bekommst du vergünstigte Preise. Außerdem gibt es ein Café im Keplergebäude und weitere Essenmöglichkeiten in der Nähe des Campus.',
      buttons: [
        { label: 'Campus Info', query: 'campus' },
      ],
    },
    {
      id: 'library',
      keywords: ['bibliothek', 'library', 'lernplatz', 'lernen', 'lernraum', 'lernzone'],
      response: 'Die JKU Bibliothek ist dein Anlaufpunkt für Fachliteratur, Lernplätze und digitale Ressourcen. Mit deinem Studierendenausweis kannst du kostenlos Bücher ausleihen und die Lernzonen nutzen. Die Bibliothek befindet sich zentral am Campus und bietet auch zahlreiche Online-Datenbanken und E-Journals.',
      buttons: [
        { label: 'Bücher Info', query: 'bücher' },
        { label: 'Campus', query: 'campus' },
      ],
    },
    {
      id: 'impressum',
      keywords: ['impressum', 'rechtlich', 'wem gehört', 'betreiber'],
      response: 'Impressum:\nHochschülerinnen- und Hochschülerschaft an der Johannes-Kepler-Universität Linz -- Studienvertretung Wirtschaftswissenschaften.\n\nDie ÖH Wirtschaft ist ein Organ der Hochschülerinnen- und Hochschülerschaft an der JKU Linz.',
      buttons: [
        { label: 'Impressum', link: '/impressum' },
        { label: 'Datenschutz', link: '/datenschutz' },
      ],
    },
    {
      id: 'datenschutz',
      keywords: ['datenschutz', 'privacy', 'daten', 'dsgvo', 'persönliche daten'],
      response: 'Der Schutz deiner Daten ist uns wichtig. Da wir Teil der ÖH JKU-Infrastruktur sind, gilt die zentrale Datenschutzerklärung der ÖH JKU. Details zu Datenverarbeitung, deinen Rechten und Kontakt zu Datenschutzbeauftragten findest du auf unserer Datenschutz-Seite.',
      buttons: [
        { label: 'Datenschutz', link: '/datenschutz' },
        { label: 'Impressum', link: '/impressum' },
      ],
    },
    {
      id: 'website_nav',
      keywords: ['website', 'seite', 'seiten', 'navigation', 'was gibt es', 'wo finde ich', 'überblick', 'übersicht', 'sitemap'],
      response: 'Hier ein Überblick über unsere Website:\n\n- Home -- Startseite mit allen wichtigen Infos\n- News -- Aktuelle Ankündigungen und Neuigkeiten\n- Kalender -- Alle Events und Termine\n- Team -- Unsere Mitglieder und Ansprechpartner\n- Studium -- Studiengänge und aktuelle Updates\n- LVA -- Lehrveranstaltungs-Bewertungen (anonym)\n- Studienplaner -- Digitale Planer für WiWi, BWL, IBA\n- Ceteris Paribus -- Unser Magazin\n- Kontakt -- Formular, Sprechstunden, FAQ, WhatsApp',
      buttons: [
        { label: 'Startseite', link: '/' },
        { label: 'Kontakt & FAQ', link: '/contact' },
        { label: 'Studiengänge', query: 'studiengänge' },
      ],
    },
    {
      id: 'wiwi',
      keywords: ['wiwi', 'wirtschaftswissenschaften', 'bsc wiwi'],
      response: 'Der BSc. Wirtschaftswissenschaften (WiWi) ist ein breit angelegter Bachelor, der dir Einblicke in verschiedene wirtschaftliche Disziplinen gibt. Er kombiniert VWL, BWL, Recht und quantitative Methoden. Ideal, wenn du dich noch nicht auf eine Richtung festlegen willst.\n\nUnser Studienplaner für WiWi enthält alle Pflichtfächer, Spezialisierungen und ECTS-Infos.',
      buttons: [
        { label: 'WiWi Studienplaner', link: '/studienplaner' },
        { label: 'Alle Studiengänge', query: 'studiengänge' },
      ],
    },
    {
      id: 'bwl',
      keywords: ['bwl', 'betriebswirtschaft', 'betriebswirtschaftslehre'],
      response: 'Der BSc. Betriebswirtschaftslehre (BWL) fokussiert auf die Führung und Organisation von Unternehmen. Von Grundlagen wie Rechnungswesen und Marketing bis hin zu Spezialisierungen in Finance, Management oder Marketing.\n\nUnser BWL-Studienplaner führt dich von den Grundlagen bis zur Spezialisierung.',
      buttons: [
        { label: 'BWL Studienplaner', link: '/studienplaner' },
        { label: 'Alle Studiengänge', query: 'studiengänge' },
      ],
    },
    {
      id: 'iba',
      keywords: ['iba', 'international business', 'international business administration', 'internationales'],
      response: 'Der BSc. International Business Administration (IBA) bietet internationales Management mit globalen Perspektiven. Der Studiengang ist teilweise auf Englisch und bereitet dich auf eine internationale Karriere vor.\n\nUnser IBA-Studienplaner gibt dir den kompletten Überblick.',
      buttons: [
        { label: 'IBA Studienplaner', link: '/studienplaner' },
        { label: 'Auslandssemester', query: 'auslandssemester' },
      ],
    },
    {
      id: 'finance_banking',
      keywords: ['finance banking', 'digitalisierung', 'fintech', 'ce finance'],
      response: 'Der BSc. (CE) Finance Banking und Digitalisierung verbindet Finanzwirtschaft mit modernen digitalen Technologien. Ein zukunftsorientierter Studiengang für alle, die sich für FinTech, Digital Banking und die Digitalisierung der Finanzbranche interessieren.',
      buttons: [
        { label: 'Studium-Seite', link: '/studium' },
        { label: 'Alle Studiengänge', query: 'studiengänge' },
      ],
    },
    {
      id: 'erstsemester',
      keywords: ['erstsemester', 'ersti', 'anfänger', 'neues semester', 'studienbeginn', 'start', 'erster tag', 'neu an der jku', 'erstes semester', 'studienanfänger'],
      response: 'Willkommen an der JKU! Hier die wichtigsten Tipps für Erstsemestrige:\n\n1. KUSSS-Account einrichten und LVAs anmelden\n2. Studienplaner durchgehen (findest du bei uns!)\n3. WhatsApp-Community beitreten\n4. STEOP-Fächer priorisieren\n5. Sprechstunde bei uns buchen für persönliche Beratung\n6. Microsoft 365 aktivieren (kostenlos!)\n7. USI-Sportkurse checken\n8. Mensa-Karte holen\n\nWir begleiten dich durch dein erstes Semester!',
      buttons: [
        { label: 'Studienplaner', link: '/studienplaner' },
        { label: 'WhatsApp beitreten', query: 'whatsapp' },
        { label: 'Sprechstunde buchen', query: 'sprechstunden' },
      ],
    },
    {
      id: 'steop',
      keywords: ['steop', 'studieneingangsphase', 'eingangsphase', 'pflichtfächer anfang'],
      response: 'Die STEOP (Studieneingangs- und Orientierungsphase) umfasst die Pflichtfächer im ersten Semester. Wichtig: STEOP-Prüfungen haben max. 4 Antritte (statt der üblichen 5). Erst nach Abschluss der STEOP kannst du weiterführende LVAs absolvieren. Welche Fächer zur STEOP gehören, findest du in deinem Curriculum und unserem Studienplaner.',
      buttons: [
        { label: 'Studienplaner', link: '/studienplaner' },
        { label: 'Prüfungen', query: 'prüfung' },
      ],
    },
    {
      id: 'help_general',
      keywords: ['hilfe', 'problem', 'ich brauche hilfe', 'nicht weiter', 'frage', 'unterstützung'],
      response: 'Kein Problem, dafür bin ich da! Was genau brauchst du Hilfe bei?\n\nHier ein paar häufige Themen:',
      buttons: [
        { label: 'Studium & Kurse', query: 'services' },
        { label: 'Prüfungen', query: 'prüfung' },
        { label: 'Kontaktformular', link: '/contact' },
        { label: 'Sprechstunde buchen', query: 'sprechstunden' },
      ],
    },
    {
      id: 'danke',
      keywords: ['danke', 'dankeschön', 'vielen dank', 'thx', 'thanks', 'merci', 'toll', 'super', 'perfekt', 'passt', 'alles klar'],
      response: 'Gerne! Wenn du noch Fragen hast, bin ich jederzeit hier. Viel Erfolg im Studium!',
      buttons: [
        { label: 'Noch eine Frage', query: 'hilfe' },
        { label: 'Startseite', link: '/' },
      ],
    },
    {
      id: 'bye',
      keywords: ['tschüss', 'bye', 'ciao', 'auf wiedersehen', 'bis dann', 'bis bald', 'pfiat di'],
      response: 'Bis bald! Wenn du wieder Fragen hast, bin ich jederzeit hier. Alles Gute!',
      buttons: [],
    },
    {
      id: 'fun',
      keywords: ['witz', 'spaß', 'witzig', 'lustig', 'humor', 'lachen'],
      response: 'Hier ein kleiner Studenten-Witz: Warum trinken Wirtschaftsstudenten so viel Kaffee? Weil ohne Liquidität nichts läuft! Aber jetzt mal im Ernst -- kann ich dir bei etwas helfen?',
      buttons: [
        { label: 'Ja, ich hab eine Frage', query: 'hilfe' },
        { label: 'Nein, danke!', query: 'danke' },
      ],
    },
    {
      id: 'anrechnung',
      keywords: ['anrechnung', 'anerkennung', 'umstieg', 'wechsel', 'studienwechsel', 'fächer anrechnen'],
      response: 'Bei Anrechnungen und Studienwechsel helfen wir dir gerne! Du kannst dir unter Umständen bereits absolvierte LVAs für dein neues Studium anrechnen lassen. Am besten buchst du dafür eine Sprechstunde bei uns oder nutzt das Kontaktformular mit dem Anliegen "Sonstiges".',
      buttons: [
        { label: 'Sprechstunde', query: 'sprechstunden' },
        { label: 'Kontaktformular', link: '/contact' },
      ],
    },
    {
      id: 'problem_prof',
      keywords: ['problem professor', 'problem lehrende', 'ungerecht', 'unfair', 'beschwerde', 'note falsch', 'benotung'],
      response: 'Bei Problemen mit Lehrenden oder einer unfairen Benotung sind wir für dich da. Nutze unser Kontaktformular mit dem Anliegen "Problem mit Lehrenden" und beschreibe die Situation. Wir behandeln alles vertraulich und setzen uns für dich ein!',
      buttons: [
        { label: 'Kontaktformular', link: '/contact' },
        { label: 'Sprechstunde', query: 'sprechstunden' },
      ],
    },
  ],

  quickActions: [
    { label: 'Studiengänge', query: 'welche studiengänge' },
    { label: 'Kontakt & FAQ', query: 'kontakt' },
    { label: 'LVA-Bewertungen', query: 'lva' },
    { label: 'Erstsemester-Tipps', query: 'erstsemester' },
    { label: 'JKU Info', query: 'was ist jku' },
    { label: 'Sprechstunden', query: 'sprechstunden' },
  ],

  fallback: {
    response: 'Da bin ich mir leider nicht sicher. Für persönliche Hilfe erreichst du uns am besten über das Kontaktformular oder bei einer Sprechstunde. Wir helfen dir gerne weiter!',
    buttons: [
      { label: 'Kontaktformular', link: '/contact' },
      { label: 'Sprechstunde buchen', query: 'sprechstunden' },
      { label: 'FAQ ansehen', link: '/contact' },
    ],
  },
};

export default knowledge;
