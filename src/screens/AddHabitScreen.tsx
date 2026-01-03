import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { saveHabit } from '../utilities/storage';
import { QuestionType } from '../utilities/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddHabit'>;

export default function AddHabitScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [type, setType] = useState<QuestionType>('yes-no');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }
    if (!questionText.trim()) {
      Alert.alert('Error', 'Please enter a question text');
      return;
    }

    const newHabit = {
      id: Date.now().toString(),
      name,
      questionText,
      type,
      createdAt: new Date().toISOString(),
    };

    await saveHabit(newHabit);
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Habit Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Meditation"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Question Text</Text>
      <TextInput
        style={styles.input}
        placeholder={
          type === 'yes-no'
            ? 'e.g. Did you meditate today?'
            : 'e.g. How many minutes did you meditate?'
        }
        value={questionText}
        onChangeText={setQuestionText}
      />

      <Text style={styles.label}>Tracking Type</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'yes-no' && styles.typeButtonSelected,
          ]}
          onPress={() => setType('yes-no')}
        >
          <Text
            style={[
              styles.typeText,
              type === 'yes-no' && styles.typeTextSelected,
            ]}
          >
            Yes / No
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === 'fill-in' && styles.typeButtonSelected,
          ]}
          onPress={() => setType('fill-in')}
        >
          <Text
            style={[
              styles.typeText,
              type === 'fill-in' && styles.typeTextSelected,
            ]}
          >
            Fill In
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Create Habit</Text>
      </TouchableOpacity>
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
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  typeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeText: {
    fontSize: 16,
    color: '#333',
  },
  typeTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
