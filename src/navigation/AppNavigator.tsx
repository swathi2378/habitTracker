import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import AddHabitScreen from '../screens/AddHabitScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import OverallReportScreen from '../screens/OverallReportScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  AddHabit: undefined;
  Analytics: { habitId: string; habitName: string };
  OverallReport: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@hasLaunched').then(value => {
        if (value === null) {
            setIsFirstLaunch(true);
        } else {
            setIsFirstLaunch(false);
        }
    });
  }, []);

  if (isFirstLaunch === null) {
      return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#007AFF" />
          </View>
      );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isFirstLaunch ? 'Onboarding' : 'Home'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Habits' }} />
        <Stack.Screen name="AddHabit" component={AddHabitScreen} options={{ title: 'New Habit' }} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />
        <Stack.Screen name="OverallReport" component={OverallReportScreen} options={{ title: 'Summary Report' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
