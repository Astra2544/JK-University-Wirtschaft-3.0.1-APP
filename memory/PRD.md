# ÖH Wirtschaft Website & Mobile App - PRD

## Original Problem Statement
Create a 1:1 identical mobile app replica of the existing ÖH Wirtschaft website using React Native with Expo.

### Key Requirements:
- The mobile app must be placed in `/app/mobileapp` directory
- NO changes to the existing web project or database
- Connect to the same backend API as the website
- Compatible with both iOS and Android
- User handles testing and deployment via Expo Go

## Architecture

### Web Application (Existing)
- Frontend: React.js with Tailwind CSS
- Backend: FastAPI with SQLite
- Multi-language support (DE/EN)

### Mobile Application (NEW - December 2025)
- Framework: React Native with Expo
- Navigation: React Navigation (Bottom Tabs + Stack)
- State: React hooks
- i18n: react-i18next (DE/EN)
- API: Same backend as web app
- Styling: React Native StyleSheet (1:1 copy of website styles)

## User Personas
- Students looking for LVA information
- ÖH Team members managing content
- Admin users managing the website

## Core Requirements (Static)
- Responsive design for mobile and desktop
- German as primary language, English as secondary
- Admin dashboard for content management (Web only)
- LVA rating system
- Team member display
- News and events management

## What's Been Implemented

### Mobile App (December 2025) - COMPLETE
All screens implemented as 1:1 copy of website:

#### Screens (12 total)
- ✅ HomeScreen - Hero, Quick Links, About, Stats, Programs, CTA
- ✅ NewsScreen - News list with filters (urgent/high/medium/low), pinned posts
- ✅ TeamScreen - Vorsitzender, Bereichsleiter, Stellvertreter, weitere Mitglieder
- ✅ KalenderScreen - Calendar view with events, month navigation, event details modal
- ✅ MoreScreen - Navigation to all sub-pages, language switch, external links
- ✅ ContactScreen - Contact form, FAQ, Sprechstunden, WhatsApp info
- ✅ StudiumScreen - Programs list, Studienplaner CTA, Updates
- ✅ LVAScreen - Course search, ratings, Top 5 Best/Hardest
- ✅ MagazineScreen - Ceteris Paribus magazine info, contribute section
- ✅ StudienplanerScreen - Study planner links for WiWi, BWL, IBA
- ✅ ImpressumScreen - Legal impressum
- ✅ DatenschutzScreen - Privacy policy

#### Components (5 total)
- ✅ Header - Page headers with back button support
- ✅ Card - QuickLinkCard, StatCard, InfoCard, CtaCard
- ✅ SectionHeader - Section titles with accent bars
- ✅ LoadingSpinner - Loading states
- ✅ EmptyState - Empty data displays

#### Features
- ✅ Bottom Tab Navigation (Home, News, Kalender, Team, More)
- ✅ Stack Navigation for sub-pages
- ✅ Pull-to-refresh on all data screens
- ✅ i18n with German and English translations
- ✅ API integration with existing backend
- ✅ Brand colors matching website (blue, gold, slate)
- ✅ Safe area handling for iOS notch
- ✅ Gesture handling for swipe navigation

#### Configuration
- ✅ app.json - App name, icons, splash screen, bundle IDs
- ✅ package.json - All dependencies installed
- ✅ tsconfig.json - TypeScript configuration
- ✅ Assets - Icon, splash, favicon, adaptive icon

### Previous Web Changes (Feb 17, 2026)
- ✅ Admin Desktop sidebar now scrollable
- ✅ Marquee text changed to "Wir setzen uns für dich ein"
- ✅ Team names on mobile: break-words instead of truncate
- ✅ English translation: "LVA-Check" → "Course Check"
- ✅ Footer oeh.jku.at → oeh.jku.at/wirtschaft
- ✅ Top 5 Beste + Top 5 Schwerste (instead of Top 10)
- ✅ Partner limit increased to 8
- ✅ EmbedSocial hashtag widget implemented

## API Endpoints Used by Mobile App
- `/api/news` - News articles
- `/api/events` - Calendar events
- `/api/study/categories` - Study programs
- `/api/study/updates/grouped` - Program updates
- `/api/lvas/top` - Top rated courses
- `/api/lvas?search=` - Course search
- `/api/contact` - Contact form submission
- `/api/assets/{key}` - Team member photos

## File Structure

```
/app/mobileapp/
├── App.tsx                 # Main entry point
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── assets/                 # App icons and splash
│   ├── icon.png
│   ├── splash.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── src/
    ├── components/         # Reusable UI components
    │   ├── Card.tsx
    │   ├── EmptyState.tsx
    │   ├── Header.tsx
    │   ├── LoadingSpinner.tsx
    │   └── SectionHeader.tsx
    ├── constants/          # App constants
    │   ├── Api.ts
    │   ├── Colors.ts
    │   └── index.ts
    ├── i18n/               # Translations
    │   ├── de.ts
    │   ├── en.ts
    │   └── index.ts
    ├── navigation/         # Navigation setup
    │   └── index.tsx
    └── screens/            # All app screens
        ├── HomeScreen.tsx
        ├── NewsScreen.tsx
        ├── TeamScreen.tsx
        ├── KalenderScreen.tsx
        ├── MoreScreen.tsx
        ├── ContactScreen.tsx
        ├── StudiumScreen.tsx
        ├── LVAScreen.tsx
        ├── MagazineScreen.tsx
        ├── StudienplanerScreen.tsx
        ├── ImpressumScreen.tsx
        └── DatenschutzScreen.tsx
```

## Prioritized Backlog

### P0 (Complete)
- ✅ Mobile app fully implemented with all screens
- ✅ API integration with existing backend
- ✅ i18n support (DE/EN)

### P1 (Future Enhancements)
- Push notifications (user mentioned "no push notifications for now")
- Team member photos from API assets
- Offline caching
- Deep linking support

### P2 (Nice to have)
- Dark mode support
- Biometric authentication for future features
- App store optimization assets

## Testing Instructions
1. Navigate to `/app/mobileapp`
2. Run `npx expo start`
3. Scan QR code with Expo Go app on iOS/Android
4. Test all screens and navigation
5. Test with both German and English language settings

## Notes
- The mobile app uses the same backend API as the web version
- API URL is configured in `/app/mobileapp/app.json` under `extra.apiUrl`
- All team data is hardcoded in TeamScreen.tsx (matching website)
- User handles all testing via Expo Go client
