import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Switch, ScrollView, Platform, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { saveHabit } from '../utilities/storage';
import { Habit } from '../utilities/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { registerForPushNotificationsAsync, scheduleHabitReminder } from '../utilities/notifications';

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

  const handleSave = async () => {
    if (!habitName.trim() || !question.trim()) {
      alert('Please enter a habit name and question');
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
    
    // Schedule Notification if enabled
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Habit Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Reading, Exercise"
        value={habitName}
        onChangeText={setHabitName}
      />

      <Text style={styles.label}>Question to ask yourself?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Did I read 10 pages today?"
        value={question}
        onChangeText={setQuestion}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Track Type</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{isTrackTypeYesNo ? 'Yes/No' : 'Numeric'}</Text>
          <Switch value={isTrackTypeYesNo} onValueChange={setIsTrackTypeYesNo} />
        </View>
      </View>

      {/* Frequency Selector */}
      <Text style={styles.label}>Frequency</Text>
      <View style={styles.pillContainer}>
          {['everyday', 'weekly', 'custom'].map((f) => (
              <TouchableOpacity 
                key={f} 
                style={[styles.pill, frequency === f && styles.pillActive]}
                onPress={() => setFrequency(f as any)}
              >
                  <Text style={[styles.pillText, frequency === f && styles.pillTextActive]}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
              </TouchableOpacity>
          ))}
      </View>

      {/* Reminder Section */}
      <View style={[styles.row, { marginTop: 20 }]}>
          <Text style={styles.label}>Daily Reminder</Text>
          <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
      </View>
      
      {reminderEnabled && (
          <View style={styles.timePickerContainer}>
               <Text style={styles.timeDisplay}>
                   {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </Text>
               <Button title="Set Time" onPress={() => setShowTimePicker(true)} />
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

      {/* Notes Section */}
      <Text style={[styles.label, { marginTop: 20 }]}>Notes (Optional)</Text>
      <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add any details..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
      />

      <Button title="Save Habit" onPress={handleSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  textArea: {
      height: 80,
      textAlignVertical: 'top'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 10,
    fontSize: 16,
    color: '#555',
  },
  pillContainer: {
      flexDirection: 'row',
      marginBottom: 20
  },
  pill: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      marginRight: 10
  },
  pillActive: {
      backgroundColor: '#007AFF'
  },
  pillText: {
      color: '#333'
  },
  pillTextActive: {
      color: '#fff',
      fontWeight: 'bold'
  },
  timePickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      justifyContent: 'space-between',
      backgroundColor: '#f9f9f9',
      padding: 10,
      borderRadius: 8
  },
  timeDisplay: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333'
  }
});
