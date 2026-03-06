/**
 * API Configuration
 * Backend URL für die ÖH Wirtschaft API
 */

import Constants from 'expo-constants';

// API Base URL - kann über app.json extra config überschrieben werden
export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://mobile-replica-14.preview.emergentagent.com';

// API Endpoints
export const ENDPOINTS = {
  // News
  NEWS: '/api/news',
  
  // Events / Calendar
  EVENTS: '/api/events',
  EVENTS_TAGS: '/api/events/tags',
  EVENT_REGISTER: (id) => `/api/events/${id}/register`,
  
  // Team / Assets
  ASSETS: '/api/assets',
  ASSET: (key) => `/api/assets/${encodeURIComponent(key)}`,
  
  // Study Programs
  STUDY_CATEGORIES: '/api/study/categories',
  STUDY_UPDATES: '/api/study/updates/grouped',
  
  // LVA
  LVAS: '/api/lvas',
  LVAS_TOP: '/api/lvas/top',
  LVAS_STATS: '/api/lvas/stats',
  LVA_REQUEST_CODE: '/api/lva/request-code',
  LVA_VERIFY_CODE: '/api/lva/verify-code',
  LVA_SUBMIT_RATING: '/api/lva/submit-rating',
  
  // Partners
  PARTNERS: '/api/partners',
  
  // Survey
  SURVEY_ACTIVE: '/api/survey/active',
  SURVEY_SUBMIT: (id) => `/api/survey/${id}/submit`,
  
  // Site Settings
  SITE_SETTINGS: '/api/site-settings',
  
  // Contact
  CONTACT: '/api/contact',
};

// Fetch helper with error handling
export async function apiFetch<T>(
  endpoint,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// FormData fetch for file uploads
export async function apiFormDataFetch<T>(
  endpoint,
  formData: FormData
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}
