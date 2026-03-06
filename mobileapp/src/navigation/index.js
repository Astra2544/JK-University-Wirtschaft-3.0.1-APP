/**
 * Navigation - ÖH Wirtschaft Mobile App
 * Bottom Tab Navigation + Stack Navigation
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import { Colors } from '../constants/Colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import NewsScreen from '../screens/NewsScreen';
import KalenderScreen from '../screens/KalenderScreen';
import TeamScreen from '../screens/TeamScreen';
import ContactScreen from '../screens/ContactScreen';
import MoreScreen from '../screens/MoreScreen';
import StudiumScreen from '../screens/StudiumScreen';
import LVAScreen from '../screens/LVAScreen';
import MagazineScreen from '../screens/MagazineScreen';
import StudienplanerScreen from '../screens/StudienplanerScreen';
import ImpressumScreen from '../screens/ImpressumScreen';
import DatenschutzScreen from '../screens/DatenschutzScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

// News Stack
function NewsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewsMain" component={NewsScreen} />
    </Stack.Navigator>
  );
}

// Kalender Stack
function KalenderStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="KalenderMain" component={KalenderScreen} />
    </Stack.Navigator>
  );
}

// Team Stack
function TeamStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeamMain" component={TeamScreen} />
    </Stack.Navigator>
  );
}

// More Stack (contains sub-pages)
function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreMain" component={MoreScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Studium" component={StudiumScreen} />
      <Stack.Screen name="LVA" component={LVAScreen} />
      <Stack.Screen name="Magazine" component={MagazineScreen} />
      <Stack.Screen name="Studienplaner" component={StudienplanerScreen} />
      <Stack.Screen name="Impressum" component={ImpressumScreen} />
      <Stack.Screen name="Datenschutz" component={DatenschutzScreen} />
    </Stack.Navigator>
  );
}

export function Navigation() {
  const { t } = useTranslation();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.blue500,
          tabBarInactiveTintColor: Colors.slate400,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarLabel: t('nav.home'),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="News"
          component={NewsStack}
          options={{
            tabBarLabel: t('nav.news'),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Kalender"
          component={KalenderStack}
          options={{
            tabBarLabel: t('nav.kalender'),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Team"
          component={TeamStack}
          options={{
            tabBarLabel: t('nav.team'),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="More"
          component={MoreStack}
          options={{
            tabBarLabel: t('nav.mehr'),
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'menu' : 'menu-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.slate100,
    paddingTop: 8,
    paddingBottom: 8,
    height: 65,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
