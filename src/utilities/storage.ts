import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, Entry } from './types';

const HABITS_KEY = '@habits';
const ENTRIES_KEY = '@entries';

export const saveHabit = async (habit: Habit): Promise<void> => {
  try {
    const storedHabits = await getHabits();
    const updatedHabits = [...storedHabits, habit];
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updatedHabits));
  } catch (e) {
    console.error('Failed to save habit', e);
  }
};

export const getHabits = async (): Promise<Habit[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(HABITS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to fetch habits', e);
    return [];
  }
};

export const saveEntry = async (entry: Entry): Promise<void> => {
  try {
    const storedEntries = await getAllEntries();
    // Check if entry already exists for this habit and date, update if so
    const index = storedEntries.findIndex(
      (e) => e.habitId === entry.habitId && e.date === entry.date
    );

    let updatedEntries;
    if (index >= 0) {
      storedEntries[index] = entry;
      updatedEntries = storedEntries;
    } else {
      updatedEntries = [...storedEntries, entry];
    }
    
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(updatedEntries));
  } catch (e) {
    console.error('Failed to save entry', e);
  }
};

const getAllEntries = async (): Promise<Entry[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(ENTRIES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to fetch entries', e);
    return [];
  }
};

export const getEntriesForDate = async (date: string): Promise<Entry[]> => {
  const allEntries = await getAllEntries();
  return allEntries.filter((e) => e.date === date);
};

export const getEntriesForHabit = async (habitId: string): Promise<Entry[]> => {
    const allEntries = await getAllEntries();
    return allEntries.filter((e) => e.habitId === habitId);
}

export const getEntriesBetweenDates = async (startDate: string, endDate: string): Promise<Entry[]> => {
  const allEntries = await getAllEntries();
  return allEntries.filter((e) => e.date >= startDate && e.date <= endDate);
};

export const updateHabit = async (updatedHabit: Habit): Promise<void> => {
  try {
    const habits = await getHabits();
    const newHabits = habits.map(h => h.id === updatedHabit.id ? updatedHabit : h);
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(newHabits));
  } catch (e) {
    console.error('Failed to update habit', e);
  }
};
