import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from './src/screens/HomeScreen';
import { NewContractScreen } from './src/screens/NewContractScreen';
import { SignatureScreen } from './src/screens/SignatureScreen';
import { ContractDetailScreen } from './src/screens/ContractDetailScreen';
import { PropertiesScreen } from './src/screens/PropertiesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AiCopywriterScreen } from './src/screens/AiCopywriterScreen';
import { SmartMatchScreen } from './src/screens/SmartMatchScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { CalculatorScreen } from './src/screens/CalculatorScreen';
import { QrSignScreen } from './src/screens/QrSignScreen';
import { RentIncreaseScreen } from './src/screens/RentIncreaseScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';
import { VoiceMemoScreen } from './src/screens/VoiceMemoScreen';
import { DigitalCardScreen } from './src/screens/DigitalCardScreen';
import { EvictionScreen } from './src/screens/EvictionScreen';
import { ValuationScreen } from './src/screens/ValuationScreen';
import { LeadHubScreen } from './src/screens/LeadHubScreen';
import { TeamManagementScreen } from './src/screens/TeamManagementScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { LandingScreen } from './src/screens/LandingScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { subscribeAuth, loadSavedAuth, UserProfile } from './src/services/authService';
import { COLORS } from './src/constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';
          if (route.name === 'HomeTab') {
            iconName = focused ? 'apps' : 'apps-outline';
          } else if (route.name === 'PropertiesTab') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'LeadsTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'CalculatorTab') {
            iconName = focused ? 'calculator' : 'calculator-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Ana Panel' }}
      />
      <Tab.Screen
        name="PropertiesTab"
        component={PropertiesScreen}
        options={{ title: 'Portföyüm' }}
      />
      <Tab.Screen
        name="LeadsTab"
        component={LeadHubScreen}
        options={{ title: 'Müşteriler' }}
      />
      <Tab.Screen
        name="CalculatorTab"
        component={CalculatorScreen}
        options={{ title: 'Harç/Kredi' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profil & Ofis' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAuthScreen, setShowAuthScreen] = useState(false);

  useEffect(() => {
    loadSavedAuth()
      .then(user => {
        setCurrentUser(user);
        setIsAuthLoading(false);
      })
      .catch(() => {
        setIsAuthLoading(false);
      });

    const unsubscribe = subscribeAuth(user => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // 1. AÇILIŞ VE KALICI OTURUM YÜKLENİYOR
  if (isAuthLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  // 2. OTURUM AÇILMAMIŞ: LANDING VEYA AUTH
  if (!currentUser?.isLoggedIn) {
    if (showAuthScreen) {
      return (
        <SafeAreaProvider>
          <StatusBar style="light" />
          <LoginScreen
            onBackToLanding={() => setShowAuthScreen(false)}
            onLoginSuccess={() => setShowAuthScreen(false)}
          />
        </SafeAreaProvider>
      );
    }

    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LandingScreen
          onStart={() => setShowAuthScreen(true)}
          onLogin={() => setShowAuthScreen(true)}
        />
      </SafeAreaProvider>
    );
  }

  // 3. İLK GİRİŞ VE ONBOARDING KURULUM SİHİRBAZI
  if (!currentUser.hasCompletedOnboarding) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OnboardingScreen
          onComplete={() => {}}
          onSkip={() => {}}
        />
      </SafeAreaProvider>
    );
  }

  // 4. TAM KURULMUŞ OFİS VE ANA UYGULAMA PANELİ

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="NewContract" component={NewContractScreen} />
          <Stack.Screen name="Signature" component={SignatureScreen} />
          <Stack.Screen name="ContractDetail" component={ContractDetailScreen} />
          <Stack.Screen name="AiCopywriter" component={AiCopywriterScreen} />
          <Stack.Screen name="SmartMatch" component={SmartMatchScreen} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="Calculator" component={CalculatorScreen} />
          <Stack.Screen name="QrSign" component={QrSignScreen} />
          <Stack.Screen name="RentIncrease" component={RentIncreaseScreen} />
          <Stack.Screen name="Inventory" component={InventoryScreen} />
          <Stack.Screen name="VoiceMemo" component={VoiceMemoScreen} />
          <Stack.Screen name="DigitalCard" component={DigitalCardScreen} />
          <Stack.Screen name="Eviction" component={EvictionScreen} />
          <Stack.Screen name="Valuation" component={ValuationScreen} />
          <Stack.Screen name="LeadHub" component={LeadHubScreen} />
          <Stack.Screen name="TeamManagement" component={TeamManagementScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
