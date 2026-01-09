import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Switch, 
    ScrollView, 
    Platform, 
    TouchableOpacity, 
    Alert,
    KeyboardAvoidingView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { saveHabit } from '../utilities/storage';
import { Habit } from '../utilities/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { registerForPushNotificationsAsync, scheduleHabitReminder } from '../utilities/notifications';
import { THEME } from '../utilities/theme';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'AddHabit'>;

export default function AddHabitScreen({ navigation }: Props) {
  const [habitName, setHabitName] = useState('');
  const [question, setQuestion] = useState('');
  const [isTrackTypeYesNo, setIsTrackTypeYesNo] = useState(true);
  
  // New Fields
  const [frequency, setFrequency] = useState<'everyday' | 'weekly' | 'custom'>('everyday');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
      registerForPushNotificationsAsync();
  }, []);

  useLayoutEffect(() => {
      navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleSave = async () => {
    if (!habitName.trim() || !question.trim()) {
      Alert.alert('Missing Information', 'Please enter a habit name and a question.');
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name: habitName,
      questionText: question,
      type: isTrackTypeYesNo ? 'yes-no' : 'fill-in',
      createdAt: new Date().toISOString(),
      frequency,
      description: notes,
      reminderTime: reminderEnabled ? reminderTime.toISOString() : null,
    };
    
    if (reminderEnabled) {
        try {
            const notifId = await scheduleHabitReminder(
                `Time for ${habitName}!`, 
                question, 
                reminderTime
            );
            newHabit.notificationId = notifId;
        } catch (e) {
            console.error("Failed to schedule notification", e);
            Alert.alert("Notification Error", "Could not schedule reminder, but habit will be saved.");
        }
    }

    await saveHabit(newHabit);
    navigation.goBack();
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
      setShowTimePicker(Platform.OS === 'ios');
      if (selectedDate) {
          setReminderTime(selectedDate);
      }
  };

  return (
    <View style={styles.screen}>
        <Header 
            title="New Habit" 
            showBack 
            onBack={() => navigation.goBack()} 
        />
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.container}>
            
            <Card style={styles.sectionCard}>
                <Text style={styles.label}>What do you want to track?</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Read Books, Drink Water"
                    value={habitName}
                    onChangeText={setHabitName}
                    placeholderTextColor={THEME.colors.textLight}
                />

                <Text style={styles.label}>Question for yourself?</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Did I read 10 pages today?"
                    value={question}
                    onChangeText={setQuestion}
                    placeholderTextColor={THEME.colors.textLight}
                />
            </Card>

            <Card style={styles.sectionCard}>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.label}>Tracking Style</Text>
                        <Text style={styles.subLabel}>
                            {isTrackTypeYesNo ? 'Simple Yes/No' : 'Numeric Value (e.g. 5 cups)'}
                        </Text>
                    </View>
                    <Switch 
                        value={isTrackTypeYesNo} 
                        onValueChange={setIsTrackTypeYesNo} 
                        trackColor={{ false: '#767577', true: THEME.colors.primary }}
                        thumbColor={'#f4f3f4'}
                    />
                </View>
            </Card>

            <Card style={styles.sectionCard}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.pillContainer}>
                    {['everyday', 'weekly', 'custom'].map((f) => {
                        let iconName: any = 'calendar';
                        if (f === 'everyday') iconName = 'infinite';
                        if (f === 'weekly') iconName = 'calendar';
                        if (f === 'custom') iconName = 'options';

                        return (
                        <TouchableOpacity 
                            key={f} 
                            style={[
                                styles.pill, 
                                frequency === f && styles.pillActive
                            ]}
                            onPress={() => setFrequency(f as any)}
                        >
                            <Ionicons 
                                name={iconName} 
                                size={16} 
                                color={frequency === f ? THEME.colors.primary : THEME.colors.textLight} 
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[
                                styles.pillText, 
                                frequency === f && styles.pillTextActive
                            ]}>
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                        )
                    })}
                </View>
            </Card>

            <Card style={styles.sectionCard}>
                <View style={styles.row}>
                    <View>
                        <Text style={styles.label}>Daily Reminder</Text>
                        <Text style={styles.subLabel}>Get notified to complete this habit</Text>
                    </View>
                    <Switch 
                        value={reminderEnabled} 
                        onValueChange={setReminderEnabled}
                        trackColor={{ false: '#767577', true: THEME.colors.primary }} 
                    />
                </View>
                
                {reminderEnabled && (
                    <View style={styles.timePickerContainer}>
                        <Text style={styles.timeDisplay}>
                            {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Button 
                            title="Set Time" 
                            variant="outline" 
                            size="sm" 
                            onPress={() => setShowTimePicker(true)} 
                        />
                        {showTimePicker && (
                            <DateTimePicker
                                value={reminderTime}
                                mode="time"
                                display="default"
                                onChange={onTimeChange}
                            />
                        )}
                    </View>
                )}
            </Card>

            <Card style={styles.sectionCard}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add any motivations or details..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={THEME.colors.textLight}
                />
            </Card>

            <View style={styles.footer}>
                <Button title="Create Habit" onPress={handleSave} size="lg" />
            </View>

            </ScrollView>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
      flex: 1,
      backgroundColor: THEME.colors.background
  },
  container: {
    padding: THEME.spacing.md,
    paddingBottom: 100
  },
  sectionCard: {
      marginBottom: THEME.spacing.md,
      padding: THEME.spacing.lg
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: THEME.colors.text,
  },
  subLabel: {
      fontSize: 12,
      color: THEME.colors.textLight,
      marginTop: 2
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: THEME.colors.background,
    color: THEME.colors.text
  },
  textArea: {
      height: 80,
      textAlignVertical: 'top'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillContainer: {
      flexDirection: 'row',
      marginTop: 8
  },
  pill: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: THEME.borderRadius.round,
      backgroundColor: THEME.colors.background,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: THEME.colors.border
  },
  pillActive: {
      backgroundColor: THEME.colors.primary + '15', // light tint
      borderColor: THEME.colors.primary
  },
  pillText: {
      color: THEME.colors.textLight,
      fontSize: 14
  },
  pillTextActive: {
      color: THEME.colors.primary,
      fontWeight: 'bold'
  },
  timePickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      justifyContent: 'space-between',
      backgroundColor: THEME.colors.background,
      padding: 12,
      borderRadius: THEME.borderRadius.md
  },
  timeDisplay: {
      fontSize: 18,
      fontWeight: 'bold',
      color: THEME.colors.text
  },
  footer: {
      marginTop: 20
  }
});
