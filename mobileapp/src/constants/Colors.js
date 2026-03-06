/**
 * Colors - ÖH Wirtschaft Brand Colors
 * Identisch zur Website
 */

export const Colors = {
  // Primary Colors
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue400: '#60A5FA',
  blue100: '#DBEAFE',
  blue50: '#EFF6FF',
  
  // Gold/Amber Colors
  gold500: '#EAB308',
  gold600: '#CA8A04',
  gold400: '#FACC15',
  gold100: '#FEF3C7',
  gold50: '#FFFBEB',
  
  // Slate Colors
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  
  // Other Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Status Colors
  green500: '#22C55E',
  green100: '#DCFCE7',
  green50: '#F0FDF4',
  
  red500: '#EF4444',
  red100: '#FEE2E2',
  red50: '#FEF2F2',
  
  orange500: '#F97316',
  orange100: '#FFEDD5',
  orange50: '#FFF7ED',
  
  purple500: '#A855F7',
  purple100: '#F3E8FF',
  purple50: '#FAF5FF',
  
  pink500: '#EC4899',
  pink100: '#FCE7F3',
  pink50: '#FDF2F8',
  
  teal500: '#14B8A6',
  teal100: '#CCFBF1',
  teal50: '#F0FDFA',
  
  amber500: '#F59E0B',
  amber100: '#FEF3C7',
  amber50: '#FFFBEB',
  
  emerald500: '#10B981',
  emerald100: '#D1FAE5',
  emerald50: '#ECFDF5',
  
  // Additional colors used in app
  gold200: '#FDE68A',
  gold300: '#FCD34D',
  gold700: '#B45309',
  blue200: '#BFDBFE',
  blue700: '#1D4ED8',
};

// Color Maps for Events
export const EventColorMap = {
  blue: { bg: Colors.blue100, text: Colors.blue600, border: Colors.blue200, dot: Colors.blue500 },
  gold: { bg: Colors.amber100, text: Colors.amber500, border: Colors.amber500, dot: Colors.amber500 },
  green: { bg: Colors.emerald100, text: Colors.emerald500, border: Colors.emerald500, dot: Colors.emerald500 },
  red: { bg: Colors.red100, text: Colors.red500, border: Colors.red500, dot: Colors.red500 },
  purple: { bg: Colors.purple100, text: Colors.purple500, border: Colors.purple500, dot: Colors.purple500 },
  pink: { bg: Colors.pink100, text: Colors.pink500, border: Colors.pink500, dot: Colors.pink500 },
  teal: { bg: Colors.teal100, text: Colors.teal500, border: Colors.teal500, dot: Colors.teal500 },
  orange: { bg: Colors.orange100, text: Colors.orange500, border: Colors.orange500, dot: Colors.orange500 },
};

// Priority Colors
export const PriorityColors = {
  urgent: { bg: Colors.red50, border: Colors.red100, text: Colors.red500, badge: Colors.red100 },
  high: { bg: Colors.orange50, border: Colors.orange100, text: Colors.orange500, badge: Colors.orange100 },
  medium: { bg: Colors.blue50, border: Colors.blue100, text: Colors.blue500, badge: Colors.blue100 },
  low: { bg: Colors.slate50, border: Colors.slate100, text: Colors.slate500, badge: Colors.slate100 },
};
