import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export default function OnboardingScreen({ navigation }: Props) {
  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('@hasLaunched', 'true');
      navigation.replace('Home');
    } catch (e) {
      console.error('Failed to save onboarding status', e);
    }
  };

  const DoneButton = ({ ...props }) => (
      <TouchableOpacity style={styles.doneButton} {...props}>
          <Text style={styles.doneText}>Get Started</Text>
      </TouchableOpacity>
  );

  return (
    <Onboarding
      onDone={handleDone}
      onSkip={handleDone}
      DoneButtonComponent={DoneButton}
      pages={[
        {
          backgroundColor: '#fff',
          image: <View style={styles.imagePlaceholder}><Text style={styles.emoji}>🌱</Text></View>,
          title: 'Welcome to Habit Tracker',
          subtitle: 'Build better habits, one day at a time.',
        },
        {
          backgroundColor: '#fff',
          image: <View style={styles.imagePlaceholder}><Text style={styles.emoji}>✅</Text></View>,
          title: 'Track Your Progress',
          subtitle: 'Log your daily habits and see your streaks grow.',
        },
        {
          backgroundColor: '#fff',
          image: <View style={styles.imagePlaceholder}><Text style={styles.emoji}>📊</Text></View>,
          title: 'Analyze Your Success',
          subtitle: 'View detailed analytics and visualize your consistency.',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
    imagePlaceholder: {
        width: 150,
        height: 150,
        backgroundColor: '#f0f9f0',
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    emoji: {
        fontSize: 60
    },
    doneButton: {
        marginRight: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007AFF',
        borderRadius: 20
    },
    doneText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});
