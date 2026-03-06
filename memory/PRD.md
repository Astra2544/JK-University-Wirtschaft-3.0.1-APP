# ÖH Wirtschaft Website - PRD

## Original Problem Statement
Multiple changes requested:
1. Admin Dashboard Desktop sidebar scrolling fix
2. Change oeh.jku.at links to oeh.jku.at/wirtschaft
3. Team page names not truncated on mobile
4. LVA-Check to Course Check in English menu
5. Marquee text change from "Wir kämpfen für dich" to "Wir setzen uns für dich ein"
6. Partner limit from 6 to 8
7. LVA description add note about problematic courses
8. LVA page Top 5 best and Top 5 hardest instead of Top 10
9. Instagram embed hardcoded with EmbedSocial hashtag code

## Architecture
- Frontend: React.js with Tailwind CSS
- Backend: FastAPI with SQLite
- Multi-language support (DE/EN)

## User Personas
- Students looking for LVA information
- ÖH Team members managing content
- Admin users managing the website

## Core Requirements (Static)
- Responsive design for mobile and desktop
- German as primary language, English as secondary
- Admin dashboard for content management
- LVA rating system
- Team member display
- News and events management

## What's Been Implemented (Feb 17, 2026)
### UI/UX Changes
- ✅ Admin Desktop sidebar now scrollable (removed overflow-hidden)
- ✅ Marquee text changed to "Wir setzen uns für dich ein"
- ✅ Team names on mobile: break-words instead of truncate
- ✅ English translation: "LVA-Check" → "Course Check"

### Link Updates
- ✅ Footer oeh.jku.at → oeh.jku.at/wirtschaft
- ✅ Hero ÖH JKU link → oeh.jku.at/wirtschaft

### LVA Changes
- ✅ Top 5 Beste + Top 5 Schwerste (instead of Top 10)
- ✅ New API endpoint returns {best: [], hardest: []}
- ✅ Added step 4 about problematic courses identification

### Partner Section
- ✅ Partner limit increased to 8

### Instagram
- ✅ EmbedSocial hashtag widget hardcoded with ref a9db327a2fe2e814a251e2fddb9719f2fc984c28

## Prioritized Backlog
### P0 (Done)
- All requested changes implemented

### P1 (Future)
- Add more partner logos
- Improve LVA search functionality

### P2 (Nice to have)
- Dark mode support
- PWA capabilities

## Next Tasks
- Monitor EmbedSocial widget performance
- Consider adding more analytics
