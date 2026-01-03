import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AddHabitScreen from '../screens/AddHabitScreen';

export type RootStackParamList = {
  Home: undefined;
  AddHabit: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Habits' }} />
        <Stack.Screen name="AddHabit" component={AddHabitScreen} options={{ title: 'New Habit' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
